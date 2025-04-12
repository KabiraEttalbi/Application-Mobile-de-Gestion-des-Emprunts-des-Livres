import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()

    const borrow = await db.collection("borrows").findOne({ _id: new ObjectId(params.id) })

    if (!borrow) {
      return NextResponse.json({ error: "Borrow record not found" }, { status: 404 })
    }

    if (borrow.status === "returned") {
      return NextResponse.json({ error: "Book already returned" }, { status: 400 })
    }

    await db.collection("borrows").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          returnDate: new Date(),
          status: "returned",
        },
      },
    )

    await db.collection("books").updateOne({ _id: new ObjectId(borrow.bookId) }, { $set: { available: true } })

    return NextResponse.json({ message: "Book returned successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to return book" }, { status: 500 })
  }
}
