'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Users, BookOpen, Video, FileText, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { userService, PortalUser } from '@/services/userService'
import { courseService, Course } from '@/services/courseService'
import { videoService, VideoLesson } from '@/services/videoService'
import { examService, Exam, ExamQuestion } from '@/services/examService'

type Tab = 'users' | 'courses' | 'videos' | 'exams'

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

    if (editingCourse) {
      courseService.updateCourse(editingCourse.id, courseData)
    } else {
      courseService.addCourse(courseData as Omit<Course, 'id'>)
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
          <UsersTab users={users} onRoleChange={handleRoleChange} />
        )}
        {activeTab === 'courses' && (
          <CoursesTab
            courses={courses}
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
      </div>
    </div>
  )
}

// Users Tab Component
function UsersTab({ users, onRoleChange }: { users: PortalUser[]; onRoleChange: (id: string, role: 'student' | 'instructor' | 'admin') => void }) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Users ({users.filter(u => u.enrolled).length})</h2>
      <div className="space-y-3">
        {users.filter(u => u.enrolled).map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-magnolia-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
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
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
        {users.filter(u => u.enrolled).length === 0 && (
          <div className="text-center py-8 text-gray-500">No enrolled users</div>
        )}
      </div>
    </div>
  )
}

// Courses Tab Component
function CoursesTab({
  courses,
  onAdd,
  onEdit,
  onSave,
  onDelete,
  isAdding,
  editingCourse,
  onCancel,
}: {
  courses: Course[]
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
}: {
  formData: Partial<Course>
  setFormData: (data: Partial<Course>) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type || 'ground'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category || 'ground'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
                placeholder="45:30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
              <input
                type="text"
                value={formData.instructor || ''}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
              <input
                type="text"
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course (Optional)</label>
                <select
                  value={formData.courseId || ''}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
                  placeholder="Optional"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, { type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600"
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
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600"
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={question.correctAnswer as string}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-magnolia-600"
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
