'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Video, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { videoService, VideoLesson } from '@/services/videoService'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoLesson[]>([])
  const [editingVideo, setEditingVideo] = useState<VideoLesson | null>(null)
  const [isAdding, setIsAdding] = useState(false)
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
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      loadVideos()
    }
  }, [user])

  const loadVideos = () => {
    const allVideos = videoService.getAllVideos()
    setVideos(allVideos)
  }

  const handleAdd = () => {
    setIsAdding(true)
    setEditingVideo(null)
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

  const handleEdit = (video: VideoLesson) => {
    setEditingVideo(video)
    setIsAdding(false)
    setFormData(video)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingVideo(null)
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

  const handleSave = () => {
    if (!formData.title || !formData.videoUrl) {
      alert('Please fill in title and video URL')
      return
    }

    if (editingVideo) {
      // Update existing
      videoService.updateVideo(editingVideo.id, formData)
    } else {
      // Add new
      videoService.addVideo(formData as Omit<VideoLesson, 'id'>)
    }

    loadVideos()
    handleCancel()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      videoService.deleteVideo(id)
      loadVideos()
    }
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

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage videos and portal content</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-magnolia-800 text-white px-4 py-2 rounded-md hover:bg-magnolia-900 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Video</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingVideo) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
                placeholder="Video Title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category || 'ground'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
              >
                <option value="ground">Ground</option>
                <option value="flight">Flight</option>
                <option value="safety">Safety</option>
                <option value="systems">Systems</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (e.g., 45:30)
              </label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
                placeholder="45:30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor
              </label>
              <input
                type="text"
                value={formData.instructor || ''}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
                placeholder="Instructor Name"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (YouTube embed URL) *
              </label>
              <input
                type="text"
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use YouTube embed URL format: https://www.youtube.com/embed/VIDEO_ID
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600 focus:border-transparent"
                placeholder="Video description..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Video</span>
            </button>
          </div>
        </div>
      )}

      {/* Videos List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Videos ({videos.length})</h2>
        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Video className="h-5 w-5 text-magnolia-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(video.category)}`}>
                    {video.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Duration: {video.duration}</span>
                  <span>Date: {new Date(video.date).toLocaleDateString()}</span>
                  {video.instructor && <span>Instructor: {video.instructor}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(video)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No videos yet. Click "Add Video" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

