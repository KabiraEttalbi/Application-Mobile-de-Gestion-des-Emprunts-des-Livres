import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    const { role } = await request.json()

    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json({ success: false, message: "Invalid role. Must be 'admin' or 'user'" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) })

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    if (id === user.id) {
      return NextResponse.json({ success: false, message: "Cannot change your own role" }, { status: 400 })
    }

    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { role } })

    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } })

    return NextResponse.json(
      {
        success: true,
        message: "User role updated successfully",
        user: {
          ...updatedUser,
          _id: updatedUser ? updatedUser._id.toString() : null,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ success: false, message: "Failed to update user role" }, { status: 500 })
  }
}
