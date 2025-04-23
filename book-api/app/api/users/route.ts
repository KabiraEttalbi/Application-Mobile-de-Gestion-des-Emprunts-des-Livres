import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hash } from "bcrypt"
import { getUserFromRequest } from "@/lib/auth-helpers"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const users = await db
      .collection("users")
      .find({})
      .project({ password: 0 }) 
      .toArray()

    return NextResponse.json({ success: true, users }, { status: 200 })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch users" }, { status: 500 })
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
