import { NextResponse } from "next/server"

export const apiResponse = (status: number, data: any, headers: Record<string, string> = {}) => {
  const responseHeaders = {
    "Content-Type": "application/json",
    ...headers,
  }

  const success = status >= 200 && status < 300

  const body = {
    success,
    ...data,
  }

  return NextResponse.json(body, {
    status,
    headers: responseHeaders,
  })
}

export const errorResponse = (status: number, message: string, headers: Record<string, string> = {}) => {
  return apiResponse(status, { message }, headers)
}

export const successResponse = (data: any, status = 200, headers: Record<string, string> = {}) => {
  return apiResponse(status, data, headers)
}
