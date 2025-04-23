import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid book ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const bookWithOwner = await db.collection("books").aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "addedBy", 
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          addedByName: {
            $concat: ["$owner.firstName", " ", "$owner.lastName"],
          },
        },
      },
      {
        $project: {
          owner: 0, 
        },
      },
    ]).toArray();

    if (!bookWithOwner.length) {
      return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, book: bookWithOwner[0] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch book" }, { status: 500 });
  }
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid book ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const existingBook = await db.collection("books").findOne({ _id: new ObjectId(id) })

    if (!existingBook) {
      return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 })
    }

    const isOwner = existingBook.userId === user?.id
    if (!user || (user.role !== "admin" && !isOwner)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const bookData = await request.json()
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
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid book ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const existingBook = await db.collection("books").findOne({ _id: new ObjectId(id) })

    if (!existingBook) {
      return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 })
    }

    const isOwner = existingBook.userId === user?.id
    if (!user || (user.role !== "admin" && !isOwner)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
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
