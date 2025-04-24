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

    console.log("Found borrows:", borrows) 

    const books = await Promise.all(
      borrows.map(async (borrow) => {
        try {
          if (!borrow.bookId) {
            console.error("Borrow record missing bookId:", borrow)
            return {
              _id: borrow._id.toString(),
              borrowId: borrow._id.toString(),
              borrowedAt: borrow.borrowedAt,
              returnedAt: borrow.returnedAt,
              title: "Unknown Book",
              author: "Unknown Author",
              error: "Book reference missing",
            }
          }

          const book = await db.collection("books").findOne({ _id: new ObjectId(borrow.bookId) })

          console.log("Book lookup result:", book, "for bookId:", borrow.bookId) 

          if (!book) {
            console.error("Book not found for borrow:", borrow)
            return {
              _id: borrow.bookId,
              borrowId: borrow._id.toString(),
              borrowedAt: borrow.borrowedAt,
              returnedAt: borrow.returnedAt,
              title: "Book Not Found",
              author: "Unknown",
              error: "Book not found in database",
            }
          }

          return {
            ...book,
            _id: book._id.toString(),
            borrowId: borrow._id.toString(),
            borrowedAt: borrow.borrowedAt,
            returnedAt: borrow.returnedAt,
          }
        } catch (error) {
          console.error("Error processing borrow record:", error, borrow)
          return {
            _id: borrow._id.toString(),
            borrowId: borrow._id.toString(),
            borrowedAt: borrow.borrowedAt,
            returnedAt: borrow.returnedAt,
            title: "Error Loading Book",
            author: "Unknown",
            error: "Failed to load book details",
          }
        }
      }),
    )

    console.log("Final books response:", books) 

    return NextResponse.json({ success: true, books }, { status: 200 })
  } catch (error) {
    console.error("Error fetching user books:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch books" }, { status: 500 })
  }
}
