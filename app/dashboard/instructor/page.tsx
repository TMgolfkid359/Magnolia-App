'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { userService, PortalUser } from '@/services/userService'
import { courseService, Course } from '@/services/courseService'
import { CheckCircle, Clock, User, Mail, BookOpen, Users, MapPin } from 'lucide-react'

export default function InstructorPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [assignedStudents, setAssignedStudents] = useState<PortalUser[]>([])
  const [pendingStudents, setPendingStudents] = useState<PortalUser[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'instructor')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'instructor' && user.id) {
      loadStudentData()
    }
  }, [user])

  const loadStudentData = () => {
    if (!user?.id) return
    
    // Get all students assigned to this instructor
    const allAssigned = userService.getStudentsByInstructor(user.id)
    setAssignedStudents(allAssigned)
    
    // Filter pending students
    const pending = allAssigned.filter(
      s => s.enrollmentStatus === 'pending' || (!s.enrollmentStatus && s.enrolled)
    )
    setPendingStudents(pending)
    
    // Load courses for display
    setCourses(courseService.getAllCourses())
  }

  const handleApproveStudent = (studentId: string) => {
    userService.approveStudent(studentId)
    loadStudentData()
  }

  const getCourseNames = (courseIds?: string[]) => {
    if (!courseIds || courseIds.length === 0) return 'None'
    return courseIds
      .map(id => {
        const course = courses.find(c => c.id === id)
        return course?.title || id
      })
      .join(', ')
  }

  if (authLoading || !user || user.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Dashboard</h1>
        <p className="text-gray-600">Manage and approve your assigned students</p>
      </div>

      {/* Pending Students Section */}
      {pendingStudents.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                Pending Student Approvals
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''} awaiting your approval
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 bg-white border border-yellow-300 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                          <Mail className="h-4 w-4" />
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </div>
                    {student.location && (
                      <div className="mt-2 flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <p className="text-xs text-gray-600">
                          Location: {student.location === 'LZU' ? 'Lawrenceville (LZU)' : 'Charles W Baker (2M8)'}
                        </p>
                      </div>
                    )}
                    {student.enrollmentDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Applied: {new Date(student.enrollmentDate).toLocaleDateString()}
                      </p>
                    )}
                    {student.enrolledCourseIds && student.enrolledCourseIds.length > 0 && (
                      <div className="mt-2 flex items-start space-x-2">
                        <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Enrolled Courses:</p>
                          <p className="text-xs text-gray-600">{getCourseNames(student.enrolledCourseIds)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleApproveStudent(student.id)}
                    className="ml-4 px-4 py-2 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Assigned Students Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-magnolia-600" />
              All Assigned Students
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''} assigned to you
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {assignedStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No students assigned to you yet</p>
            </div>
          ) : (
            assignedStudents.map((student) => {
              const isPending = student.enrollmentStatus === 'pending' || (!student.enrollmentStatus && student.enrolled)
              return (
                <div
                  key={student.id}
                  className={`p-4 border rounded-lg ${
                    isPending 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            {isPending ? (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Pending
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <Mail className="h-4 w-4" />
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </div>
                      {student.location && (
                        <div className="mt-2 flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="text-xs text-gray-600">
                            Location: {student.location === 'LZU' ? 'Lawrenceville (LZU)' : 'Charles W Baker (2M8)'}
                          </p>
                        </div>
                      )}
                      {student.enrolledCourseIds && student.enrolledCourseIds.length > 0 && (
                        <div className="mt-2 flex items-start space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-700">Enrolled Courses:</p>
                            <p className="text-xs text-gray-600">{getCourseNames(student.enrolledCourseIds)}</p>
                          </div>
                        </div>
                      )}
                      {student.enrollmentDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {isPending && (
                      <button
                        onClick={() => handleApproveStudent(student.id)}
                        className="ml-4 px-4 py-2 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

