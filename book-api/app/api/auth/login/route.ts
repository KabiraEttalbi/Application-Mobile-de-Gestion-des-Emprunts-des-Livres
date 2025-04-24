import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { comparePasswords, generateToken } from "@/lib/auth-helpers"
import { apiResponse } from "@/lib/api-response"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return apiResponse(400, { message: "Email and password are required" })
    }

    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return apiResponse(401, { message: "Invalid credentials" })
    }

    const isPasswordValid = await comparePasswords(password, user.password)

    if (!isPasswordValid) {
      return apiResponse(401, { message: "Invalid credentials" })
    }

    const token = generateToken(user)

    return apiResponse(200, {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return apiResponse(500, { message: "Internal server error" })
  }
}
