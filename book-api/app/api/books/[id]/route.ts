import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid book ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const book = await db.collection("books").findOne({ _id: new ObjectId(id) })

    if (!book) {
      return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, book }, { status: 200 })
  } catch (error) {
    console.error("Error fetching book:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch book" }, { status: 500 })
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
      return NextResponse.json({ success: false, message: "Invalid book ID" }, { status: 400 })
    }

    const bookData = await request.json()

    const { db } = await connectToDatabase()

    const existingBook = await db.collection("books").findOne({ _id: new ObjectId(id) })

    if (!existingBook) {
      return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 })
    }

    await db.collection("books").updateOne({ _id: new ObjectId(id) }, { $set: bookData })

    const updatedBook = await db.collection("books").findOne({ _id: new ObjectId(id) })

    return NextResponse.json(
      { success: true, message: "Book updated successfully", book: updatedBook },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating book:", error)
    return NextResponse.json({ success: false, message: "Failed to update book" }, { status: 500 })
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
      return NextResponse.json({ success: false, message: "Invalid book ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const existingBook = await db.collection("books").findOne({ _id: new ObjectId(id) })

    if (!existingBook) {
      return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 })
    }

    const isBorrowed = await db.collection("borrows").findOne({
      bookId: id,
      returnedAt: null,
    })

    if (isBorrowed) {
      return NextResponse.json({ success: false, message: "Cannot delete a borrowed book" }, { status: 400 })
    }

    await db.collection("books").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: "Book deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting book:", error)
    return NextResponse.json({ success: false, message: "Failed to delete book" }, { status: 500 })
  }
}
