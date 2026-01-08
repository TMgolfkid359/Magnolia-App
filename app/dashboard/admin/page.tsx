'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Users, BookOpen, Video, FileText, Plus, Edit, Trash2, Save, X, CheckCircle, MapPin, Wrench } from 'lucide-react'
import { userService, PortalUser } from '@/services/userService'
import { courseService, Course } from '@/services/courseService'
import { videoService, VideoLesson } from '@/services/videoService'
import { examService, Exam, ExamQuestion } from '@/services/examService'

type Tab = 'users' | 'courses' | 'videos' | 'exams' | 'tools'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  // User management state
  const [users, setUsers] = useState<PortalUser[]>([])
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null)

  // Course management state
  const [courses, setCourses] = useState<Course[]>([])
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isAddingCourse, setIsAddingCourse] = useState(false)

  // Video management state
  const [videos, setVideos] = useState<VideoLesson[]>([])
  const [editingVideo, setEditingVideo] = useState<VideoLesson | null>(null)
  const [isAddingVideo, setIsAddingVideo] = useState(false)

  // Exam management state
  const [exams, setExams] = useState<Exam[]>([])
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [isAddingExam, setIsAddingExam] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllData()
    }
  }, [user, activeTab])

  const loadAllData = () => {
    setUsers(userService.getAllUsers())
    setCourses(courseService.getAllCourses())
    setVideos(videoService.getAllVideos())
    setExams(examService.getAllExams())
  }

  // User Management Functions
  const handleRoleChange = (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    userService.updateUserRole(userId, newRole)
    loadAllData()
  }

  // Course Management Functions
  const handleAddCourse = () => {
    setIsAddingCourse(true)
    setEditingCourse(null)
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setIsAddingCourse(false)
  }

  const handleSaveCourse = (courseData: Partial<Course>) => {
    if (!courseData.title) {
      alert('Please fill in the course title')
      return
    }

    let savedCourse: Course | null = null
    if (editingCourse) {
      savedCourse = courseService.updateCourse(editingCourse.id, courseData)
    } else {
      savedCourse = courseService.addCourse(courseData as Omit<Course, 'id'>)
    }

    // Link exams to course if quiz materials have examIds
    if (savedCourse && savedCourse.materials) {
      savedCourse.materials.forEach(material => {
        if (material.type === 'quiz' && material.examId) {
          // Update the exam's courseId to link it to this course
          const exam = examService.getExamById(material.examId)
          if (exam && exam.courseId !== savedCourse!.id) {
            examService.updateExam(material.examId, { courseId: savedCourse!.id })
          }
        }
      })
    }

    loadAllData()
    setIsAddingCourse(false)
    setEditingCourse(null)
  }

  const handleDeleteCourse = (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      courseService.deleteCourse(id)
      loadAllData()
    }
  }

  // Video Management Functions (existing)
  const handleAddVideo = () => {
    setIsAddingVideo(true)
    setEditingVideo(null)
  }

  const handleEditVideo = (video: VideoLesson) => {
    setEditingVideo(video)
    setIsAddingVideo(false)
  }

  const handleSaveVideo = (videoData: Partial<VideoLesson>) => {
    if (!videoData.title || !videoData.videoUrl) {
      alert('Please fill in title and video URL')
      return
    }

    if (editingVideo) {
      videoService.updateVideo(editingVideo.id, videoData)
    } else {
      videoService.addVideo(videoData as Omit<VideoLesson, 'id'>)
    }
    loadAllData()
    setIsAddingVideo(false)
    setEditingVideo(null)
  }

  const handleDeleteVideo = (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      videoService.deleteVideo(id)
      loadAllData()
    }
  }

  // Exam Management Functions
  const handleAddExam = () => {
    setIsAddingExam(true)
    setEditingExam(null)
  }

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam)
    setIsAddingExam(false)
  }

  const handleSaveExam = (examData: Partial<Exam>) => {
    if (!examData.title || !examData.questions || examData.questions.length === 0) {
      alert('Please fill in title and add at least one question')
      return
    }

    if (editingExam) {
      examService.updateExam(editingExam.id, examData)
    } else {
      examService.addExam(examData as Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>)
    }
    loadAllData()
    setIsAddingExam(false)
    setEditingExam(null)
  }

  const handleDeleteExam = (id: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      examService.deleteExam(id)
      loadAllData()
    }
  }

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, courses, videos, and exams</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'users' as Tab, label: 'Users', icon: Users, count: users.length },
            { id: 'courses' as Tab, label: 'Courses', icon: BookOpen, count: courses.length },
            { id: 'videos' as Tab, label: 'Videos', icon: Video, count: videos.length },
            { id: 'exams' as Tab, label: 'Exams', icon: FileText, count: exams.length },
            { id: 'tools' as Tab, label: 'Interactive Tools', icon: Wrench, count: 0 },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-magnolia-600 text-magnolia-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && (
          <UsersTab 
            users={users} 
            onRoleChange={handleRoleChange}
            onUsersUpdate={loadAllData}
          />
        )}
        {activeTab === 'courses' && (
          <CoursesTab
            courses={courses}
            exams={exams}
            onAdd={handleAddCourse}
            onEdit={handleEditCourse}
            onSave={handleSaveCourse}
            onDelete={handleDeleteCourse}
            isAdding={isAddingCourse}
            editingCourse={editingCourse}
            onCancel={() => {
              setIsAddingCourse(false)
              setEditingCourse(null)
            }}
          />
        )}
        {activeTab === 'videos' && (
          <VideosTab
            videos={videos}
            onAdd={handleAddVideo}
            onEdit={handleEditVideo}
            onSave={handleSaveVideo}
            onDelete={handleDeleteVideo}
            isAdding={isAddingVideo}
            editingVideo={editingVideo}
            onCancel={() => {
              setIsAddingVideo(false)
              setEditingVideo(null)
            }}
          />
        )}
        {activeTab === 'exams' && (
          <ExamsTab
            exams={exams}
            courses={courses}
            onAdd={handleAddExam}
            onEdit={handleEditExam}
            onSave={handleSaveExam}
            onDelete={handleDeleteExam}
            isAdding={isAddingExam}
            editingExam={editingExam}
            onCancel={() => {
              setIsAddingExam(false)
              setEditingExam(null)
            }}
          />
        )}
        {activeTab === 'tools' && (
          <InteractiveToolsTab />
        )}
      </div>
    </div>
  )
}

