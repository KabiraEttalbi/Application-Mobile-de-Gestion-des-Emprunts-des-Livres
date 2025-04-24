import AsyncStorage from "@react-native-async-storage/async-storage"

const API_URL = "http://10.0.2.2:3000/api"

const TOKEN_KEY = "auth_token"
const USER_KEY = "user_data"

export const storeToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error("Error storing token:", error)
  }
}

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error("Error getting token:", error)
    return null
  }
}

export const storeUser = async (user: any) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch (error) {
    console.error("Error storing user data:", error)
  }
}

export const getUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY)
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

export const clearAuth = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY])
  } catch (error) {
    console.error("Error clearing auth data:", error)
  }
}

const apiRequest = async (endpoint: string, method = "GET", data: any = null) => {
  try {
    const token = await getToken()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (data && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(`${API_URL}${endpoint}`, config)

    if (response.status === 401) {
      await clearAuth()

      throw new Error("Authentication expired. Please login again.")
    }

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong")
    }

    return result
  } catch (error) {
    console.error("API request error:", error)
    throw error
  }
}

export const login = async (email: string, password: string) => {
  const response = await apiRequest("/auth/login", "POST", { email, password })

  if (response.token) {
    await storeToken(response.token)
    await storeUser(response.user)
  }

  return response
}

export const register = async (userData: any) => {
  return await apiRequest("/users", "POST", userData)
}

export const logout = async () => {
  await clearAuth()

}

export const getCurrentUser = async () => {
  return await apiRequest("/auth")
}

export const getBooks = async () => {
  return await apiRequest("/books")
}

export const getBook = async (id: string) => {
  return await apiRequest(`/books/${id}`)
}

export const addBook = async (bookData: any) => {
  return await apiRequest("/books", "POST", bookData)
}

export const updateBook = async (id: string, bookData: any) => {
  return await apiRequest(`/books/${id}`, "PUT", bookData)
}

export const deleteBook = async (id: string) => {
  return await apiRequest(`/books/${id}`, "DELETE")
}

export const getUserBooks = async () => {
  try {
    const response = await apiRequest("/users/books")

    console.log("getUserBooks API response:", response)

    if (!response.success) {
      console.error("API error in getUserBooks:", response.message)
      return response
    }

    if (!response.books || !Array.isArray(response.books)) {
      console.error("Invalid books data in getUserBooks response:", response)
      return {
        success: false,
        message: "Invalid response format",
        books: [],
      }
    }

    const validatedBooks = response.books.map((book) => {
      if (!book.title) book.title = "Unknown Title"
      if (!book.author) book.author = "Unknown Author"
      if (!book._id && book.borrowId) book._id = book.borrowId

      return book
    })

    return {
      ...response,
      books: validatedBooks,
    }
  } catch (error) {
    console.error("Error in getUserBooks:", error)
    return {
      success: false,
      message: error.message || "Failed to fetch books",
      books: [],
    }
  }
}

export const borrowBook = async (bookId: string) => {
  return await apiRequest("/borrow", "POST", { bookId })
}

export const returnBook = async (borrowId: string) => {
  return await apiRequest(`/borrow/return/${borrowId}`, "POST")
}

export const getUserBorrows = async () => {
  return await apiRequest("/users/borrows")
}

export const getUsers = async () => {
  return await apiRequest("/admin/users")
}

export const updateUser = async (id: string, userData: any) => {
  return await apiRequest(`/admin/users/${id}`, "PUT", userData)
}

export const deleteUser = async (id: string) => {
  return await apiRequest(`/admin/users/${id}`, "DELETE")
}

export const updateUserRole = async (id: string, role: string) => {
  return await apiRequest(`/admin/users/${id}/role`, "PUT", { role })
}
