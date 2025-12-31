'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Clock, Users, BookOpen, TrendingUp } from 'lucide-react'
import { progressService } from '@/services/progressService'
import { courseService, Course } from '@/services/courseService'
import { userService, PortalUser } from '@/services/userService'

interface StudentTimeData {
  userId: string
  userName: string
  userEmail: string
  courseId: string
  courseTitle: string
  timeSpentSeconds: number
  lastViewedAt?: string
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [timeData, setTimeData] = useState<StudentTimeData[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<PortalUser[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
    // Only allow instructors and admins
    if (!authLoading && user && user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/dashboard/courses')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) return
    if (user.role !== 'instructor' && user.role !== 'admin') return

    // Load courses and students
    const allCourses = courseService.getAllCourses()
    const allUsers = userService.getAllUsers()
    const studentUsers = allUsers.filter(u => u.role === 'student')

    setCourses(allCourses)
    setStudents(studentUsers)

    // Load time data
    loadTimeData(allCourses, studentUsers)
  }, [user, authLoading, selectedCourse, selectedStudent])

  const loadTimeData = (allCourses: Course[], allStudents: PortalUser[]) => {
    const allProgress = progressService.getAllUsersProgress()
    const data: StudentTimeData[] = []

    allProgress.forEach(progress => {
      // Filter by course if selected
      if (selectedCourse !== 'all' && progress.courseId !== selectedCourse) return

      // Filter by student if selected
      if (selectedStudent !== 'all' && progress.userId !== selectedStudent) return

      const course = allCourses.find(c => c.id === progress.courseId)
      const student = allStudents.find(s => s.id === progress.userId)

      // Only show student data
      if (!course || !student || student.role !== 'student') return

      const timeSpent = progressService.getTimeSpent(progress.courseId, progress.userId)

      data.push({
        userId: progress.userId,
        userName: student.name,
        userEmail: student.email,
        courseId: progress.courseId,
        courseTitle: course.title,
        timeSpentSeconds: timeSpent,
        lastViewedAt: progress.lastViewedAt,
      })
    })

    // Sort by time spent (descending)
    data.sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds)
    setTimeData(data)
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${hours}h`
  }

  const getTotalTime = (): number => {
    return timeData.reduce((sum, item) => sum + item.timeSpentSeconds, 0)
  }

  const getAverageTime = (): number => {
    if (timeData.length === 0) return 0
    return Math.floor(getTotalTime() / timeData.length)
  }

  const getUniqueStudents = (): number => {
    return new Set(timeData.map(d => d.userId)).size
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  if (user.role !== 'instructor' && user.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Analytics</h1>
        <p className="text-gray-600">View time spent by students on each course</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(getTotalTime())}</p>
            </div>
            <Clock className="h-8 w-8 text-magnolia-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(getAverageTime())}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-magnolia-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">{getUniqueStudents()}</p>
            </div>
            <Users className="h-8 w-8 text-magnolia-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Course Records</p>
              <p className="text-2xl font-bold text-gray-900">{timeData.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-magnolia-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
            >
              <option value="all">All Students</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name} ({student.email})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Time Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Viewed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No time data available
                  </td>
                </tr>
              ) : (
                timeData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.userName}</div>
                        <div className="text-sm text-gray-500">{item.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.courseTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-magnolia-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatTime(item.timeSpentSeconds)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lastViewedAt
                        ? new Date(item.lastViewedAt).toLocaleString()
                        : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

