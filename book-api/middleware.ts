import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/api/auth/login") ||
    request.nextUrl.pathname === "/api/auth" ||
    (request.nextUrl.pathname === "/api/users" && request.method === "POST")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return new NextResponse(JSON.stringify({ success: false, message: "Authentication required" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    const { payload } = await jose.jwtVerify(token, secret)

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("user", JSON.stringify(payload))

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return new NextResponse(JSON.stringify({ success: false, message: "Invalid token" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }
}

export const config = {
  matcher: "/api/:path*",
}
