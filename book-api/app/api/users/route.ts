import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { apiResponse, errorResponse } from "@/lib/api-response"
import { getUserRoleFromToken } from "@/lib/auth-helpers"
import { hash } from "bcrypt"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(401, "Authentication required")
    }

    const token = authHeader.split(" ")[1]
    const role = getUserRoleFromToken(token)

    if (!role) {
      return errorResponse(401, "Invalid token")
    }

    const { db } = await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")
    const email = searchParams.get("email")

    const query: any = {}
    if (name) query.name = { $regex: name, $options: "i" }
    if (email) query.email = { $regex: email, $options: "i" }

    const projection = role === "admin" ? { password: 0 } : { password: 0, email: 0, createdAt: 0, updatedAt: 0 }

    const users = await db.collection("users").find(query).project(projection).toArray()

    return apiResponse(200, { users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return errorResponse(500, "Internal server error")
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    if (!userData.email || !userData.password || !userData.name) {
      return NextResponse.json({ success: false, message: "Name, email, and password are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const existingUser = await db.collection("users").findOne({ email: userData.email })
    if (existingUser) {
      return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 409 })
    }

    const hashedPassword = await hash(userData.password, 10)

    const result = await db.collection("users").insertOne({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: "user", 
      createdAt: new Date(),
    })

    const user = await db.collection("users").findOne({ _id: result.insertedId }, { projection: { password: 0 } })

    return NextResponse.json({ success: true, message: "User registered successfully", user }, { status: 201 })
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json({ success: false, message: "Failed to register user" }, { status: 500 })
  }
}