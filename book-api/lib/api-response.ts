import { NextResponse } from "next/server"

type ApiResponseOptions = {
  status?: number
  headers?: Record<string, string>
}

export function successResponse<T>(data: T, message?: string, options?: ApiResponseOptions) {
  return NextResponse.json(
    {
      success: true,
      message,
      ...data,
    },
    {
      status: options?.status || 200,
      headers: options?.headers,
    },
  )
}

export function errorResponse(message: string, status = 400, error?: any) {
  console.error(`API Error (${status}):`, message, error)

  return NextResponse.json(
    {
      success: false,
      message,
      ...(process.env.NODE_ENV !== "production" && error ? { error: String(error) } : {}),
    },
    { status },
  )
}

export const AUTH_ERROR = "Authentication required"
export const FORBIDDEN_ERROR = "You don't have permission to access this resource"
export const NOT_FOUND_ERROR = "Resource not found"
export const VALIDATION_ERROR = "Invalid input data"
export const SERVER_ERROR = "An unexpected error occurred"
