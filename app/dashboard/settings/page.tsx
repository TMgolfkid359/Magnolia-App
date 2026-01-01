'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { userService, PortalUser } from '@/services/userService'
import { courseService, Course } from '@/services/courseService'
import { Settings, Mail, BookOpen, Link2, CheckCircle, X, Loader2, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [email, setEmail] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [fspEmail, setFspEmail] = useState('')
  const [connectingFsp, setConnectingFsp] = useState(false)
  
  // UI states
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showFspModal, setShowFspModal] = useState(false)
  
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<PortalUser[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    // Load user data
    const fullUser = userService.getUserById(user.id)
    if (fullUser) {
      setPortalUser(fullUser)
      setEmail(fullUser.email)
      setSelectedCourses(fullUser.enrolledCourseIds || [])
    }

    // Load courses and instructors
    setCourses(courseService.getAllCourses())
    const allUsers = userService.getAllUsers()
    setInstructors(allUsers.filter(u => u.role === 'instructor' && u.enrolled))
    
    setLoading(false)
  }, [user, router])

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleSaveSettings = async () => {
    if (!portalUser) return

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      // Validate email
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address')
        setSaving(false)
        return
      }

      // Check if email is already taken by another user
      const existingUser = userService.getUserByEmail(email)
      if (existingUser && existingUser.id !== portalUser.id) {
        setError('This email is already in use by another account')
        setSaving(false)
        return
      }

      // Update user
      const updated = userService.updateUser(portalUser.id, {
        email,
        enrolledCourseIds: selectedCourses,
      })

      if (updated) {
        setPortalUser(updated)
        setSuccess('Settings saved successfully!')
        
        // Update auth context if email changed
        if (email !== portalUser.email) {
          // Update stored user session
          const sessionUser = {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
          }
          localStorage.setItem('user', JSON.stringify(sessionUser))
          
          // Reload page to update auth context
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectFsp = async () => {
    if (!portalUser || !fspEmail.trim()) {
      setError('Please enter your FSP email address')
      return
    }

    setError('')
    setConnectingFsp(true)

    try {
      const response = await fetch('/api/fsp/match-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fspEmail }),
      })

      const data = await response.json()

      if (data.success && data.fspStudentId) {
        // Update user with FSP ID
        const updated = userService.updateUser(portalUser.id, {
          fspStudentId: data.fspStudentId,
        })

        if (updated) {
          setPortalUser(updated)
          setSuccess('Successfully connected to Flight Schedule Pro!')
          setShowFspModal(false)
          setFspEmail('')
          
          // Optionally fetch schedule immediately
          try {
            await fetch('/api/fsp/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: portalUser.email }),
            })
          } catch (err) {
            console.error('Failed to fetch initial schedule:', err)
          }
        }
      } else {
        setError(data.error || 'Failed to connect to FSP. Please check your email address.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Flight Schedule Pro')
    } finally {
      setConnectingFsp(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  if (!portalUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-start space-x-2">
          <CheckCircle className="h-5 w-5 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="h-5 w-5 text-magnolia-600" />
          <h2 className="text-xl font-semibold text-gray-900">Email Address</h2>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900 transition-all"
            placeholder="your.email@example.com"
          />
          <p className="text-xs text-gray-500 mt-2">
            This email is used for login and account notifications
          </p>
        </div>
      </div>

      {/* Course Enrollment (Students only) */}
      {portalUser.role === 'student' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="h-5 w-5 text-magnolia-600" />
            <h2 className="text-xl font-semibold text-gray-900">Enrolled Courses</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Courses
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {courses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No courses available</p>
              ) : (
                courses.map(course => (
                  <label
                    key={course.id}
                    className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                      className="w-4 h-4 text-magnolia-600 border-gray-300 rounded focus:ring-magnolia-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{course.description}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedCourses.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flight Schedule Pro Connection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link2 className="h-5 w-5 text-magnolia-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Flight Schedule Pro</h2>
              <p className="text-sm text-gray-600">
                Connect your account to view your flight schedule
              </p>
            </div>
          </div>
        </div>
        
        {portalUser.fspStudentId ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Connected to Flight Schedule Pro
                </span>
              </div>
              <span className="text-xs text-green-600">
                Student ID: {portalUser.fspStudentId}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowFspModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              <span>Connect to Flight Schedule Pro</span>
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>

      {/* FSP Connection Modal */}
      {showFspModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Connect to Flight Schedule Pro</h3>
              <button
                onClick={() => {
                  setShowFspModal(false)
                  setFspEmail('')
                  setError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Enter the email address associated with your Flight Schedule Pro account. 
              We'll automatically match your account and sync your schedule.
            </p>

            <div className="mb-4">
              <label htmlFor="fspEmail" className="block text-sm font-medium text-gray-700 mb-2">
                FSP Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="fspEmail"
                type="email"
                value={fspEmail}
                onChange={(e) => setFspEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900 transition-all"
                placeholder="your.fsp.email@example.com"
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={handleConnectFsp}
                disabled={connectingFsp || !fspEmail.trim()}
                className="flex-1 px-4 py-2 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {connectingFsp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowFspModal(false)
                  setFspEmail('')
                  setError('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

