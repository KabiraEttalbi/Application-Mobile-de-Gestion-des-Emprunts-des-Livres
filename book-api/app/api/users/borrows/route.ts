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

    const borrowsWithBooks = await Promise.all(
      borrows.map(async (borrow) => {
        const book = await db.collection("books").findOne({ _id: new ObjectId(borrow.bookId) })
        return {
          ...borrow,
          _id: borrow._id.toString(),
          book: {
            ...book,
            _id: book?._id.toString(),
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
