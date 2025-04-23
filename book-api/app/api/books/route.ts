import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth-helpers"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const books = await db.collection("books").find({}).toArray()

    return NextResponse.json({ success: true, books }, { status: 200 })
  } catch (error) {
    console.error("Error fetching books:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch books" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const bookData = await request.json()

    if (!bookData.title || !bookData.author) {
      return NextResponse.json({ success: false, message: "Title and author are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("books").insertOne({
      ...bookData,
      userId: user.id,
      available: true,
      createdAt: new Date(),
    })

    const book = await db.collection("books").findOne({ _id: result.insertedId })

    return NextResponse.json({ success: true, message: "Book created successfully", book }, { status: 201 })
  } catch (error) {
    console.error("Error creating book:", error)
    return NextResponse.json({ success: false, message: "Failed to create book" }, { status: 500 })
  }
}