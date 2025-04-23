import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user || !user.id) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const borrows = await db.collection("borrows").find({ userId: user.id }).toArray()

    const borrowsWithBooks = await Promise.all(
      borrows.map(async (borrow) => {
        const book = await db.collection("books").findOne({ _id: new ObjectId(borrow.bookId) })
        return {
          ...borrow,
          _id: borrow._id.toString(),
          book: {
            ...book,
            _id: book ? book._id.toString() : null,
          },
        }
      }),
    )

    return NextResponse.json({ success: true, borrows: borrowsWithBooks }, { status: 200 })
  } catch (error) {
    console.error("Error fetching user borrows:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch borrows" }, { status: 500 })
  }
}
