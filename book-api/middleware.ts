import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Skip authentication for login and register routes
  if (
    request.nextUrl.pathname.startsWith("/api/auth/login") ||
    request.nextUrl.pathname === "/api/auth" ||
    (request.nextUrl.pathname === "/api/users" && request.method === "POST")
  ) {
    return NextResponse.next()
  }

  // Get the token from the cookies or Authorization header
  const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

  // If no token, return unauthorized
  if (!token) {
    return new NextResponse(JSON.stringify({ success: false, message: "Authentication required" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }

  try {
    // Verify the token using jose instead of jsonwebtoken
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    const { payload } = await jose.jwtVerify(token, secret)

    // Add the user info to the request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("user", JSON.stringify(payload))

    // Return the response with the modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    // If token is invalid, return unauthorized
    return new NextResponse(JSON.stringify({ success: false, message: "Invalid token" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: "/api/:path*",
}
