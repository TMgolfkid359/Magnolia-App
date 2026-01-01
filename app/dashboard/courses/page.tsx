'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Circle, FileText, Clock, Play, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { courseService, Course } from '@/services/courseService'
import { progressService } from '@/services/progressService'
import { examService } from '@/services/examService'

interface PPTXSlide {
  number: number
  content: string
  images: string[]
}

export default function CoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState<number>(0)
  const [previousCourseId, setPreviousCourseId] = useState<string | null>(null)
  const [pptxSlides, setPptxSlides] = useState<PPTXSlide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0)
  const [loadingPptx, setLoadingPptx] = useState<boolean>(false)

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
    
    // Check and update course completion status
    if (user) {
      const updatedCourses = allCourses.map(course => {
        if (course.completed) return course
        
        // Get all exams linked to this course
        const courseExams = examService.getExamsByCourse(course.id)
        const requiredExamIds = courseExams.map(e => e.id)
        
        // Check if all materials are viewed
        const allMaterialsViewed = progressService.areAllMaterialsViewed(
          course.id,
          user.id,
          course.materials.length
        )
        
        // Check if all exams are passed
        const allExamsPassed = progressService.areAllExamsCompleted(
          course.id,
          user.id,
          requiredExamIds
        )
        
        // Also check exam attempts to see if they passed
        let examsActuallyPassed = true
        if (requiredExamIds.length > 0) {
          const userAttempts = examService.getUserAttempts(user.id)
          examsActuallyPassed = requiredExamIds.every(examId => {
            const attempts = userAttempts.filter(a => a.examId === examId && a.completedAt)
            return attempts.some(a => a.passed === true)
          })
        }
        
        // Auto-complete if all materials viewed and all exams passed
        if (allMaterialsViewed && allExamsPassed && examsActuallyPassed) {
          const updated = {
            ...course,
            completed: true,
            completionDate: new Date().toISOString().split('T')[0]
          }
          courseService.updateCourse(course.id, updated)
          return updated
        }
        
        return course
      })
      
      setCourses(updatedCourses)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  // Track time when viewing a course
  useEffect(() => {
    if (!user) return

    // Stop tracking previous course if switching
    if (previousCourseId && previousCourseId !== selectedCourse?.id) {
      progressService.stopTimeTracking(previousCourseId, user.id)
    }

    // Start tracking new course
    if (selectedCourse) {
      progressService.startTimeTracking(selectedCourse.id, user.id)
      setPreviousCourseId(selectedCourse.id)
    }

    // Cleanup: stop tracking when component unmounts or user leaves
    return () => {
      if (selectedCourse && user) {
        progressService.stopTimeTracking(selectedCourse.id, user.id)
      }
    }
  }, [selectedCourse?.id, user, previousCourseId])

  // Update time every 30 seconds while viewing
  useEffect(() => {
    if (!user || !selectedCourse) return

    const interval = setInterval(() => {
      // This will accumulate the time when we stop tracking
      // We just need to ensure the session is active
      if (selectedCourse) {
        progressService.startTimeTracking(selectedCourse.id, user.id)
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [selectedCourse?.id, user])

  // Load PPTX slides when PowerPoint material is displayed
  useEffect(() => {
    if (!selectedCourse) {
      setPptxSlides([])
      setCurrentSlideIndex(0)
      return
    }

    const material = selectedCourse.materials[currentMaterialIndex]
    if (!material) {
      setPptxSlides([])
      setCurrentSlideIndex(0)
      return
    }

    const isPowerPoint = material.fileType?.includes('powerpoint') || 
                        material.fileType?.includes('presentation') ||
                        material.fileName?.toLowerCase().endsWith('.ppt') ||
                        material.fileName?.toLowerCase().endsWith('.pptx') ||
                        material.url?.toLowerCase().endsWith('.ppt') ||
                        material.url?.toLowerCase().endsWith('.pptx')

    if (isPowerPoint && material.fileData) {
      loadPptxSlides(material.fileData)
    } else {
      setPptxSlides([])
      setCurrentSlideIndex(0)
    }
  }, [selectedCourse, currentMaterialIndex])

  const loadPptxSlides = async (fileData: string) => {
    setLoadingPptx(true)
    try {
      const response = await fetch('/api/convert-pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileData }),
      })

      if (!response.ok) {
        throw new Error('Failed to convert PPTX')
      }

      const data = await response.json()
      if (data.success && data.slides) {
        setPptxSlides(data.slides)
        setCurrentSlideIndex(0)
      }
    } catch (error) {
      console.error('Error loading PPTX slides:', error)
      setPptxSlides([])
    } finally {
      setLoadingPptx(false)
    }
  }

  useEffect(() => {
    if (user && selectedCourse) {
      progressService.markMaterialViewed(selectedCourse.id, user.id, currentMaterialIndex)
      // Check completion after marking as viewed
      const allCourses = courseService.getAllCourses()
      if (user) {
        const updatedCourses = allCourses.map(course => {
          if (course.completed) return course
          
          const courseExams = examService.getExamsByCourse(course.id)
          const requiredExamIds = courseExams.map(e => e.id)
          const allMaterialsViewed = progressService.areAllMaterialsViewed(
            course.id,
            user.id,
            course.materials.length
          )
          const allExamsPassed = progressService.areAllExamsCompleted(
            course.id,
            user.id,
            requiredExamIds
          )
          let examsActuallyPassed = true
          if (requiredExamIds.length > 0) {
            const userAttempts = examService.getUserAttempts(user.id)
            examsActuallyPassed = requiredExamIds.every(examId => {
              const attempts = userAttempts.filter(a => a.examId === examId && a.completedAt)
              return attempts.some(a => a.passed === true)
            })
          }
          if (allMaterialsViewed && allExamsPassed && examsActuallyPassed) {
            const updated = {
              ...course,
              completed: true,
              completionDate: new Date().toISOString().split('T')[0]
            }
            courseService.updateCourse(course.id, updated)
            return updated
          }
          return course
        })
        setCourses(updatedCourses)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMaterialIndex, selectedCourse, user])

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

  // Track material view when navigating
  const handleMaterialView = (courseId: string, materialIndex: number) => {
    if (!user) return
    
    // Mark material as viewed
    progressService.markMaterialViewed(courseId, user.id, materialIndex)
    
    // Reload courses to check completion
    const allCourses = courseService.getAllCourses()
    const updatedCourses = allCourses.map(course => {
      if (course.completed) return course
      const courseExams = examService.getExamsByCourse(course.id)
      const requiredExamIds = courseExams.map(e => e.id)
      const allMaterialsViewed = progressService.areAllMaterialsViewed(
        course.id,
        user.id,
        course.materials.length
      )
      const allExamsPassed = progressService.areAllExamsCompleted(
        course.id,
        user.id,
        requiredExamIds
      )
      let examsActuallyPassed = true
      if (requiredExamIds.length > 0) {
        const userAttempts = examService.getUserAttempts(user.id)
        examsActuallyPassed = requiredExamIds.every(examId => {
          const attempts = userAttempts.filter(a => a.examId === examId && a.completedAt)
          return attempts.some(a => a.passed === true)
        })
      }
      if (allMaterialsViewed && allExamsPassed && examsActuallyPassed) {
        const updated = {
          ...course,
          completed: true,
          completionDate: new Date().toISOString().split('T')[0]
        }
        courseService.updateCourse(course.id, updated)
        return updated
      }
      return course
    })
    setCourses(updatedCourses)
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 border border-magnolia-100 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Courses</h1>
        <p className="text-gray-600">Complete your required courses to prepare for flight training. Take your time and learn at your own pace!</p>
      </div>

      <div className="grid gap-6">
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses available yet</h3>
            <p className="text-gray-600">Check back soon for new course materials!</p>
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-magnolia-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-magnolia-50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-magnolia-700" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(course.type)}`}>
                      {course.type}
                    </span>
                    {course.required && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                        Required
                      </span>
                    )}
                    {course.completed ? (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        <Circle className="h-4 w-4" />
                        <span>In Progress</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">{course.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-5">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-magnolia-600" />
                      <span className="font-medium">{course.estimatedTime}</span>
                    </div>
                    {course.completed && course.completionDate && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Completed on {new Date(course.completionDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Course Materials ({course.materials.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {course.materials.map((material, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors border border-gray-100"
                        >
                          {material.type === 'document' && <FileText className="h-4 w-4 text-blue-600" />}
                          {material.type === 'video' && <Play className="h-4 w-4 text-purple-600" />}
                          {material.type === 'quiz' && <span className="text-purple-600 font-bold">?</span>}
                          <span className="font-medium">{material.title}</span>
                        </div>
                      ))}
                    </div>
                    {course.materials.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedCourse(course)
                          setCurrentMaterialIndex(0)
                          // Mark first material as viewed when opening course
                          if (user) {
                            progressService.markMaterialViewed(course.id, user.id, 0)
                          }
                        }}
                        className="bg-magnolia-700 text-white px-6 py-3 rounded-lg hover:bg-magnolia-800 transition-all flex items-center space-x-2 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <span>{course.completed ? 'Review Course' : 'Start Course'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Course Material Viewer */}
      {selectedCourse && selectedCourse.materials.length > 0 && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Material {currentMaterialIndex + 1} of {selectedCourse.materials.length}
              </p>
            </div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-md transition-colors"
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
                      <div className="w-full bg-gray-900 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
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
                  // Check if file is PowerPoint
                  const isPowerPoint = material.fileType?.includes('powerpoint') || 
                                      material.fileType?.includes('presentation') ||
                                      material.fileName?.toLowerCase().endsWith('.ppt') ||
                                      material.fileName?.toLowerCase().endsWith('.pptx') ||
                                      material.url?.toLowerCase().endsWith('.ppt') ||
                                      material.url?.toLowerCase().endsWith('.pptx')
                  
                  // Check if file is PDF
                  const isPDF = material.fileType === 'application/pdf' ||
                               material.fileName?.toLowerCase().endsWith('.pdf') ||
                               material.url?.toLowerCase().endsWith('.pdf')

                  return (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">{material.title}</h3>
                      {material.fileData ? (
                        isPowerPoint ? (
                          // PowerPoint files: display slides
                          <div className="space-y-4">
                            {loadingPptx ? (
                              <div className="border border-gray-200 rounded-lg p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading presentation...</p>
                              </div>
                            ) : pptxSlides.length > 0 ? (
                              <div className="space-y-4">
                                {/* Slide Viewer */}
                                <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-700">
                                        Slide {currentSlideIndex + 1} of {pptxSlides.length}
                                      </h4>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                                        disabled={currentSlideIndex === 0}
                                        className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={() => setCurrentSlideIndex(Math.min(pptxSlides.length - 1, currentSlideIndex + 1))}
                                        disabled={currentSlideIndex === pptxSlides.length - 1}
                                        className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <ChevronRight className="h-5 w-5 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="p-8 min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                                    {pptxSlides[currentSlideIndex] && (
                                      <div className="w-full max-w-4xl space-y-6">
                                        {/* Images */}
                                        {pptxSlides[currentSlideIndex].images.length > 0 && (
                                          <div className="space-y-4">
                                            {pptxSlides[currentSlideIndex].images.map((img, idx) => (
                                              <img
                                                key={idx}
                                                src={img}
                                                alt={`Slide ${currentSlideIndex + 1} image ${idx + 1}`}
                                                className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                                              />
                                            ))}
                                          </div>
                                        )}
                                        {/* Text Content */}
                                        {pptxSlides[currentSlideIndex].content && (
                                          <div className="prose prose-lg max-w-none">
                                            {pptxSlides[currentSlideIndex].content.split('\n').map((line, idx) => (
                                              <p key={idx} className="text-gray-800 text-lg mb-4">
                                                {line}
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                        {!pptxSlides[currentSlideIndex].content && pptxSlides[currentSlideIndex].images.length === 0 && (
                                          <p className="text-gray-500 text-center">Empty slide</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Download Button */}
                                <div className="flex justify-center">
                                  <a
                                    href={material.fileData}
                                    download={material.fileName || 'presentation.pptx'}
                                    className="inline-flex items-center justify-center px-6 py-3 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900 transition-colors"
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Download PowerPoint File
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="border border-gray-200 rounded-lg p-8 text-center">
                                <FileText className="h-16 w-16 mx-auto mb-4 text-magnolia-600" />
                                <p className="text-gray-700 mb-2 font-medium">{material.fileName || 'PowerPoint Presentation'}</p>
                                <p className="text-sm text-gray-500 mb-6">Unable to load presentation. Please download to view.</p>
                                <a
                                  href={material.fileData}
                                  download={material.fileName || 'presentation.pptx'}
                                  className="inline-flex items-center justify-center px-6 py-3 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900 transition-colors"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Download PowerPoint File
                                </a>
                              </div>
                            )}
                          </div>
                        ) : isPDF ? (
                          // PDF files: display in iframe
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <iframe
                              src={material.fileData}
                              className="w-full"
                              style={{ height: 'calc(100vh - 250px)' }}
                              title={material.title}
                            ></iframe>
                          </div>
                        ) : (
                          // Other file types: download option
                          <div className="border border-gray-200 rounded-lg p-8 text-center">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-magnolia-600" />
                            <p className="text-gray-700 mb-2 font-medium">{material.fileName || 'Document'}</p>
                            <a
                              href={material.fileData}
                              download={material.fileName || 'document'}
                              className="inline-flex items-center justify-center px-6 py-3 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900 transition-colors"
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Download File
                            </a>
                          </div>
                        )
                      ) : material.url ? (
                        isPowerPoint ? (
                          // PowerPoint URL: show embedded viewer and download option
                          <div className="space-y-4">
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <iframe
                                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.url)}`}
                                className="w-full"
                                style={{ height: 'calc(100vh - 350px)', minHeight: '600px' }}
                                title={material.title}
                                frameBorder="0"
                              ></iframe>
                            </div>
                            <div className="flex justify-center">
                              <a
                                href={material.url}
                                download
                                className="inline-flex items-center justify-center px-6 py-3 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900 transition-colors"
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Download PowerPoint File
                              </a>
                            </div>
                          </div>
                        ) : isPDF ? (
                          // PDF URL: display in iframe
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <iframe
                              src={material.url}
                              className="w-full"
                              style={{ height: 'calc(100vh - 250px)' }}
                              title={material.title}
                            ></iframe>
                          </div>
                        ) : (
                          // Other URL: try iframe, fallback to link
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <iframe
                              src={material.url}
                              className="w-full"
                              style={{ height: 'calc(100vh - 250px)' }}
                              title={material.title}
                            ></iframe>
                          </div>
                        )
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
                  // Find exams linked to this course
                  const courseExams = examService.getExamsByCourse(selectedCourse.id)
                  const userAttempts = user ? examService.getUserAttempts(user.id) : []
                  
                  // Check which exams are passed
                  const passedExams = courseExams.filter(exam => {
                    const attempts = userAttempts.filter(a => a.examId === exam.id && a.completedAt)
                    return attempts.some(a => a.passed === true)
                  })
                  
                  return (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">{material.title}</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800 mb-4 text-center">This quiz is linked to an exam.</p>
                        {courseExams.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {courseExams.map(exam => {
                              const attempts = userAttempts.filter(a => a.examId === exam.id && a.completedAt)
                              const passed = attempts.some(a => a.passed === true)
                              return (
                                <div key={exam.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <span className="text-gray-700">{exam.title}</span>
                                  {passed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-300" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="text-center">
                          <a
                            href="/dashboard/exams"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Go to Exams
                          </a>
                        </div>
                        {user && passedExams.length === courseExams.length && courseExams.length > 0 && (
                          <div className="mt-4 text-center">
                            <p className="text-green-600 font-medium">All exams completed! ✓</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                return null
              })()}
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white">
              <button
                onClick={() => {
                  const newIndex = Math.max(0, currentMaterialIndex - 1)
                  setCurrentMaterialIndex(newIndex)
                  if (user && selectedCourse) {
                    progressService.markMaterialViewed(selectedCourse.id, user.id, newIndex)
                  }
                }}
                disabled={currentMaterialIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span>Previous</span>
              </button>

              <div className="flex space-x-2">
                {selectedCourse.materials.map((_, idx) => {
                  const progress = user ? progressService.getCourseProgress(selectedCourse.id, user.id) : null
                  const isViewed = progress?.viewedMaterials.includes(idx.toString()) || false
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentMaterialIndex(idx)
                        if (user) {
                          progressService.markMaterialViewed(selectedCourse.id, user.id, idx)
                        }
                      }}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        idx === currentMaterialIndex
                          ? 'bg-magnolia-600'
                          : isViewed
                          ? 'bg-green-400 hover:bg-green-500'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      title={selectedCourse.materials[idx].title}
                    />
                  )
                })}
              </div>

              <button
                onClick={() => {
                  const newIndex = Math.min(selectedCourse.materials.length - 1, currentMaterialIndex + 1)
                  setCurrentMaterialIndex(newIndex)
                  if (user && selectedCourse) {
                    progressService.markMaterialViewed(selectedCourse.id, user.id, newIndex)
                  }
                }}
                disabled={currentMaterialIndex === selectedCourse.materials.length - 1}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
      )}

      {/* Progress Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-magnolia-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-magnolia-100 rounded-lg">
            <CheckCircle className="h-5 w-5 text-magnolia-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Required Courses Completed</span>
            <span className="text-2xl font-bold text-magnolia-700">
              {courses.filter(c => c.required && c.completed).length} / {courses.filter(c => c.required).length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-magnolia-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${courses.filter(c => c.required).length > 0 ? (courses.filter(c => c.required && c.completed).length / courses.filter(c => c.required).length) * 100 : 0}%`,
              }}
            ></div>
          </div>
          {courses.filter(c => c.required).length > 0 && (
            <p className="text-sm text-gray-600">
              {courses.filter(c => c.required && c.completed).length === courses.filter(c => c.required).length
                ? '🎉 Congratulations! You\'ve completed all required courses!'
                : `Keep going! You're making great progress.`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

