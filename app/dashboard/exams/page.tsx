'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { examService, Exam, ExamAttempt } from '@/services/examService'
import Link from 'next/link'

export default function ExamsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const handleSubmitExam = () => {
    if (!selectedExam || !user) return

    const { score, passed } = examService.calculateScore(selectedExam, answers)
    const completedAttempt: ExamAttempt = {
      ...(attempt || {
        id: `attempt-${Date.now()}`,
        examId: selectedExam.id,
        userId: user.id,
        answers: {},
        startedAt: new Date().toISOString(),
      }),
      answers,
      score,
      passed,
      completedAt: new Date().toISOString(),
    }

    examService.saveAttempt(completedAttempt)
    setAttempt(completedAttempt)
    setTimeRemaining(null)
  }

  // Use ref to avoid dependency issues in timer useEffect
  const submitExamRef = useRef(handleSubmitExam)
  useEffect(() => {
    submitExamRef.current = handleSubmitExam
  }, [selectedExam, answers, attempt, user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) return
    const allExams = examService.getAllExams()
    setExams(allExams)
  }, [user, authLoading])

  useEffect(() => {
    if (selectedExam && selectedExam.timeLimit && !attempt?.completedAt) {
      setTimeRemaining(selectedExam.timeLimit * 60) // Convert to seconds
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            // Auto-submit when time runs out
            submitExamRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    } else if (!selectedExam || attempt?.completedAt) {
      setTimeRemaining(null)
    }
  }, [selectedExam?.id, attempt?.completedAt])

  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam)
    setAnswers({})
    setAttempt({
      id: `attempt-${Date.now()}`,
      examId: exam.id,
      userId: user?.id || '',
      answers: {},
      startedAt: new Date().toISOString(),
    })
  }

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  // Show exam results
  if (attempt && attempt.completedAt) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            {attempt.passed ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {attempt.passed ? 'Exam Passed!' : 'Exam Failed'}
            </h2>
            <p className="text-3xl font-bold text-magnolia-600 mb-4">
              Score: {attempt.score}%
            </p>
            <p className="text-gray-600 mb-6">
              Passing Score: {selectedExam?.passingScore}%
            </p>
            <Link
              href="/dashboard/exams"
              className="inline-flex items-center space-x-2 bg-magnolia-800 text-white px-6 py-2 rounded-md hover:bg-magnolia-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Exams</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show exam taking interface
  if (selectedExam) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedExam.title}</h1>
              <p className="text-gray-600 mt-1">{selectedExam.description}</p>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 text-lg font-semibold text-magnolia-600">
                <Clock className="h-5 w-5" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedExam.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Question {index + 1} ({question.points} points)
                  </h3>
                </div>
                <p className="text-gray-700 mb-4">{question.question}</p>

                {question.type === 'multiple-choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-3 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-4 w-4 text-magnolia-600"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="space-y-2">
                    {['True', 'False'].map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-3 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.toLowerCase()}
                          checked={answers[question.id] === option.toLowerCase()}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-4 w-4 text-magnolia-600"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'short-answer' && (
                  <input
                    type="text"
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-magnolia-600"
                    placeholder="Your answer..."
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setSelectedExam(null)
                setAttempt(null)
                setAnswers({})
                setTimeRemaining(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitExam}
              className="px-6 py-2 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show exam list
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exams</h1>
        <p className="text-gray-600">Take exams to test your knowledge</p>
      </div>

      <div className="grid gap-6">
        {exams.map((exam) => {
          const userAttempts = examService.getUserAttempts(user?.id || '', exam.id)
          const lastAttempt = userAttempts[userAttempts.length - 1]

          return (
            <div
              key={exam.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileText className="h-6 w-6 text-magnolia-600" />
                    <h2 className="text-xl font-semibold text-gray-900">{exam.title}</h2>
                  </div>
                  <p className="text-gray-600 mb-4">{exam.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{exam.questions.length} questions</span>
                    <span>Passing score: {exam.passingScore}%</span>
                    {exam.timeLimit && <span>Time limit: {exam.timeLimit} minutes</span>}
                    {lastAttempt && (
                      <span className={`font-medium ${lastAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                        Last attempt: {lastAttempt.score}% {lastAttempt.passed ? '(Passed)' : '(Failed)'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleStartExam(exam)}
                  className="ml-4 px-4 py-2 bg-magnolia-800 text-white rounded-md hover:bg-magnolia-900 transition-colors"
                >
                  {lastAttempt ? 'Retake Exam' : 'Start Exam'}
                </button>
              </div>
            </div>
          )
        })}
        {exams.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No exams available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

