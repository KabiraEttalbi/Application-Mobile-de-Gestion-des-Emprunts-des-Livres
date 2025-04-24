import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserIdFromToken } from "@/lib/auth-helpers"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const user = token ? getUserIdFromToken(token) : null

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const borrowId = params.id

    if (!ObjectId.isValid(borrowId)) {
      return NextResponse.json({ success: false, message: "Invalid borrow ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const borrow = await db.collection("borrows").findOne({
      _id: new ObjectId(borrowId),
      userId: user.userId,
      returnedAt: null,
    })

    if (!borrow) {
      return NextResponse.json(
        { success: false, message: "Borrow record not found or already returned" },
        { status: 404 },
      )
    }

    await db.collection("borrows").updateOne({ _id: new ObjectId(borrowId) }, { $set: { returnedAt: new Date() } })

    await db.collection("books").updateOne({ _id: new ObjectId(borrow.bookId) }, { $set: { available: true } })

    return NextResponse.json({ success: true, message: "Book returned successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error returning book:", error)
    return NextResponse.json({ success: false, message: "Failed to return book" }, { status: 500 })
  }
}
