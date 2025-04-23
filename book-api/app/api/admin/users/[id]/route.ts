import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    if (id === user.id) {
      return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) })

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const hasBorrowedBooks = await db.collection("borrows").findOne({
      userId: id,
      returnedAt: null,
    })

    if (hasBorrowedBooks) {
      return NextResponse.json({ success: false, message: "Cannot delete user with borrowed books" }, { status: 400 })
    }

    await db.collection("users").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, message: "Failed to delete user" }, { status: 500 })
  }
}

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

    const userData = await request.json()
    const { db } = await connectToDatabase()

    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) })

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const updateData: any = {}

    if (userData.name) updateData.name = userData.name
    if (userData.email) updateData.email = userData.email

    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } })

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        user: {
          ...updatedUser,
          _id: updatedUser ? updatedUser._id.toString() : null,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 })
  }
}
