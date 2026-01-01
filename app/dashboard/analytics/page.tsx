'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Clock, Users, BookOpen, TrendingUp, FileText, CheckCircle, XCircle, Award } from 'lucide-react'
import { progressService } from '@/services/progressService'
import { courseService, Course } from '@/services/courseService'
import { userService, PortalUser } from '@/services/userService'
import { examService, Exam, ExamAttempt } from '@/services/examService'

interface StudentTimeData {
  userId: string
  userName: string
  userEmail: string
  courseId: string
  courseTitle: string
  timeSpentSeconds: number
  lastViewedAt?: string
}

interface ExamStatisticsData {
  examId: string
  examTitle: string
  studentId: string
  studentName: string
  studentEmail: string
  attempts: ExamAttempt[]
  bestScore?: number
  passed: boolean
  lastAttemptDate?: string
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'time' | 'exams'>('time')
  const [timeData, setTimeData] = useState<StudentTimeData[]>([])
  const [examData, setExamData] = useState<ExamStatisticsData[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<PortalUser[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [selectedExam, setSelectedExam] = useState<string>('all')

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

    // Load courses, exams, and students
    const allCourses = courseService.getAllCourses()
    const allExams = examService.getAllExams()
    const allUsers = userService.getAllUsers()
    const studentUsers = allUsers.filter(u => u.role === 'student')

    setCourses(allCourses)
    setExams(allExams)
    setStudents(studentUsers)

    // Load time data
    loadTimeData(allCourses, studentUsers)
    // Load exam data
    loadExamData(allExams, studentUsers)
  }, [user, authLoading, selectedCourse, selectedStudent, selectedExam])

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

  const loadExamData = (allExams: Exam[], allStudents: PortalUser[]) => {
    const allAttempts = examService.getAllAttempts()
    const dataMap = new Map<string, ExamStatisticsData>()

    allAttempts.forEach(attempt => {
      // Filter by exam if selected
      if (selectedExam !== 'all' && attempt.examId !== selectedExam) return

      // Filter by student if selected
      if (selectedStudent !== 'all' && attempt.userId !== selectedStudent) return

      const exam = allExams.find(e => e.id === attempt.examId)
      const student = allStudents.find(s => s.id === attempt.userId)

      // Only show student data
      if (!exam || !student || student.role !== 'student') return

      const key = `${attempt.examId}-${attempt.userId}`
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          examId: exam.id,
          examTitle: exam.title,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          attempts: [],
          passed: false,
        })
      }

      const data = dataMap.get(key)!
      data.attempts.push(attempt)
      
      // Update best score and passed status
      if (attempt.score !== undefined) {
        if (data.bestScore === undefined || attempt.score > data.bestScore) {
          data.bestScore = attempt.score
        }
        if (attempt.passed) {
          data.passed = true
        }
      }

      // Update last attempt date
      if (attempt.completedAt) {
        const attemptDate = new Date(attempt.completedAt)
        if (!data.lastAttemptDate || attemptDate > new Date(data.lastAttemptDate)) {
          data.lastAttemptDate = attempt.completedAt
        }
      }
    })

    const data = Array.from(dataMap.values())
    // Sort by exam title, then by student name
    data.sort((a, b) => {
      if (a.examTitle !== b.examTitle) {
        return a.examTitle.localeCompare(b.examTitle)
      }
      return a.studentName.localeCompare(b.studentName)
    })
    setExamData(data)
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

  // Exam statistics calculations
  const getTotalExamAttempts = (): number => {
    return examData.reduce((sum, item) => sum + item.attempts.length, 0)
  }

  const getPassedExams = (): number => {
    return examData.filter(item => item.passed).length
  }

  const getPassRate = (): number => {
    if (examData.length === 0) return 0
    return Math.round((getPassedExams() / examData.length) * 100)
  }

  const getAverageScore = (): number => {
    const allScores = examData
      .flatMap(item => item.attempts)
      .filter(attempt => attempt.score !== undefined)
      .map(attempt => attempt.score!)
    
    if (allScores.length === 0) return 0
    const sum = allScores.reduce((a, b) => a + b, 0)
    return Math.round(sum / allScores.length)
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
        <p className="text-gray-600">View student progress, time spent, and exam performance</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('time')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'time'
                ? 'border-magnolia-600 text-magnolia-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Time Tracking</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'exams'
                ? 'border-magnolia-600 text-magnolia-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Exam Statistics</span>
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'time' && (
        <>

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
      )}

      {activeTab === 'exams' && (
        <>
          {/* Exam Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalExamAttempts()}</p>
                </div>
                <FileText className="h-8 w-8 text-magnolia-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{getPassRate()}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{getAverageScore()}%</p>
                </div>
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exams Passed</p>
                  <p className="text-2xl font-bold text-gray-900">{getPassedExams()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Exam Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Exam</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                >
                  <option value="all">All Exams</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
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

          {/* Exam Performance Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Attempt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {examData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No exam data available
                      </td>
                    </tr>
                  ) : (
                    examData.map((item, index) => {
                      const exam = exams.find(e => e.id === item.examId)
                      const passingScore = exam?.passingScore || 70
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.studentName}</div>
                              <div className="text-sm text-gray-500">{item.studentEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.examTitle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.attempts.length}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.bestScore !== undefined ? `${item.bestScore}%` : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.passed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Not Passed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.lastAttemptDate
                              ? new Date(item.lastAttemptDate).toLocaleString()
                              : 'Never'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

