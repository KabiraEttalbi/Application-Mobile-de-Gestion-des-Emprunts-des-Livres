import { type NextRequest, NextResponse } from "next/server"
import * as jose from "jose"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Add this export to specify Node.js runtime
export const runtime = "nodejs"

// GET to check authentication status
export async function GET(request: NextRequest) {
  try {
    // Get the token from the cookies or Authorization header
    const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    // Verify the token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    const { payload } = await jose.jwtVerify(token, secret)
    const decoded = payload as { id: string; email: string; role: string; name: string }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Find the user (without password)
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.id) }, { projection: { password: 0 } })

    if (!user) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Authentication check error:", error)
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
  }
}

// POST to logout
export async function POST(request: NextRequest) {
  // Create the response
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })

  // Clear the token cookie
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  })

  return response
}
