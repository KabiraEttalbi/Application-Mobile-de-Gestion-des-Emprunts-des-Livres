import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRES_IN = "7d"

interface TokenPayload {
  userId: string
  email: string
  name: string
  role: string
  iat?: number
  exp?: number
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (user: any): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyJwtToken = async (token: string): Promise<TokenPayload | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

export const getUserIdFromToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    const user = {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    }
    return user
  } catch (error) {
    return null
  }
}

export const getUserRoleFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded.role
  } catch (error) {
    return null
  }
}

export const toObjectId = (id: string): ObjectId => {
  return new ObjectId(id)
}
