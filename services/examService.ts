// Exam Management Service
// Stores exams in localStorage (can be replaced with API calls)

export interface ExamQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[] // For multiple choice
  correctAnswer: string | string[] // Can be array for multiple correct answers
  points: number
}

export interface Exam {
  id: string
  title: string
  description: string
  courseId?: string // Optional: link to a course
  questions: ExamQuestion[]
  passingScore: number // Percentage (e.g., 70)
  timeLimit?: number // Minutes
  attemptsAllowed?: number
  createdAt: string
  updatedAt: string
}

export interface ExamAttempt {
  id: string
  examId: string
  userId: string
  answers: Record<string, string | string[]> // questionId -> answer
  score?: number
  passed?: boolean
  completedAt?: string
  startedAt: string
}

const STORAGE_KEY = 'magnolia_exams'
const ATTEMPTS_STORAGE_KEY = 'magnolia_exam_attempts'

export const examService = {
  // Get all exams
  getAllExams(): Exam[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  },

  // Get exam by ID
  getExamById(id: string): Exam | undefined {
    const exams = this.getAllExams()
    return exams.find(e => e.id === id)
  },

  // Get exams for a course
  getExamsByCourse(courseId: string): Exam[] {
    return this.getAllExams().filter(e => e.courseId === courseId)
  },

  // Save exams
  saveExams(exams: Exam[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams))
  },

  // Add new exam
  addExam(exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>): Exam {
    const exams = this.getAllExams()
    const now = new Date().toISOString()
    const newExam: Exam = {
      ...exam,
      id: `exam-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    exams.push(newExam)
    this.saveExams(exams)
    return newExam
  },

  // Update exam
  updateExam(id: string, updates: Partial<Exam>): Exam | null {
    const exams = this.getAllExams()
    const index = exams.findIndex(e => e.id === id)
    if (index === -1) return null
    
    exams[index] = {
      ...exams[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveExams(exams)
    return exams[index]
  },

  // Delete exam
  deleteExam(id: string): boolean {
    const exams = this.getAllExams()
    const filtered = exams.filter(e => e.id !== id)
    if (filtered.length === exams.length) return false
    
    this.saveExams(filtered)
    return true
  },

  // Save exam attempt
  saveAttempt(attempt: ExamAttempt): void {
    if (typeof window === 'undefined') return
    
    const stored = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
    const attempts: ExamAttempt[] = stored ? JSON.parse(stored) : []
    attempts.push(attempt)
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts))
  },

  // Get user's exam attempts
  getUserAttempts(userId: string, examId?: string): ExamAttempt[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
    if (!stored) return []
    
    try {
      const attempts: ExamAttempt[] = JSON.parse(stored)
      let filtered = attempts.filter(a => a.userId === userId)
      if (examId) {
        filtered = filtered.filter(a => a.examId === examId)
      }
      return filtered
    } catch {
      return []
    }
  },

  // Calculate exam score
  calculateScore(exam: Exam, answers: Record<string, string | string[]>): { score: number; passed: boolean } {
    let totalPoints = 0
    let earnedPoints = 0

    exam.questions.forEach(question => {
      totalPoints += question.points
      const userAnswer = answers[question.id]
      const correctAnswer = question.correctAnswer

      if (Array.isArray(correctAnswer)) {
        // Multiple correct answers
        if (Array.isArray(userAnswer)) {
          const userSet = new Set(userAnswer.map(a => a.toLowerCase().trim()))
          const correctSet = new Set(correctAnswer.map(a => a.toLowerCase().trim()))
          if (userSet.size === correctSet.size && 
              [...userSet].every(a => correctSet.has(a))) {
            earnedPoints += question.points
          }
        }
      } else {
        // Single correct answer
        if (typeof userAnswer === 'string' && 
            userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
          earnedPoints += question.points
        }
      }
    })

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = score >= exam.passingScore

    return { score, passed }
  },
}

