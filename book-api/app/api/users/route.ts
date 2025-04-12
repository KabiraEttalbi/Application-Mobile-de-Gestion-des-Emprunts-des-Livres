import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection("users").find({}).toArray();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const userData = await request.json();

    if (!userData.name || !userData.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .collection("users")
      .findOne({ email: userData.email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const newUser = {
      name: userData.name,
      email: userData.email,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);
    return NextResponse.json(
      { ...newUser, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
