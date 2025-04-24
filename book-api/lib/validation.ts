const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PASSWORD_MIN_LENGTH = 6

interface ValidationResult {
  isValid: boolean
  message?: string
}

export const validateRegistration = (data: any): ValidationResult => {
  const { name, email, password } = data

  if (!name || !email || !password) {
    return {
      isValid: false,
      message: "Name, email, and password are required",
    }
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      message: "Invalid email format",
    }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    }
  }

  return { isValid: true }
}

export const validateBook = (data: any): ValidationResult => {
  const { title, author, isbn } = data

  if (!title || !author) {
    return {
      isValid: false,
      message: "Title and author are required",
    }
  }

  return { isValid: true }
}

export const validateBorrow = (data: any): ValidationResult => {
  const { bookId, userId } = data

  if (!bookId || !userId) {
    return {
      isValid: false,
      message: "Book ID and User ID are required",
    }
  }

  return { isValid: true }
}
