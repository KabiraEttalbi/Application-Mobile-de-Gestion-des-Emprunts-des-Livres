import { type NextRequest, NextResponse } from "next/server"
import { compare } from "bcrypt"
import * as jose from "jose"
import { connectToDatabase } from "@/lib/mongodb"

// Add this export to specify Node.js runtime
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Find the user
    const user = await db.collection("users").findOne({ email })

    // Check if user exists
    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Check if password is correct
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Create a token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    const token = await new jose.SignJWT({
      id: user._id.toString(),
      email: user.email,
      role: user.role || "user",
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    // Create the response
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token: token, // Include token in the response body for client-side storage
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role || "user",
          name: user.name,
        },
      },
      { status: 200 },
    )

    // Set the token as an HTTP-only cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during login" }, { status: 500 })
  }
}
