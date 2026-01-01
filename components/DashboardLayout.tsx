'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { BookOpen, Video, LogOut, User, Settings, FileText, TrendingUp } from 'lucide-react'
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
    { href: '/dashboard/courses', label: 'Courses', icon: BookOpen },
    { href: '/dashboard/videos', label: 'Video Portal', icon: Video },
    { href: '/dashboard/exams', label: 'Exams', icon: FileText },
    ...(user?.role === 'instructor' || user?.role === 'admin' 
      ? [{ href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp }] 
      : []),
    ...(user?.role === 'instructor' 
      ? [{ href: '/dashboard/instructor', label: 'My Students', icon: User }] 
      : []),
    ...(user?.role === 'admin' ? [{ href: '/dashboard/admin', label: 'Admin', icon: Settings }] : []),
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MagnoliaLogo size="sm" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-magnolia-50 rounded-full">
                  <User className="h-4 w-4 text-magnolia-700" />
                  <span className="text-gray-700 font-medium">{user?.name}</span>
                </div>
                <span className="px-2.5 py-1 bg-magnolia-100 text-magnolia-800 rounded-full text-xs font-semibold capitalize">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:sticky lg:top-24 lg:self-start border border-gray-100">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-magnolia-100 text-magnolia-800 font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-magnolia-700' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

