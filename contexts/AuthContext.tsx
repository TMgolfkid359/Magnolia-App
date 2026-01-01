'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { userService } from '@/services/userService'

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
    // Check userService for enrolled users
    const allUsers = userService.getAllUsers()
    const foundUser = allUsers.find(u => u.email === email && u.enrolled)
    
    // For demo, password is always 'password'
    if (foundUser && password === 'password') {
      // Check if student is approved (instructors and admins don't need approval)
      if (foundUser.role === 'student') {
        const isApproved = foundUser.enrollmentStatus === 'approved' || 
                          (!foundUser.enrollmentStatus && foundUser.enrolled) // Legacy users without status
        if (!isApproved) {
          throw new Error('Your account is pending approval. Please wait for your instructor or administrator to approve your account.')
        }
      }
      
      const user = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      }
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      // Update last login
      userService.updateUser(foundUser.id, { lastLogin: new Date().toISOString() })
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

