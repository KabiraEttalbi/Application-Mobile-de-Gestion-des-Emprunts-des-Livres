import { ObjectId } from "mongodb"
import { connectToDatabase } from "./mongodb"

export class DbService<T> {
  private collectionName: string

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  async findOne(query: any, projection?: any) {
    const { db } = await connectToDatabase()
    const result = await db.collection(this.collectionName).findOne(query, { projection })

    if (!result) return null

    return this.formatDocument(result)
  }

  async findById(id: string, projection?: any) {
    if (!ObjectId.isValid(id)) return null

    return this.findOne({ _id: new ObjectId(id) }, projection)
  }

  async find(query: any, options?: any) {
    const { db } = await connectToDatabase()
    const cursor = db.collection(this.collectionName).find(query, options)

    const results = await cursor.toArray()
    return results.map((doc) => this.formatDocument(doc))
  }

  async insertOne(data: any) {
    const { db } = await connectToDatabase()
    const result = await db.collection(this.collectionName).insertOne(data)

    return {
      id: result.insertedId.toString(),
      acknowledged: result.acknowledged,
    }
  }

  async updateOne(query: any, update: any) {
    const { db } = await connectToDatabase()
    const result = await db.collection(this.collectionName).updateOne(query, update)

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged,
    }
  }

  async updateById(id: string, update: any) {
    if (!ObjectId.isValid(id)) return null

    return this.updateOne({ _id: new ObjectId(id) }, { $set: update })
  }

  async deleteOne(query: any) {
    const { db } = await connectToDatabase()
    const result = await db.collection(this.collectionName).deleteOne(query)

    return {
      deletedCount: result.deletedCount,
      acknowledged: result.acknowledged,
    }
  }

  async deleteById(id: string) {
    if (!ObjectId.isValid(id)) return null

    return this.deleteOne({ _id: new ObjectId(id) })
  }

  async count(query: any) {
    const { db } = await connectToDatabase()
    return db.collection(this.collectionName).countDocuments(query)
  }

  private formatDocument(doc: any) {
    if (doc._id) {
      doc._id = doc._id.toString()
    }
    return doc
  }
}

export const usersService = new DbService("users")
export const booksService = new DbService("books")
export const borrowsService = new DbService("borrows")
