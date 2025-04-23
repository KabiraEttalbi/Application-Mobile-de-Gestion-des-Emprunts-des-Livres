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

    if (id !== user.id && user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 })
    }

    const { db } = await connectToDatabase()

    const borrows = await db.collection("borrows").find({ userId: id }).toArray()

    const books = await Promise.all(
      borrows.map(async (borrow) => {
        const book = await db.collection("books").findOne({ _id: new ObjectId(borrow.bookId) })
        if (!book) {
          return null;
        }
        return {
          ...book,
          _id: book._id.toString(),
          borrowId: borrow._id.toString(),
          borrowedAt: borrow.borrowedAt,
          returnedAt: borrow.returnedAt,
        }
      }),
    )

    return NextResponse.json({ success: true, books }, { status: 200 })
  } catch (error) {
    console.error("Error fetching user books:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch books" }, { status: 500 })
  }
}
