"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import * as api from "../services/api"

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface AuthContextData {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await api.getUser()

        if (storedUser) {
          try {
            const currentUser = await api.getCurrentUser()
            setUser(currentUser)
          } catch (err) {
            await api.clearAuth()
          }
        }
      } catch (err) {
        console.error("Error loading user:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.login(email, password)
      setUser(response.user)
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      await api.register({ name, email, password })
      // After registration, log the user in
      await login(email, password)
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await api.logout()
      setUser(null)
    } catch (err: any) {
      setError(err.message || "Logout failed.")
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
