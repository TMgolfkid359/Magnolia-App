// Progress Tracking Service
// Tracks which course materials have been viewed and which exams have been completed per user

export interface CourseProgress {
  courseId: string
  userId: string
  viewedMaterials: string[] // Array of material indices that have been viewed
  completedExams: string[] // Array of exam IDs that have been passed
  lastViewedAt?: string
  timeSpentSeconds?: number // Total time spent on course in seconds
  sessionStartTime?: string // When current session started (ISO string)
}

const STORAGE_KEY = 'magnolia_course_progress'

export const progressService = {
  // Get all progress for a user
  getUserProgress(userId: string): CourseProgress[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    try {
      const allProgress: CourseProgress[] = JSON.parse(stored)
      return allProgress.filter(p => p.userId === userId)
    } catch {
      return []
    }
  },

  // Get progress for a specific course and user
  getCourseProgress(courseId: string, userId: string): CourseProgress | null {
    const userProgress = this.getUserProgress(userId)
    return userProgress.find(p => p.courseId === courseId) || null
  },

  // Mark a material as viewed
  markMaterialViewed(courseId: string, userId: string, materialIndex: number): void {
    if (typeof window === 'undefined') return
    
    const allProgress = this.getAllProgress()
    const existing = allProgress.find(p => p.courseId === courseId && p.userId === userId)
    
    if (existing) {
      if (!existing.viewedMaterials.includes(materialIndex.toString())) {
        existing.viewedMaterials.push(materialIndex.toString())
        existing.lastViewedAt = new Date().toISOString()
      }
    } else {
      allProgress.push({
        courseId,
        userId,
        viewedMaterials: [materialIndex.toString()],
        completedExams: [],
        lastViewedAt: new Date().toISOString(),
      })
    }
    
    this.saveProgress(allProgress)
  },

  // Mark an exam as completed (passed)
  markExamCompleted(courseId: string, userId: string, examId: string): void {
    if (typeof window === 'undefined') return
    
    const allProgress = this.getAllProgress()
    const existing = allProgress.find(p => p.courseId === courseId && p.userId === userId)
    
    if (existing) {
      if (!existing.completedExams.includes(examId)) {
        existing.completedExams.push(examId)
      }
    } else {
      allProgress.push({
        courseId,
        userId,
        viewedMaterials: [],
        completedExams: [examId],
        lastViewedAt: new Date().toISOString(),
      })
    }
    
    this.saveProgress(allProgress)
  },

  // Check if all materials are viewed
  areAllMaterialsViewed(courseId: string, userId: string, totalMaterials: number): boolean {
    const progress = this.getCourseProgress(courseId, userId)
    if (!progress) return false
    return progress.viewedMaterials.length >= totalMaterials
  },

  // Check if all required exams are completed
  areAllExamsCompleted(courseId: string, userId: string, requiredExamIds: string[]): boolean {
    if (requiredExamIds.length === 0) return true
    const progress = this.getCourseProgress(courseId, userId)
    if (!progress) return false
    return requiredExamIds.every(examId => progress.completedExams.includes(examId))
  },

  // Get all progress (internal)
  getAllProgress(): CourseProgress[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  },

  // Save progress (internal)
  saveProgress(progress: CourseProgress[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  },

  // Start tracking time for a course
  startTimeTracking(courseId: string, userId: string): void {
    if (typeof window === 'undefined') return
    
    const allProgress = this.getAllProgress()
    const existing = allProgress.find(p => p.courseId === courseId && p.userId === userId)
    
    if (existing) {
      // Only start if not already tracking
      if (!existing.sessionStartTime) {
        existing.sessionStartTime = new Date().toISOString()
        this.saveProgress(allProgress)
      }
    } else {
      // Create new progress entry
      allProgress.push({
        courseId,
        userId,
        viewedMaterials: [],
        completedExams: [],
        timeSpentSeconds: 0,
        sessionStartTime: new Date().toISOString(),
        lastViewedAt: new Date().toISOString(),
      })
      this.saveProgress(allProgress)
    }
  },

  // Stop tracking time and accumulate it
  stopTimeTracking(courseId: string, userId: string): void {
    if (typeof window === 'undefined') return
    
    const allProgress = this.getAllProgress()
    const existing = allProgress.find(p => p.courseId === courseId && p.userId === userId)
    
    if (existing && existing.sessionStartTime) {
      const startTime = new Date(existing.sessionStartTime).getTime()
      const endTime = new Date().getTime()
      const sessionSeconds = Math.floor((endTime - startTime) / 1000)
      
      existing.timeSpentSeconds = (existing.timeSpentSeconds || 0) + sessionSeconds
      existing.sessionStartTime = undefined
      this.saveProgress(allProgress)
    }
  },

  // Get time spent for a course (in seconds)
  getTimeSpent(courseId: string, userId: string): number {
    const progress = this.getCourseProgress(courseId, userId)
    if (!progress) return 0
    
    let totalSeconds = progress.timeSpentSeconds || 0
    
    // Add current session time if tracking
    if (progress.sessionStartTime) {
      const startTime = new Date(progress.sessionStartTime).getTime()
      const currentTime = new Date().getTime()
      const sessionSeconds = Math.floor((currentTime - startTime) / 1000)
      totalSeconds += sessionSeconds
    }
    
    return totalSeconds
  },

  // Get all progress for all users (for admin/instructor view)
  getAllUsersProgress(): CourseProgress[] {
    return this.getAllProgress()
  },

  // Get progress for all students in a course
  getCourseProgressForAllUsers(courseId: string): CourseProgress[] {
    const allProgress = this.getAllProgress()
    return allProgress.filter(p => p.courseId === courseId)
  },
}

