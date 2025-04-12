import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {
  tls: true,
}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

let collectionsInitialized = false

async function initializeCollections(client: MongoClient) {
  if (collectionsInitialized) return

  try {
    const db = client.db("library")

    const bookCollections = await db.listCollections({ name: "books" }).toArray()
    if (bookCollections.length === 0) {
      await db.createCollection("books")
    }
    await db.collection("books").createIndex({ title: 1 })
    await db.collection("books").createIndex({ author: 1 })
    await db.collection("books").createIndex({ available: 1 })

    const userCollections = await db.listCollections({ name: "users" }).toArray()
    if (userCollections.length === 0) {
      await db.createCollection("users")
    }
    await db.collection("users").createIndex({ email: 1 }, { unique: true })

    const borrowCollections = await db.listCollections({ name: "borrows" }).toArray()
    if (borrowCollections.length === 0) {
      await db.createCollection("borrows")
    }
    await db.collection("borrows").createIndex({ userId: 1 })
    await db.collection("borrows").createIndex({ bookId: 1 })
    await db.collection("borrows").createIndex({ status: 1 })

    console.log("MongoDB collections initialized successfully!")
    collectionsInitialized = true
  } catch (error) {
    console.error("Error initializing collections:", error)
  }
}

export async function connectToDatabase() {
  const client = await clientPromise
  const db = client.db("library")

  await initializeCollections(client)

  return { client, db }
}
