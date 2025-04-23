import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user || !user.id) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const { bookId } = await request.json()

    if (!bookId) {
      return NextResponse.json({ success: false, message: "Book ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const book = await db.collection("books").findOne({
      _id: new ObjectId(bookId),
      available: true,
    })

    if (!book) {
      return NextResponse.json({ success: false, message: "Book not found or not available" }, { status: 404 })
    }

    const borrowedCount = await db.collection("borrows").countDocuments({
      userId: user.id,
      returnedAt: null,
    })

    if (borrowedCount >= 3) {
      return NextResponse.json(
        { success: false, message: "You can only borrow up to 3 books at a time" },
        { status: 400 },
      )
    }

    const borrow = {
      userId: user.id,
      bookId: book._id.toString(),
      borrowedAt: new Date(),
      returnedAt: null,
    }

    await db.collection("borrows").insertOne(borrow)

    await db.collection("books").updateOne({ _id: new ObjectId(bookId) }, { $set: { available: false } })

    return NextResponse.json({ success: true, message: "Book borrowed successfully", borrow }, { status: 200 })
  } catch (error) {
    console.error("Error borrowing book:", error)
    return NextResponse.json({ success: false, message: "Failed to borrow book" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user || !user.id) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const borrows = await db.collection("borrows").find({ userId: user.id, returnedAt: null }).toArray()

    const borrowsWithBooks = await Promise.all(
      borrows.map(async (borrow) => {
        const book = await db.collection("books").findOne({
          _id: new ObjectId(borrow.bookId),
        })

        return {
          ...borrow,
          book,
        }
      }),
    )

    return NextResponse.json({ success: true, borrows: borrowsWithBooks }, { status: 200 })
  } catch (error) {
    console.error("Error fetching borrowed books:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch borrowed books" }, { status: 500 })
  }
}
