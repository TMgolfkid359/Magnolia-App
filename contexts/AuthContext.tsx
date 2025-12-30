'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserRole = 'student' | 'instructor' | 'admin' | null
export type User = {
  id: string
  name: string
  email: string
  role: UserRole
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual authentication API call
    // For now, using mock authentication
    const mockUsers = [
      { id: '1', name: 'John Student', email: 'student@example.com', role: 'student' as UserRole },
      { id: '2', name: 'Jane Instructor', email: 'instructor@example.com', role: 'instructor' as UserRole },
      { id: '3', name: 'Admin User', email: 'admin@magnolia.com', role: 'admin' as UserRole },
    ]

    const foundUser = mockUsers.find(u => u.email === email)
    if (foundUser && password === 'password') {
      setUser(foundUser)
      localStorage.setItem('user', JSON.stringify(foundUser))
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

