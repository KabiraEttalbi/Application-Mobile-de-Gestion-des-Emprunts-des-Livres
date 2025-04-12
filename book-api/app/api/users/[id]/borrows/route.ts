import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(params.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const borrows = await db
      .collection("borrows")
      .find({ userId: params.id })
      .toArray();

    const borrowsWithBooks = await Promise.all(
      borrows.map(async (borrow) => {
        const book = await db
          .collection("books")
          .findOne({ _id: new ObjectId(borrow.bookId) });

        return {
          ...borrow,
          book,
        };
      })
    );

    return NextResponse.json(borrowsWithBooks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user borrows" },
      { status: 500 }
    );
  }
}
