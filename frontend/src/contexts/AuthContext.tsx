import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  // トークン検証（アプリ起動時）
  useEffect(() => {
    if (!token) return
    // JWTの有効期限チェック（デコードのみ）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        logout()
      }
    } catch {
      logout()
    }
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
