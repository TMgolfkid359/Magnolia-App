'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Circle, FileText, Clock, Play, ArrowRight, X } from 'lucide-react'
import { courseService, Course } from '@/services/courseService'

export default function CoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState<number>(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) return
    
    // Load courses from courseService
    const allCourses = courseService.getAllCourses()
    setCourses(allCourses)
  }, [user, authLoading])

  const handleCompleteCourse = (courseId: string) => {
    setCourses(courses.map(course => 
      course.id === courseId 
        ? { ...course, completed: true, completionDate: new Date().toISOString().split('T')[0] }
        : course
    ))
    if (selectedCourse?.id === courseId) {
      setSelectedCourse({ ...selectedCourse, completed: true, completionDate: new Date().toISOString().split('T')[0] })
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'indoc':
        return 'bg-blue-100 text-blue-800'
      case 'ground':
        return 'bg-green-100 text-green-800'
      case 'preflight':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
        <p className="text-gray-600">Complete required courses before starting your flight training</p>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <BookOpen className="h-6 w-6 text-magnolia-600" />
                  <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(course.type)}`}>
                    {course.type}
                  </span>
                  {course.required && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Required
                    </span>
                  )}
                  {course.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.estimatedTime}</span>
                  </div>
                  {course.completed && course.completionDate && (
                    <div className="text-green-600 font-medium">
                      Completed on {new Date(course.completionDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Course Materials ({course.materials.length}):</h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {course.materials.map((material, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                      >
                        {material.type === 'document' && <FileText className="h-4 w-4" />}
                        {material.type === 'video' && <Play className="h-4 w-4 text-blue-600" />}
                        {material.type === 'quiz' && <span className="text-purple-600">?</span>}
                        <span>{material.title}</span>
                      </div>
                    ))}
                  </div>
                  {course.materials.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedCourse(course)
                        setCurrentMaterialIndex(0)
                      }}
                      className="flex items-center space-x-2 text-magnolia-600 hover:text-magnolia-700 text-sm font-medium"
                    >
                      <span>View Course Materials</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {!course.completed && (
                  <button
                    onClick={() => handleCompleteCourse(course.id)}
                    className="bg-magnolia-800 text-white px-4 py-2 rounded-md hover:bg-magnolia-900 transition-colors"
                  >
                    Mark as Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Material Viewer */}
      {selectedCourse && selectedCourse.materials.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Material {currentMaterialIndex + 1} of {selectedCourse.materials.length}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {(() => {
                const material = selectedCourse.materials[currentMaterialIndex]
                
                if (material.type === 'video') {
                  return (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">{material.title}</h3>
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        {material.url ? (
                          <iframe
                            src={material.url}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <div className="flex items-center justify-center h-full text-white">
                            No video URL provided
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                if (material.type === 'document') {
                  return (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">{material.title}</h3>
                      {material.fileData ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <iframe
                            src={material.fileData}
                            className="w-full"
                            style={{ height: '70vh' }}
                            title={material.title}
                          ></iframe>
                        </div>
                      ) : material.url ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <iframe
                            src={material.url}
                            className="w-full"
                            style={{ height: '70vh' }}
                            title={material.title}
                          ></iframe>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-12 text-center text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No document available</p>
                        </div>
                      )}
                    </div>
                  )
                }

                if (material.type === 'quiz') {
                  return (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">{material.title}</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <p className="text-blue-800 mb-4">This quiz is linked to an exam.</p>
                        <a
                          href="/dashboard/exams"
                          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Go to Exams
                        </a>
                      </div>
                    </div>
                  )
                }

                return null
              })()}
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCurrentMaterialIndex(Math.max(0, currentMaterialIndex - 1))}
                disabled={currentMaterialIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span>Previous</span>
              </button>

              <div className="flex space-x-2">
                {selectedCourse.materials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMaterialIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      idx === currentMaterialIndex
                        ? 'bg-magnolia-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={selectedCourse.materials[idx].title}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentMaterialIndex(Math.min(selectedCourse.materials.length - 1, currentMaterialIndex + 1))}
                disabled={currentMaterialIndex === selectedCourse.materials.length - 1}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Summary</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Required Courses Completed</span>
            <span className="font-semibold">
              {courses.filter(c => c.required && c.completed).length} / {courses.filter(c => c.required).length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-magnolia-800 h-2.5 rounded-full transition-all"
              style={{
                width: `${(courses.filter(c => c.required && c.completed).length / courses.filter(c => c.required).length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

