'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, BookOpen, FileText, Clock, CheckCircle, AlertCircle, Plane } from 'lucide-react'
import { courseService, Course } from '@/services/courseService'
import { examService, Exam } from '@/services/examService'
import { progressService } from '@/services/progressService'
import { userService, PortalUser } from '@/services/userService'
import Link from 'next/link'

interface ScheduleItem {
  id: string
  date: string
  startTime: string
  endTime: string
  type: string
  status: string
  aircraftId: string
  instructorId?: string
  notes?: string
}

interface Assignment {
  id: string
  title: string
  type: 'course' | 'exam'
  dueDate?: string
  courseId?: string
  examId?: string
  priority: 'high' | 'medium' | 'low'
  status: 'not-started' | 'in-progress' | 'completed'
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !authLoading) {
      loadSchedule()
      loadAssignments()
    }
  }, [user, authLoading])

  const loadSchedule = async () => {
    if (!user?.email) return

    setLoadingSchedule(true)
    setScheduleError(null)

    try {
      const response = await fetch('/api/fsp/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      const data = await response.json()

      if (data.success && data.upcoming) {
        setSchedule(data.upcoming.slice(0, 10)) // Show next 10 upcoming flights
      } else if (data.error) {
        setScheduleError(data.error)
        setSchedule([])
      } else {
        setSchedule([])
      }
    } catch (error: any) {
      console.error('Error loading schedule:', error)
      setScheduleError('Failed to load schedule')
      setSchedule([])
    } finally {
      setLoadingSchedule(false)
    }
  }

  const loadAssignments = () => {
    if (!user) return

    const allAssignments: Assignment[] = []

    // Get full user data from userService to access enrolledCourseIds
    const fullUser = userService.getUserById(user.id)
    if (!fullUser) return

    // Get user's enrolled courses
    const allCourses = courseService.getAllCourses()
    const userCourses = fullUser.enrolledCourseIds 
      ? allCourses.filter(c => fullUser.enrolledCourseIds?.includes(c.id))
      : allCourses

    // Check course completion status
    userCourses.forEach(course => {
      if (course.completed) return

      // Check if course has materials that haven't been viewed
      const progress = progressService.getProgress(course.id, fullUser.id)
      const materialsViewed = progress?.materialsViewed || 0
      const totalMaterials = course.materials.length

      // Get exams for this course
      const courseExams = examService.getExamsByCourse(course.id)
      const userAttempts = examService.getUserAttempts(fullUser.id)
      
      // Check if all required exams are passed
      const examsPassed = courseExams.every(exam => {
        const attempts = userAttempts.filter(a => a.examId === exam.id && a.completedAt)
        return attempts.some(a => a.passed === true)
      })

      // Determine status
      let status: Assignment['status'] = 'not-started'
      if (materialsViewed > 0 || courseExams.some(exam => {
        const attempts = userAttempts.filter(a => a.examId === exam.id)
        return attempts.length > 0
      })) {
        status = 'in-progress'
      }

      // Determine priority
      let priority: Assignment['priority'] = course.required ? 'high' : 'medium'
      if (materialsViewed === 0 && courseExams.length === 0) {
        priority = 'low'
      }

      // Add course as assignment if not completed
      allAssignments.push({
        id: course.id,
        title: course.title,
        type: 'course',
        courseId: course.id,
        priority,
        status,
      })

      // Add exams as assignments if not passed
      courseExams.forEach(exam => {
        const attempts = userAttempts.filter(a => a.examId === exam.id && a.completedAt)
        const passed = attempts.some(a => a.passed === true)

        if (!passed) {
          allAssignments.push({
            id: exam.id,
            title: exam.title,
            type: 'exam',
            examId: exam.id,
            courseId: course.id,
            priority: course.required ? 'high' : 'medium',
            status: attempts.length > 0 ? 'in-progress' : 'not-started',
          })
        }
      })
    })

    // Sort by priority and status
    allAssignments.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const statusOrder = { 'not-started': 3, 'in-progress': 2, 'completed': 1 }
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return statusOrder[b.status] - statusOrder[a.status]
    })

    setAssignments(allAssignments)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A'
    // Handle both "HH:MM" and "HH:MM:SS" formats
    const parts = timeString.split(':')
    if (parts.length >= 2) {
      const hours = parseInt(parts[0])
      const minutes = parts[1]
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      return `${displayHours}:${minutes} ${period}`
    }
    return timeString
  }

  const getPriorityColor = (priority: Assignment['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'not-started':
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.name || user.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-magnolia-600" />
              <h2 className="text-xl font-semibold text-gray-900">Flight Schedule</h2>
            </div>
            {schedule.length > 0 && (
              <Link
                href="/dashboard/schedule"
                className="text-sm text-magnolia-600 hover:text-magnolia-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>

          {loadingSchedule ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magnolia-600"></div>
            </div>
          ) : scheduleError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{scheduleError}</p>
              {scheduleError.includes('not connected') && (
                <Link
                  href="/dashboard/settings"
                  className="mt-2 inline-block text-sm text-magnolia-600 hover:text-magnolia-700 font-medium"
                >
                  Connect FSP Account
                </Link>
              )}
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No upcoming flights scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Plane className="h-4 w-4 text-magnolia-600" />
                        <h3 className="font-semibold text-gray-900 capitalize">{item.type}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'scheduled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                        </div>
                        {item.aircraftId && item.aircraftId !== 'N/A' && (
                          <div className="text-xs text-gray-500">
                            Aircraft: {item.aircraftId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-magnolia-600" />
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Assignments</h2>
            </div>
            {assignments.length > 0 && (
              <Link
                href="/dashboard/courses"
                className="text-sm text-magnolia-600 hover:text-magnolia-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">All assignments completed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 5).map((assignment) => (
                <Link
                  key={assignment.id}
                  href={
                    assignment.type === 'course'
                      ? `/dashboard/courses#${assignment.courseId}`
                      : `/dashboard/exams#${assignment.examId}`
                  }
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {assignment.type === 'course' ? (
                          <BookOpen className="h-4 w-4 text-magnolia-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-magnolia-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(assignment.priority)}`}>
                          {assignment.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-magnolia-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-magnolia-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const fullUser = userService.getUserById(user.id)
                  return fullUser?.enrolledCourseIds?.length || 0
                })()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status !== 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming Flights</p>
              <p className="text-2xl font-bold text-gray-900">{schedule.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
