import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { hash } from "bcrypt"
import { getUserIdFromToken } from "@/lib/auth-helpers"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const user = token ? getUserIdFromToken(token) : null

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const userProfile = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.userId) }, { projection: { password: 0 } })

    if (!userProfile) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          ...userProfile,
          _id: userProfile._id.toString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const user = token ? getUserIdFromToken(token) : null

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const userData = await request.json()
    const { db } = await connectToDatabase()

    const updateData: any = {}

    if (userData.name) updateData.name = userData.name
    if (userData.email) updateData.email = userData.email

    if (userData.password) {
      updateData.password = await hash(userData.password, 10)
    }

    await db.collection("users").updateOne({ _id: new ObjectId(user.userId) }, { $set: updateData })

    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.userId) }, { projection: { password: 0 } })

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: {
          ...updatedUser,
          _id: updatedUser?._id.toString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 })
  }
}
