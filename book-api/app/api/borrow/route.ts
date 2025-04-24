import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
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
    const borrows = await db.collection("borrows").find({ userId: user.userId }).toArray()

    const formattedBorrows = borrows.map((borrow) => ({
      ...borrow,
      _id: borrow._id.toString(),
      bookId: borrow.bookId?.toString() || null,
    }))

    return NextResponse.json({ success: true, borrows: formattedBorrows }, { status: 200 })
  } catch (error) {
    console.error("Error fetching borrows:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch borrows" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const user = token ? getUserIdFromToken(token) : null

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const { bookId } = await request.json()

    if (!bookId) {
      return NextResponse.json({ success: false, message: "Book ID is required" }, { status: 400 })
    }

    if (!ObjectId.isValid(bookId)) {
      return NextResponse.json({ success: false, message: "Invalid book ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const book = await db.collection("books").findOne({ _id: new ObjectId(bookId) })

    if (!book) {
      return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 })
    }

    if (!book.available) {
      return NextResponse.json({ success: false, message: "Book is not available for borrowing" }, { status: 400 })
    }

    const existingBorrow = await db.collection("borrows").findOne({
      userId: user.userId,
      bookId: bookId,
      returnedAt: null,
    })

    if (existingBorrow) {
      return NextResponse.json({ success: false, message: "You have already borrowed this book" }, { status: 400 })
    }

    const borrowResult = await db.collection("borrows").insertOne({
      userId: user.userId,
      bookId: bookId, 
      borrowedAt: new Date(),
      returnedAt: null,
    })

    await db.collection("books").updateOne({ _id: new ObjectId(bookId) }, { $set: { available: false } })

    const borrow = await db.collection("borrows").findOne({ _id: borrowResult.insertedId })

    return NextResponse.json(
      {
        success: true,
        message: "Book borrowed successfully",
        borrow: {
          ...borrow,
          _id: borrow?._id.toString(),
          bookId: borrow?.bookId.toString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error borrowing book:", error)
    return NextResponse.json({ success: false, message: "Failed to borrow book" }, { status: 500 })
  }
}
