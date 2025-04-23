import type { NextRequest } from "next/server"
import * as jose from "jose"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "./mongodb"

export type UserData = {
  id: string
  email: string
  name: string
  role: string
}

export function getUserFromRequest(request: NextRequest): UserData | null {
  const userHeader = request.headers.get("user")
  if (!userHeader) return null

  try {
    return JSON.parse(userHeader)
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "") || null
}

export async function verifyToken(token: string): Promise<UserData | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    const { payload } = await jose.jwtVerify(token, secret)
    return payload as UserData
  } catch (error) {
    return null
  }
}

export function isAdmin(user: UserData | null): boolean {
  return !!user && user.role === "admin"
}

export async function getUserById(id: string) {
  if (!id) return null

  try {
    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } })

    if (!user) return null

    return {
      ...user,
      _id: user._id.toString(),
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    return null
  }
}
