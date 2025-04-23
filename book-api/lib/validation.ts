type ValidationResult = {
    valid: boolean
    errors?: Record<string, string>
  }
  
  export function validateRequired(data: Record<string, any>, fields: string[]): ValidationResult {
    const errors: Record<string, string> = {}
  
    for (const field of fields) {
      if (!data[field]) {
        errors[field] = `${field} is required`
      }
    }
  
    return {
      valid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    }
  }
  
  export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  export function validateObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id)
  }
  