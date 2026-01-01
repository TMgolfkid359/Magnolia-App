'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MagnoliaLogo from './MagnoliaLogo'
import { courseService, Course } from '@/services/courseService'
import { userService, PortalUser } from '@/services/userService'
import { Check, X, Loader2 } from 'lucide-react'

export default function WelcomePage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState<'LZU' | '2M8' | ''>('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<PortalUser[]>([])
  
  const router = useRouter()

  useEffect(() => {
    // Load courses and instructors
    const allCourses = courseService.getAllCourses()
    const allUsers = userService.getAllUsers()
    const instructorUsers = allUsers.filter(u => u.role === 'instructor' && u.enrolled)
    
    setCourses(allCourses)
    setInstructors(instructorUsers)
  }, [])

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleInstructorToggle = (instructorId: string) => {
    setSelectedInstructors(prev => 
      prev.includes(instructorId) 
        ? prev.filter(id => id !== instructorId)
        : [...prev, instructorId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name')
      return
    }
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!location) {
      setError('Please select a location')
      return
    }
    
    if (selectedCourses.length === 0) {
      setError('Please select at least one course')
      return
    }
    
    if (selectedInstructors.length === 0) {
      setError('Please select at least one instructor')
      return
    }

    // Check if email already exists
    const existingUser = userService.getUserByEmail(email)
    if (existingUser) {
      setError('An account with this email already exists. Please use the login page instead.')
      return
    }

    setLoading(true)

    try {
      // Create new user with pending status
      const newUser = userService.addUser({
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        role: 'student',
        enrolled: true,
        enrollmentStatus: 'pending',  // New students start as pending
        enrollmentDate: new Date().toISOString(),
        location: location as 'LZU' | '2M8',
        enrolledCourseIds: selectedCourses,
        assignedInstructorIds: selectedInstructors,
      })

      setSubmitted(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      setError('Failed to create account. Please try again.')
      console.error('Error creating user:', err)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100 text-center">
          <div className="flex items-center justify-center mb-6">
            <MagnoliaLogo size="lg" />
          </div>
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Account Created!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully and is pending approval.
            </p>
            <p className="text-sm text-gray-500">
              Your assigned instructor or an administrator will review and approve your account. 
              You'll receive access once approved. You'll be redirected to the login page shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <MagnoliaLogo size="lg" />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Magnolia!</h2>
          <p className="text-gray-600 text-sm">Please provide your information to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900 transition-all placeholder:text-gray-400"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900 transition-all placeholder:text-gray-400"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900 transition-all placeholder:text-gray-400"
              placeholder="john.doe@example.com"
            />
          </div>

          {/* Location Selection */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value as 'LZU' | '2M8' | '')}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900 transition-all"
            >
              <option value="">Select a location</option>
              <option value="LZU">Lawrenceville (LZU)</option>
              <option value="2M8">Charles W Baker (2M8)</option>
            </select>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Enrolled In <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {courses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No courses available</p>
              ) : (
                courses.map(course => (
                  <label
                    key={course.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                      className="w-4 h-4 text-magnolia-600 border-gray-300 rounded focus:ring-magnolia-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      <div className="text-xs text-gray-500">{course.description}</div>
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

          {/* Instructor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Instructors <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {instructors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No instructors available</p>
              ) : (
                instructors.map(instructor => (
                  <label
                    key={instructor.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstructors.includes(instructor.id)}
                      onChange={() => handleInstructorToggle(instructor.id)}
                      className="w-4 h-4 text-magnolia-600 border-gray-300 rounded focus:ring-magnolia-500"
                    />
                    <div className="text-sm font-medium text-gray-900">{instructor.name}</div>
                    {instructor.email && (
                      <div className="text-xs text-gray-500 ml-auto">{instructor.email}</div>
                    )}
                  </label>
                ))
              )}
            </div>
            {selectedInstructors.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedInstructors.length} instructor{selectedInstructors.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2 animate-fade-in">
              <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-magnolia-700 text-white py-3 px-4 rounded-lg hover:bg-magnolia-800 focus:outline-none focus:ring-2 focus:ring-magnolia-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href="/"
              className="text-magnolia-700 hover:text-magnolia-800 font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

