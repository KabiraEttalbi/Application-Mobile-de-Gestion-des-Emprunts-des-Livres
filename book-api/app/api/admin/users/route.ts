import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserIdFromToken } from "@/lib/auth-helpers"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const user = token ? getUserIdFromToken(token) : null

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const users = await db
      .collection("users")
      .find({})
      .project({ password: 0 }) 
      .toArray()

    const formattedUsers = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
    }))

    return NextResponse.json({ success: true, users: formattedUsers }, { status: 200 })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch users" }, { status: 500 })
  }
}