// Users Tab Component
function UsersTab({ 
  users, 
  onRoleChange,
  onUsersUpdate 
}: { 
  users: PortalUser[]
  onRoleChange: (id: string, role: 'student' | 'instructor' | 'admin') => void
  onUsersUpdate?: () => void
}) {
  const [editingFspId, setEditingFspId] = useState<{ userId: string; type: 'student' | 'instructor' } | null>(null)
  const [fspIdValue, setFspIdValue] = useState('')
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  
  // Create user form state
  const [newUserFirstName, setNewUserFirstName] = useState('')
  const [newUserLastName, setNewUserLastName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'student' | 'instructor' | 'admin'>('student')
  const [newUserLocation, setNewUserLocation] = useState<'LZU' | '2M8' | ''>('')
  const [newUserSelectedCourses, setNewUserSelectedCourses] = useState<string[]>([])
  const [newUserSelectedInstructors, setNewUserSelectedInstructors] = useState<string[]>([])
  const [createUserError, setCreateUserError] = useState('')
  
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<PortalUser[]>([])
  
  // Get pending students - use useMemo with empty deps since it reads from localStorage
  const pendingStudents = useMemo(() => userService.getPendingStudents(), [])
  
  useEffect(() => {
    // Load courses and instructors for create form
    setCourses(courseService.getAllCourses())
    const allUsers = userService.getAllUsers()
    setInstructors(allUsers.filter(u => u.role === 'instructor' && u.enrolled))
  }, [users])
  
  const handleApproveStudent = (studentId: string) => {
    userService.approveStudent(studentId)
    if (onUsersUpdate) {
      onUsersUpdate()
    }
  }
  
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const success = userService.deleteUser(userId)
      if (success && onUsersUpdate) {
        onUsersUpdate()
      }
      setDeletingUserId(null)
    } else {
      setDeletingUserId(null)
    }
  }
  
  const handleCreateUser = () => {
    setCreateUserError('')
    
    // Validation
    if (!newUserFirstName.trim() || !newUserLastName.trim()) {
      setCreateUserError('Please enter both first and last name')
      return
    }
    
    if (!newUserEmail.trim() || !newUserEmail.includes('@')) {
      setCreateUserError('Please enter a valid email address')
      return
    }
    
    // Check if email already exists
    const existingUser = userService.getUserByEmail(newUserEmail)
    if (existingUser) {
      setCreateUserError('An account with this email already exists')
      return
    }
    
    // For students, validate location and courses/instructors
    if (newUserRole === 'student') {
      if (!newUserLocation) {
        setCreateUserError('Please select a location for the student')
        return
      }
      if (newUserSelectedCourses.length === 0) {
        setCreateUserError('Please select at least one course for the student')
        return
      }
      if (newUserSelectedInstructors.length === 0) {
        setCreateUserError('Please select at least one instructor for the student')
        return
      }
    }
    
    // Create the user
    const newUser = userService.addUser({
      name: `${newUserFirstName} ${newUserLastName}`,
      firstName: newUserFirstName,
      lastName: newUserLastName,
      email: newUserEmail,
      role: newUserRole,
      enrolled: true,
      enrollmentStatus: newUserRole === 'student' ? 'approved' : undefined, // Students start approved when created by admin
      enrollmentDate: new Date().toISOString(),
      location: newUserLocation ? (newUserLocation as 'LZU' | '2M8') : undefined,
      enrolledCourseIds: newUserRole === 'student' ? newUserSelectedCourses : undefined,
      assignedInstructorIds: newUserRole === 'student' ? newUserSelectedInstructors : undefined,
    })
    
    // Reset form
    setNewUserFirstName('')
    setNewUserLastName('')
    setNewUserEmail('')
    setNewUserRole('student')
    setNewUserLocation('')
    setNewUserSelectedCourses([])
    setNewUserSelectedInstructors([])
    setIsCreatingUser(false)
    
    if (onUsersUpdate) {
      onUsersUpdate()
    }
  }
  
  const handleCancelCreate = () => {
    setIsCreatingUser(false)
    setNewUserFirstName('')
    setNewUserLastName('')
    setNewUserEmail('')
    setNewUserRole('student')
    setNewUserLocation('')
    setNewUserSelectedCourses([])
    setNewUserSelectedInstructors([])
    setCreateUserError('')
  }
  
  const handleCourseToggle = (courseId: string) => {
    setNewUserSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }
  
  const handleInstructorToggle = (instructorId: string) => {
    setNewUserSelectedInstructors(prev => 
      prev.includes(instructorId) 
        ? prev.filter(id => id !== instructorId)
        : [...prev, instructorId]
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'instructor':
        return 'bg-blue-100 text-blue-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEditFspId = (user: PortalUser, type: 'student' | 'instructor') => {
    setEditingFspId({ userId: user.id, type })
    setFspIdValue(type === 'student' ? (user.fspStudentId || '') : (user.fspInstructorId || ''))
  }

  const handleSaveFspId = () => {
    if (!editingFspId) return
    
    const { userId, type } = editingFspId
    if (type === 'student') {
      userService.updateUserFspId(userId, fspIdValue || undefined)
    } else {
      userService.updateUserFspId(userId, undefined, fspIdValue || undefined)
    }
    
    setEditingFspId(null)
    setFspIdValue('')
    // Trigger parent component to reload users
    if (onUsersUpdate) {
      onUsersUpdate()
    }
  }

  const handleCancelEdit = () => {
    setEditingFspId(null)
    setFspIdValue('')
  }

  return (
    <div className="space-y-6">
      {/* Pending Students Section */}
      {pendingStudents.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending Student Approvals</h2>
              <p className="text-sm text-gray-600 mt-1">
                {pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 bg-white border border-yellow-300 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    {student.location && (
                      <div className="mt-1 flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-600">
                          Location: {student.location === 'LZU' ? 'Lawrenceville (LZU)' : 'Charles W Baker (2M8)'}
                        </p>
                      </div>
                    )}
                    {student.enrollmentDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {new Date(student.enrollmentDate).toLocaleDateString()}
                      </p>
                    )}
                    {student.enrolledCourseIds && student.enrolledCourseIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Courses: {student.enrolledCourseIds.length} selected
                      </p>
                    )}
                    {student.assignedInstructorIds && student.assignedInstructorIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned Instructors: {student.assignedInstructorIds.length}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleApproveStudent(student.id)}
                    className="ml-4 px-4 py-2 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors text-sm font-medium"
                  >
                    Approve Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Users Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Enrolled Users ({users.filter(u => {
            if (!u.enrolled) return false
            // Show approved students, or all non-students, or legacy students without status
            if (u.role === 'student') {
              return u.enrollmentStatus === 'approved' || (!u.enrollmentStatus && u.enrolled)
            }
            return true
          }).length})</h2>
          <button
            onClick={() => setIsCreatingUser(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Create Account</span>
          </button>
        </div>
        
        {/* Create User Form */}
        {isCreatingUser && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Account</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900"
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => {
                    setNewUserRole(e.target.value as 'student' | 'instructor' | 'admin')
                    // Clear student-specific fields if role changes
                    if (e.target.value !== 'student') {
                      setNewUserLocation('')
                      setNewUserSelectedCourses([])
                      setNewUserSelectedInstructors([])
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {newUserRole === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newUserLocation}
                      onChange={(e) => setNewUserLocation(e.target.value as 'LZU' | '2M8' | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-500 focus:border-magnolia-500 text-gray-900"
                    >
                      <option value="">Select a location</option>
                      <option value="LZU">Lawrenceville (LZU)</option>
                      <option value="2M8">Charles W Baker (2M8)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Courses <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                      {courses.map(course => (
                        <label key={course.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newUserSelectedCourses.includes(course.id)}
                            onChange={() => handleCourseToggle(course.id)}
                            className="w-4 h-4 text-magnolia-600 border-gray-300 rounded focus:ring-magnolia-500"
                          />
                          <span className="text-sm text-gray-700">{course.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructors <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                      {instructors.map(instructor => (
                        <label key={instructor.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newUserSelectedInstructors.includes(instructor.id)}
                            onChange={() => handleInstructorToggle(instructor.id)}
                            className="w-4 h-4 text-magnolia-600 border-gray-300 rounded focus:ring-magnolia-500"
                          />
                          <span className="text-sm text-gray-700">{instructor.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {createUserError && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm">{createUserError}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700 transition-colors text-sm font-medium"
                >
                  Create Account
                </button>
                <button
                  onClick={handleCancelCreate}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
        {users.filter(u => {
          if (!u.enrolled) return false
          // Show approved students, or all non-students, or legacy students without status
          if (u.role === 'student') {
            return u.enrollmentStatus === 'approved' || (!u.enrollmentStatus && u.enrolled)
          }
          return true
        }).map((user) => (
          <div
            key={user.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-magnolia-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.location && user.role === 'student' && (
                      <div className="mt-1 flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-600">
                          Location: {user.location === 'LZU' ? 'Lawrenceville (LZU)' : 'Charles W Baker (2M8)'}
                        </p>
                      </div>
                    )}
                    {user.enrollmentDate && (
                      <p className="text-xs text-gray-500">
                        Enrolled: {new Date(user.enrollmentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
                <select
                  value={user.role}
                  onChange={(e) => onRoleChange(user.id, e.target.value as 'student' | 'instructor' | 'admin')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 focus:border-transparent text-gray-900"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete user"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* FSP ID Management */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <div className="text-xs font-medium text-gray-700 mb-2">Flight Schedule Pro IDs:</div>
              
              {user.role === 'student' && (
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600 w-20">Student ID:</label>
                  {editingFspId?.userId === user.id && editingFspId.type === 'student' ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={fspIdValue}
                        onChange={(e) => setFspIdValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                        placeholder="Enter FSP Student ID"
                      />
                      <button
                        onClick={handleSaveFspId}
                        className="px-2 py-1 text-xs bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center space-x-2">
                      <span className="text-xs text-gray-600 flex-1">
                        {user.fspStudentId || 'Not set'}
                      </span>
                      <button
                        onClick={() => handleEditFspId(user, 'student')}
                        className="px-2 py-1 text-xs text-magnolia-600 hover:bg-magnolia-50 rounded-md"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {(user.role === 'instructor' || user.role === 'admin') && (
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600 w-20">Instructor ID:</label>
                  {editingFspId?.userId === user.id && editingFspId.type === 'instructor' ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={fspIdValue}
                        onChange={(e) => setFspIdValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                        placeholder="Enter FSP Instructor ID"
                      />
                      <button
                        onClick={handleSaveFspId}
                        className="px-2 py-1 text-xs bg-magnolia-600 text-white rounded-md hover:bg-magnolia-700"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center space-x-2">
                      <span className="text-xs text-gray-600 flex-1">
                        {user.fspInstructorId || 'Not set'}
                      </span>
                      <button
                        onClick={() => handleEditFspId(user, 'instructor')}
                        className="px-2 py-1 text-xs text-magnolia-600 hover:bg-magnolia-50 rounded-md"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {users.filter(u => {
          if (!u.enrolled) return false
          // Show approved students, or all non-students, or legacy students without status
          if (u.role === 'student') {
            return u.enrollmentStatus === 'approved' || (!u.enrollmentStatus && u.enrolled)
          }
          return true
        }).length === 0 && (
          <div className="text-center py-8 text-gray-500">No enrolled users</div>
        )}
        </div>
      </div>
    </div>
  )
}

// Courses Tab Component
function CoursesTab({
  courses,
  exams,
  onAdd,
  onEdit,
  onSave,
  onDelete,
  isAdding,
  editingCourse,
  onCancel,
}: {
  courses: Course[]
  exams: Exam[]
  onAdd: () => void
  onEdit: (course: Course) => void
  onSave: (data: Partial<Course>) => void
  onDelete: (id: string) => void
  isAdding: boolean
  editingCourse: Course | null
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<Course>>({
    title: '',
    description: '',
    type: 'ground',
    required: false,
    estimatedTime: '',
    materials: [],
  })

  useEffect(() => {
    if (editingCourse) {
      setFormData(editingCourse)
    } else if (isAdding) {
      setFormData({
        title: '',
        description: '',
        type: 'ground',
        required: false,
        estimatedTime: '',
        materials: [],
      })
    }
  }, [editingCourse, isAdding])

  const handleSave = () => {
    onSave(formData)
    setFormData({
      title: '',
      description: '',
      type: 'ground',
      required: false,
      estimatedTime: '',
      materials: [],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Courses</h2>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 bg-magnolia-800 text-white px-4 py-2 rounded-md hover:bg-magnolia-900 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Course</span>
        </button>
      </div>

      {(isAdding || editingCourse) && (
        <CourseForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={onCancel}
          isEditing={!!editingCourse}
          exams={exams}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <BookOpen className="h-5 w-5 text-magnolia-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                  {course.required && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Type: {course.type}</span>
                  <span>Time: {course.estimatedTime}</span>
                  <span>Materials: {course.materials.length}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onEdit(course)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(course.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="text-center py-8 text-gray-500">No courses yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

function CourseForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  isEditing,
  exams,
}: {
  formData: Partial<Course>
  setFormData: (data: Partial<Course>) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
  exams: Exam[]
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{isEditing ? 'Edit Course' : 'Add New Course'}</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type || 'ground'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
          >
            <option value="indoc">Indoc</option>
            <option value="ground">Ground</option>
            <option value="preflight">Pre-Flight</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
          <input
            type="text"
            value={formData.estimatedTime || ''}
            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
            placeholder="2 hours"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={formData.required || false}
            onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
            className="h-4 w-4 text-magnolia-600 focus:ring-magnolia-600"
          />
          <label htmlFor="required" className="text-sm font-medium text-gray-700">
            Required Course
          </label>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
          />
        </div>
      </div>

      {/* Course Materials Section */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">Course Materials</label>
          <button
            type="button"
            onClick={() => {
              const currentMaterials = formData.materials || []
              setFormData({
                ...formData,
                materials: [...currentMaterials, { type: 'document', title: '', url: '' }],
              })
            }}
            className="flex items-center space-x-1 text-sm text-magnolia-600 hover:text-magnolia-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Material</span>
          </button>
        </div>
        <div className="space-y-3">
          {(formData.materials || []).map((material, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={material.type}
                    onChange={(e) => {
                      const newMaterials = [...(formData.materials || [])]
                      const newType = e.target.value as 'document' | 'video' | 'quiz'
                      newMaterials[index] = { 
                        ...material, 
                        type: newType,
                        examId: newType === 'quiz' ? material.examId : undefined // Keep examId if switching to quiz, clear otherwise
                      }
                      setFormData({ ...formData, materials: newMaterials })
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={material.title}
                    onChange={(e) => {
                      const newMaterials = [...(formData.materials || [])]
                      newMaterials[index] = { ...material, title: e.target.value }
                      setFormData({ ...formData, materials: newMaterials })
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                    placeholder="Material title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {material.type === 'document' ? 'Upload File or URL' : material.type === 'video' ? 'Video URL' : 'Select Exam'}
                  </label>
                  {material.type === 'document' ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              const newMaterials = [...(formData.materials || [])]
                              newMaterials[index] = {
                                ...material,
                                fileData: reader.result as string,
                                fileName: file.name,
                                fileType: file.type,
                                url: undefined, // Clear URL if file is uploaded
                              }
                              setFormData({ ...formData, materials: newMaterials })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-magnolia-50 file:text-magnolia-700 hover:file:bg-magnolia-100"
                      />
                      {material.fileName && (
                        <div className="text-xs text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>{material.fileName}</span>
                        </div>
                      )}
                      <input
                        type="text"
                        value={material.url || ''}
                        onChange={(e) => {
                          const newMaterials = [...(formData.materials || [])]
                          newMaterials[index] = { ...material, url: e.target.value, fileData: undefined, fileName: undefined }
                          setFormData({ ...formData, materials: newMaterials })
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                        placeholder="Or enter document URL"
                      />
                    </div>
                  ) : material.type === 'quiz' ? (
                    <select
                      value={material.examId || ''}
                      onChange={(e) => {
                        const newMaterials = [...(formData.materials || [])]
                        newMaterials[index] = { 
                          ...material, 
                          examId: e.target.value || undefined,
                          url: undefined // Clear URL for quiz type
                        }
                        setFormData({ ...formData, materials: newMaterials })
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                    >
                      <option value="">Select an exam...</option>
                      {exams.map(exam => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title} ({exam.questions.length} questions)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={material.url || ''}
                      onChange={(e) => {
                        const newMaterials = [...(formData.materials || [])]
                        newMaterials[index] = { ...material, url: e.target.value }
                        setFormData({ ...formData, materials: newMaterials })
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                      placeholder="Video URL"
                    />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newMaterials = (formData.materials || []).filter((_, i) => i !== index)
                  setFormData({ ...formData, materials: newMaterials })
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors mt-6"
                title="Remove material"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {(!formData.materials || formData.materials.length === 0) && (
            <div className="text-center py-4 text-sm text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
              No materials added yet. Click "Add Material" to get started.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex items-center space-x-2 px-4 py-2 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900"
        >
          <Save className="h-4 w-4" />
          <span>Save Course</span>
        </button>
      </div>
    </div>
  )
}

// Videos Tab Component (simplified - using existing logic)
function VideosTab({
  videos,
  onAdd,
  onEdit,
  onSave,
  onDelete,
  isAdding,
  editingVideo,
  onCancel,
}: {
  videos: VideoLesson[]
  onAdd: () => void
  onEdit: (video: VideoLesson) => void
  onSave: (data: Partial<VideoLesson>) => void
  onDelete: (id: string) => void
  isAdding: boolean
  editingVideo: VideoLesson | null
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<VideoLesson>>({
    title: '',
    description: '',
    category: 'ground',
    duration: '',
    date: new Date().toISOString().split('T')[0],
    videoUrl: '',
    instructor: '',
  })

  useEffect(() => {
    if (editingVideo) {
      setFormData(editingVideo)
    } else if (isAdding) {
      setFormData({
        title: '',
        description: '',
        category: 'ground',
        duration: '',
        date: new Date().toISOString().split('T')[0],
        videoUrl: '',
        instructor: '',
      })
    }
  }, [editingVideo, isAdding])

  const handleSave = () => {
    onSave(formData)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ground':
        return 'bg-blue-100 text-blue-800'
      case 'flight':
        return 'bg-green-100 text-green-800'
      case 'safety':
        return 'bg-red-100 text-red-800'
      case 'systems':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Videos</h2>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 bg-magnolia-800 text-white px-4 py-2 rounded-md hover:bg-magnolia-900"
        >
          <Plus className="h-5 w-5" />
          <span>Add Video</span>
        </button>
      </div>

      {(isAdding || editingVideo) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingVideo ? 'Edit Video' : 'Add Video'}</h3>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category || 'ground'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
              >
                <option value="ground">Ground</option>
                <option value="flight">Flight</option>
                <option value="safety">Safety</option>
                <option value="systems">Systems</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                placeholder="45:30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
              <input
                type="text"
                value={formData.instructor || ''}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
              <input
                type="text"
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900"
            >
              <Save className="h-4 w-4" />
              <span>Save Video</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Video className="h-5 w-5 text-magnolia-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(video.category)}`}>
                    {video.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{video.description}</p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onEdit(video)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(video.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Exams Tab Component
function ExamsTab({
  exams,
  courses,
  onAdd,
  onEdit,
  onSave,
  onDelete,
  isAdding,
  editingExam,
  onCancel,
}: {
  exams: Exam[]
  courses: Course[]
  onAdd: () => void
  onEdit: (exam: Exam) => void
  onSave: (data: Partial<Exam>) => void
  onDelete: (id: string) => void
  isAdding: boolean
  editingExam: Exam | null
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<Exam>>({
    title: '',
    description: '',
    courseId: '',
    questions: [],
    passingScore: 70,
    timeLimit: undefined,
    attemptsAllowed: undefined,
  })

  useEffect(() => {
    if (editingExam) {
      setFormData(editingExam)
    } else if (isAdding) {
      setFormData({
        title: '',
        description: '',
        courseId: '',
        questions: [],
        passingScore: 70,
        timeLimit: undefined,
        attemptsAllowed: undefined,
      })
    }
  }, [editingExam, isAdding])

  const handleSave = () => {
    if (!formData.questions || formData.questions.length === 0) {
      alert('Please add at least one question')
      return
    }
    onSave(formData)
  }

  const addQuestion = () => {
    const newQuestion: ExamQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
    }
    setFormData({
      ...formData,
      questions: [...(formData.questions || []), newQuestion],
    })
  }

  const updateQuestion = (questionId: string, updates: Partial<ExamQuestion>) => {
    const questions = formData.questions?.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ) || []
    setFormData({ ...formData, questions })
  }

  const removeQuestion = (questionId: string) => {
    const questions = formData.questions?.filter(q => q.id !== questionId) || []
    setFormData({ ...formData, questions })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Exams</h2>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 bg-magnolia-800 text-white px-4 py-2 rounded-md hover:bg-magnolia-900"
        >
          <Plus className="h-5 w-5" />
          <span>Add Exam</span>
        </button>
      </div>

      {(isAdding || editingExam) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingExam ? 'Edit Exam' : 'Add Exam'}</h3>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course (Optional)</label>
                <select
                  value={formData.courseId || ''}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                >
                  <option value="">None</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  value={formData.passingScore || 70}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes, optional)</label>
                <input
                  type="number"
                  value={formData.timeLimit || ''}
                  onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attempts Allowed (optional)</label>
                <input
                  type="number"
                  value={formData.attemptsAllowed || ''}
                  onChange={(e) => setFormData({ ...formData, attemptsAllowed: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                  placeholder="Unlimited if empty"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited attempts</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Questions *</label>
                <button
                  onClick={addQuestion}
                  className="text-sm text-magnolia-600 hover:text-magnolia-700 font-medium"
                >
                  + Add Question
                </button>
              </div>
              <div className="space-y-4">
                {formData.questions?.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Question Text</label>
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, { type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                          >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True/False</option>
                            <option value="short-answer">Short Answer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Points</label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                            min="1"
                          />
                        </div>
                      </div>
                      {question.type === 'multiple-choice' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Options</label>
                          {question.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(question.options || [])]
                                  newOptions[optIndex] = e.target.value
                                  updateQuestion(question.id, { options: newOptions })
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                                placeholder={`Option ${optIndex + 1}`}
                              />
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctAnswer === option}
                                onChange={() => updateQuestion(question.id, { correctAnswer: option })}
                                className="h-4 w-4 text-magnolia-600"
                              />
                              <span className="text-xs text-gray-500">Correct</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(question.type === 'true-false' || question.type === 'short-answer') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Correct Answer</label>
                          {question.type === 'true-false' ? (
                            <select
                              value={question.correctAnswer as string}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={question.correctAnswer as string}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 text-gray-900"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!formData.questions || formData.questions.length === 0) && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No questions yet. Click "Add Question" to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900"
            >
              <Save className="h-4 w-4" />
              <span>Save Exam</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="h-5 w-5 text-magnolia-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                    {exam.questions.length} questions
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Pass: {exam.passingScore}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">{exam.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                  {exam.courseId && (
                    <span>Course: {courses.find(c => c.id === exam.courseId)?.title || 'Unknown'}</span>
                  )}
                  {exam.timeLimit && <span>Time Limit: {exam.timeLimit} min</span>}
                  {exam.attemptsAllowed && <span>Attempts: {exam.attemptsAllowed}</span>}
                  {!exam.attemptsAllowed && <span>Attempts: Unlimited</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onEdit(exam)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(exam.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {exams.length === 0 && (
            <div className="text-center py-8 text-gray-500">No exams yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Interactive Tools Tab Component
function InteractiveToolsTab() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [tools] = useState([
    { id: 'g3xtouch', name: 'G3X Touch Instruments', description: 'Interactive Garmin G3X Touch instrument simulator', icon: '🛩️' }
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Interactive Tools</h2>
        <p className="text-gray-600">Select an interactive tool to use</p>
      </div>

      {!selectedTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="text-4xl mb-3">{tool.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{tool.name}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </button>
          ))}
        </div>
      ) : selectedTool === 'g3xtouch' ? (
        <G3XTouchSimulator onBack={() => setSelectedTool(null)} />
      ) : null}
    </div>
  )
}

// G3X Touch Simulator Component
function G3XTouchSimulator({ onBack }: { onBack: () => void }) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null)
  
  // Flight parameters state
  const [altitude, setAltitude] = useState(3500)
  const [heading, setHeading] = useState(180)
  const [airspeed, setAirspeed] = useState(120)
  const [verticalSpeed, setVerticalSpeed] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [roll, setRoll] = useState(0)
  const [rpm, setRpm] = useState(2400)
  const [oilTemp, setOilTemp] = useState(90)
  const [oilPressure, setOilPressure] = useState(60)
  const [fuelQuantity, setFuelQuantity] = useState(20)

  // Send update to iframe
  const updateSimVar = (name: string, value: number) => {
    if (iframeRef?.contentWindow) {
      iframeRef.contentWindow.postMessage({
        type: 'UPDATE_SIMVAR',
        name,
        value
      }, '*')
    }
  }

  // Handle parameter changes
  const handleAltitudeChange = (value: number) => {
    setAltitude(value)
    updateSimVar('INDICATED ALTITUDE', value)
    updateSimVar('PLANE ALTITUDE', value)
  }

  const handleHeadingChange = (value: number) => {
    setHeading(value)
    updateSimVar('PLANE HEADING DEGREES TRUE', value)
    updateSimVar('PLANE HEADING DEGREES MAGNETIC', value)
  }

  const handleAirspeedChange = (value: number) => {
    setAirspeed(value)
    updateSimVar('AIRSPEED INDICATED', value)
    updateSimVar('AIRSPEED TRUE', value)
    updateSimVar('GPS GROUND SPEED', value)
  }

  const handleVerticalSpeedChange = (value: number) => {
    setVerticalSpeed(value)
    updateSimVar('VERTICAL SPEED', value)
  }

  const handlePitchChange = (value: number) => {
    setPitch(value)
    updateSimVar('PLANE PITCH DEGREES', value)
  }

  const handleRollChange = (value: number) => {
    setRoll(value)
    updateSimVar('PLANE BANK DEGREES', value)
  }

  const handleRpmChange = (value: number) => {
    setRpm(value)
    updateSimVar('GENERAL ENG RPM:1', value)
  }

  const handleOilTempChange = (value: number) => {
    setOilTemp(value)
    updateSimVar('ENG OIL TEMPERATURE:1', value)
  }

  const handleOilPressureChange = (value: number) => {
    setOilPressure(value)
    updateSimVar('ENG OIL PRESSURE:1', value)
  }

  const handleFuelChange = (value: number) => {
    setFuelQuantity(value)
    updateSimVar('FUEL TANK QUANTITY:1', value)
  }

  const resetToLevelFlight = () => {
    handleAltitudeChange(3500)
    handleHeadingChange(180)
    handleAirspeedChange(120)
    handleVerticalSpeedChange(0)
    handlePitchChange(0)
    handleRollChange(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">G3X Touch Instruments</h2>
          <p className="text-gray-600 text-sm mt-1">Interactive Garmin G3X Touch Simulator with Mock MSFS SDK</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back to Tools
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-green-700">
              <strong>Interactive Mode:</strong> This simulator uses a mock MSFS SDK that provides simulated flight data. 
              Use the controls below to interact with the G3X Touch instrument in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* G3X Touch Display */}
      <div className="bg-gray-900 rounded-lg shadow-lg border-2 border-gray-700 overflow-hidden">
        <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe
            ref={setIframeRef}
            src="/g3xtouch/index.html"
            className="absolute top-0 left-0 w-full h-full border-0"
            title="G3X Touch Simulator"
            onLoad={() => setIframeLoaded(true)}
            sandbox="allow-scripts allow-same-origin"
            style={{ background: '#000' }}
          />
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading G3X Touch...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Altitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Altitude: {altitude.toLocaleString()} ft
            </label>
            <input
              type="range"
              min="0"
              max="50000"
              step="100"
              value={altitude}
              onChange={(e) => handleAltitudeChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Heading */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heading: {Math.round(heading)}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={heading}
              onChange={(e) => handleHeadingChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Airspeed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Airspeed: {Math.round(airspeed)} kt
            </label>
            <input
              type="range"
              min="0"
              max="300"
              step="1"
              value={airspeed}
              onChange={(e) => handleAirspeedChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Vertical Speed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vertical Speed: {verticalSpeed >= 0 ? '+' : ''}{Math.round(verticalSpeed)} fpm
            </label>
            <input
              type="range"
              min="-6000"
              max="6000"
              step="100"
              value={verticalSpeed}
              onChange={(e) => handleVerticalSpeedChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {pitch.toFixed(1)}°
            </label>
            <input
              type="range"
              min="-90"
              max="90"
              step="1"
              value={pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Roll */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roll: {roll.toFixed(1)}°
            </label>
            <input
              type="range"
              min="-60"
              max="60"
              step="1"
              value={roll}
              onChange={(e) => handleRollChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Engine RPM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engine RPM: {rpm}
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={rpm}
              onChange={(e) => handleRpmChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Oil Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oil Temp: {oilTemp}°C
            </label>
            <input
              type="range"
              min="50"
              max="150"
              step="1"
              value={oilTemp}
              onChange={(e) => handleOilTempChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Oil Pressure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oil Pressure: {oilPressure} psi
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={oilPressure}
              onChange={(e) => handleOilPressureChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Fuel Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel: {fuelQuantity.toFixed(1)} gal
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={fuelQuantity}
              onChange={(e) => handleFuelChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={resetToLevelFlight}
            className="px-4 py-2 bg-magnolia-600 text-white rounded-lg hover:bg-magnolia-700 transition-colors"
          >
            Reset to Level Flight
          </button>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About G3X Touch</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            The G3X Touch is a touchscreen avionics system designed for experimental and light sport aircraft. 
            This simulator uses the actual Working Title G3X Touch instrument files from Microsoft Flight Simulator 
            with a mock MSFS SDK that provides simulated flight data.
          </p>
          <p>
            <strong>Features include:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Primary Flight Display (PFD)</li>
            <li>Multi-Function Display (MFD)</li>
            <li>Navigation and flight planning</li>
            <li>Weather and traffic display</li>
            <li>Engine monitoring</li>
            <li>Terrain awareness</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
