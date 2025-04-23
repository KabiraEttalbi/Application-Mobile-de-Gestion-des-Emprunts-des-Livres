import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    if (id !== user.id && user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } })

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          ...targetUser,
          _id: targetUser._id.toString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    if (id !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Can only update your own profile" },
        { status: 403 },
      )
    }

    const userData = await request.json()
    const { db } = await connectToDatabase()

    const updateData: any = {}

    if (userData.name) updateData.name = userData.name
    if (userData.email) {
      const existingUser = await db.collection("users").findOne({
        email: userData.email,
        _id: { $ne: new ObjectId(id) },
      })

      if (existingUser) {
        return NextResponse.json({ success: false, message: "Email already in use" }, { status: 400 })
      }

      updateData.email = userData.email
    }

    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } })

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: {
          ...updatedUser,
          _id: updatedUser ? updatedUser._id.toString() : null,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 })
  }
}
