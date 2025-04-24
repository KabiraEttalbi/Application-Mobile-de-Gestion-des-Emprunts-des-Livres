import { ObjectId } from "mongodb"
import { connectToDatabase } from "./mongodb"

export const UserService = {
  async getUserById(id: string) {
    const { db } = await connectToDatabase()
    return db.collection("users").findOne({ _id: new ObjectId(id) })
  },

  async getUserByEmail(email: string) {
    const { db } = await connectToDatabase()
    return db.collection("users").findOne({ email })
  },

  async createUser(userData: any) {
    const { db } = await connectToDatabase()
    const result = await db.collection("users").insertOne({
      ...userData,
      createdAt: new Date(),
    })
    return db.collection("users").findOne({ _id: result.insertedId })
  },

  async updateUser(id: string, userData: any) {
    const { db } = await connectToDatabase()
    await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { ...userData, updatedAt: new Date() } })
    return db.collection("users").findOne({ _id: new ObjectId(id) })
  },

  async deleteUser(id: string) {
    const { db } = await connectToDatabase()
    return db.collection("users").deleteOne({ _id: new ObjectId(id) })
  },
}

export const BookService = {
  async getBookById(id: string) {
    const { db } = await connectToDatabase()
    return db.collection("books").findOne({ _id: new ObjectId(id) })
  },

  async getBooks(query: any = {}) {
    const { db } = await connectToDatabase()
    return db.collection("books").find(query).toArray()
  },

  async createBook(bookData: any) {
    const { db } = await connectToDatabase()
    const result = await db.collection("books").insertOne({
      ...bookData,
      available: true,
      createdAt: new Date(),
    })
    return db.collection("books").findOne({ _id: result.insertedId })
  },

  async updateBook(id: string, bookData: any) {
    const { db } = await connectToDatabase()
    await db.collection("books").updateOne({ _id: new ObjectId(id) }, { $set: { ...bookData, updatedAt: new Date() } })
    return db.collection("books").findOne({ _id: new ObjectId(id) })
  },

  async deleteBook(id: string) {
    const { db } = await connectToDatabase()
    return db.collection("books").deleteOne({ _id: new ObjectId(id) })
  },
}

export const BorrowService = {
  async getBorrowById(id: string) {
    const { db } = await connectToDatabase()
    return db.collection("borrows").findOne({ _id: new ObjectId(id) })
  },

  async getBorrows(query: any = {}) {
    const { db } = await connectToDatabase()
    return db.collection("borrows").find(query).sort({ borrowedAt: -1 }).toArray()
  },

  async createBorrow(borrowData: any) {
    const { db } = await connectToDatabase()

    const result = await db.collection("borrows").insertOne({
      ...borrowData,
      bookId: new ObjectId(borrowData.bookId),
      userId: new ObjectId(borrowData.userId),
      borrowedAt: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    })

    await db.collection("books").updateOne({ _id: new ObjectId(borrowData.bookId) }, { $set: { available: false } })

    return db.collection("borrows").findOne({ _id: result.insertedId })
  },

  async returnBook(id: string) {
    const { db } = await connectToDatabase()

    const borrow = await db.collection("borrows").findOne({
      _id: new ObjectId(id),
      returnedAt: { $exists: false },
    })

    if (!borrow) {
      throw new Error("Active borrow not found")
    }

    await db.collection("borrows").updateOne({ _id: new ObjectId(id) }, { $set: { returnedAt: new Date() } })

    await db.collection("books").updateOne({ _id: borrow.bookId }, { $set: { available: true } })

    return db.collection("borrows").findOne({ _id: new ObjectId(id) })
  },

  async getUserActiveBorrows(userId: string) {
    const { db } = await connectToDatabase()
    return db
      .collection("borrows")
      .find({
        userId: new ObjectId(userId),
        returnedAt: { $exists: false },
      })
      .toArray()
  },

  async isBookAvailable(bookId: string) {
    const { db } = await connectToDatabase()
    const book = await db.collection("books").findOne({
      _id: new ObjectId(bookId),
      available: true,
    })
    return !!book
  },
}
