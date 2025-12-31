'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, BookOpen, Video, LogOut, User, Settings, FileText } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MagnoliaLogo from './MagnoliaLogo'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', label: 'Schedule', icon: Calendar },
    { href: '/dashboard/courses', label: 'Courses', icon: BookOpen },
    { href: '/dashboard/videos', label: 'Video Portal', icon: Video },
    { href: '/dashboard/exams', label: 'Exams', icon: FileText },
    ...(user?.role === 'admin' ? [{ href: '/dashboard/admin', label: 'Admin', icon: Settings }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MagnoliaLogo size="sm" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
                <span className="px-2 py-1 bg-magnolia-100 text-magnolia-800 rounded-full text-xs">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white rounded-lg shadow-sm p-4 mr-8">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? 'bg-magnolia-50 text-magnolia-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

