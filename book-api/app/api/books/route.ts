import { connectToDatabase } from "@/lib/mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const books = await db.collection("books").find({}).toArray();
    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const bookData = await request.json();

    if (!bookData.title || !bookData.author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    const newBook = {
      title: bookData.title,
      author: bookData.author,
      description: bookData.description || "",
      available: true,
      createdAt: new Date(),
    };

    const result = await db.collection("books").insertOne(newBook);
    return NextResponse.json(
      { ...newBook, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
