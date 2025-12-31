// Course Management Service
// Stores courses in localStorage (can be replaced with API calls)

export interface Course {
  id: string
  title: string
  description: string
  type: 'indoc' | 'ground' | 'preflight' | 'other'
  required: boolean
  estimatedTime: string
  completed: boolean
  completionDate?: string
  materials: {
    type: 'document' | 'video' | 'quiz'
    title: string
    url?: string
    fileData?: string // Base64 encoded file data for PDF/PPT
    fileName?: string // Original file name
    fileType?: string // MIME type (e.g., 'application/pdf', 'application/vnd.ms-powerpoint')
    examId?: string // For quiz type: link to an existing exam
  }[]
}

const STORAGE_KEY = 'magnolia_courses'

// Initialize with default courses if none exist
const defaultCourses: Course[] = [
  {
    id: 'indoc-1',
    title: 'Indoctrination Course',
    description: 'Complete this course before starting your flight training. This covers safety procedures, aircraft familiarization, and basic flight principles.',
    type: 'indoc',
    required: true,
    estimatedTime: '2 hours',
    completed: false,
    materials: [
      { type: 'document', title: 'Safety Manual', url: '/documents/safety-manual.pdf' },
      { type: 'video', title: 'Aircraft Familiarization', url: '/videos/aircraft-familiarization' },
      { type: 'document', title: 'Pre-Flight Checklist', url: '/documents/preflight-checklist.pdf' },
      { type: 'quiz', title: 'Indoc Knowledge Test' },
    ],
  },
  {
    id: 'ground-1',
    title: 'Ground School Basics',
    description: 'Fundamental ground school concepts including aerodynamics, weather, and navigation.',
    type: 'ground',
    required: true,
    estimatedTime: '4 hours',
    completed: false,
    materials: [
      { type: 'video', title: 'Aerodynamics Fundamentals', url: '/videos/aerodynamics' },
      { type: 'document', title: 'Weather Basics Guide', url: '/documents/weather-basics.pdf' },
      { type: 'quiz', title: 'Ground School Quiz' },
    ],
  },
  {
    id: 'preflight-1',
    title: 'Pre-Flight Inspection',
    description: 'Learn how to perform a thorough pre-flight inspection of the aircraft.',
    type: 'preflight',
    required: true,
    estimatedTime: '1 hour',
    completed: false,
    materials: [
      { type: 'video', title: 'Pre-Flight Walkthrough', url: '/videos/preflight-walkthrough' },
      { type: 'document', title: 'Inspection Checklist', url: '/documents/inspection-checklist.pdf' },
    ],
  },
]

export const courseService = {
  // Get all courses
  getAllCourses(): Course[] {
    if (typeof window === 'undefined') return defaultCourses
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      this.saveCourses(defaultCourses)
      return defaultCourses
    }
    
    try {
      return JSON.parse(stored)
    } catch {
      return defaultCourses
    }
  },

  // Get course by ID
  getCourseById(id: string): Course | undefined {
    const courses = this.getAllCourses()
    return courses.find(c => c.id === id)
  },

  // Save courses
  saveCourses(courses: Course[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
  },

  // Add new course
  addCourse(course: Omit<Course, 'id'>): Course {
    const courses = this.getAllCourses()
    const newCourse: Course = {
      ...course,
      id: `course-${Date.now()}`,
    }
    courses.push(newCourse)
    this.saveCourses(courses)
    return newCourse
  },

  // Update course
  updateCourse(id: string, updates: Partial<Course>): Course | null {
    const courses = this.getAllCourses()
    const index = courses.findIndex(c => c.id === id)
    if (index === -1) return null
    
    courses[index] = { ...courses[index], ...updates }
    this.saveCourses(courses)
    return courses[index]
  },

  // Delete course
  deleteCourse(id: string): boolean {
    const courses = this.getAllCourses()
    const filtered = courses.filter(c => c.id !== id)
    if (filtered.length === courses.length) return false
    
    this.saveCourses(filtered)
    return true
  },
}

