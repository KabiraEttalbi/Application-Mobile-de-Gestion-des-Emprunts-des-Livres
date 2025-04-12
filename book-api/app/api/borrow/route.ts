import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const borrows = await db.collection("borrows").find({}).toArray();
    return NextResponse.json(borrows);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch borrows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const borrowData = await request.json();

    if (!borrowData.userId || !borrowData.bookId) {
      return NextResponse.json(
        { error: "User ID and Book ID are required" },
        { status: 400 }
      );
    }

    const book = await db
      .collection("books")
      .findOne({ _id: new ObjectId(borrowData.bookId) });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (!book.available) {
      return NextResponse.json(
        { error: "Book is not available for borrowing" },
        { status: 400 }
      );
    }

    const newBorrow = {
      userId: borrowData.userId,
      bookId: borrowData.bookId,
      borrowDate: new Date(),
      returnDate: null,
      status: "borrowed",
    };

    const result = await db.collection("borrows").insertOne(newBorrow);

    await db
      .collection("books")
      .updateOne(
        { _id: new ObjectId(borrowData.bookId) },
        { $set: { available: false } }
      );

    return NextResponse.json(
      { ...newBorrow, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create borrow record" },
      { status: 500 }
    );
  }
}
