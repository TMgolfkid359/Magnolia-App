'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import WelcomePage from '@/components/WelcomePage'

export default function Welcome() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!loading && user) {
      router.push('/dashboard/courses')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  // If user is logged in, don't show welcome page
  if (user) {
    return null
  }

  return <WelcomePage />
}

