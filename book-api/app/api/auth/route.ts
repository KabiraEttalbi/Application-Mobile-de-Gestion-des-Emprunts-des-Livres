import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth-helpers"
import { apiResponse } from "@/lib/api-response"
import { validateRegistration } from "@/lib/validation"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    const validationResult = validateRegistration(userData)
    if (!validationResult.isValid) {
      return apiResponse(400, { message: validationResult.message })
    }

    const { name, email, password } = userData

    const { db } = await connectToDatabase()

    const existingUser = await db.collection("users").findOne({ email })

    if (existingUser) {
      return apiResponse(409, { message: "User already exists with this email" })
    }

    const hashedPassword = await hashPassword(password)

    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
    })

    const newUser = await db.collection("users").findOne({ _id: result.insertedId })

    const token = generateToken(newUser)

    return apiResponse(201, {
      token,
      user: {
        _id: newUser?._id,
        name: newUser?.name,
        email: newUser?.email,
        role: newUser?.role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return apiResponse(500, { message: "Internal server error" })
  }
}
