import axios from 'axios'

// Flight Schedule Pro API Service
// Documentation: https://developer.flightschedulepro.com

const FSP_API_BASE_URL = process.env.NEXT_PUBLIC_FSP_API_URL || 'https://api.flightschedulepro.com'
const FSP_API_KEY = process.env.NEXT_PUBLIC_FSP_API_KEY || ''

const apiClient = axios.create({
  baseURL: FSP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${FSP_API_KEY}`,
  },
})

export interface FlightSchedule {
  id: string
  studentId: string
  instructorId?: string
  aircraftId: string
  startTime: string
  endTime: string
  date: string
  type: 'lesson' | 'solo' | 'checkride' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
}

export interface StudentSchedule {
  upcoming: FlightSchedule[]
  past: FlightSchedule[]
}

export const fspApi = {
  // Get student schedule
  async getStudentSchedule(studentId: string): Promise<StudentSchedule> {
    try {
      // TODO: Replace with actual FSP API endpoint
      // Example endpoint: GET /api/v1/students/{studentId}/schedule
      const response = await apiClient.get(`/api/v1/students/${studentId}/schedule`)
      return response.data
    } catch (error) {
      console.error('Error fetching student schedule:', error)
      // Return mock data for development
      return getMockSchedule(studentId)
    }
  },

  // Get instructor schedule
  async getInstructorSchedule(instructorId: string): Promise<StudentSchedule> {
    try {
      // TODO: Replace with actual FSP API endpoint
      const response = await apiClient.get(`/api/v1/instructors/${instructorId}/schedule`)
      return response.data
    } catch (error) {
      console.error('Error fetching instructor schedule:', error)
      return getMockSchedule(instructorId)
    }
  },

  // Create or update schedule
  async createSchedule(schedule: Partial<FlightSchedule>): Promise<FlightSchedule> {
    try {
      const response = await apiClient.post('/api/v1/schedules', schedule)
      return response.data
    } catch (error) {
      console.error('Error creating schedule:', error)
      throw error
    }
  },
}

// Mock data for development/testing
function getMockSchedule(userId: string): StudentSchedule {
  const now = new Date()
  const upcoming: FlightSchedule[] = []
  const past: FlightSchedule[] = []

  // Generate mock upcoming schedules
  for (let i = 1; i <= 5; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    upcoming.push({
      id: `upcoming-${i}`,
      studentId: userId,
      instructorId: 'instructor-1',
      aircraftId: `aircraft-${i % 3 + 1}`,
      startTime: `${9 + i}:00`,
      endTime: `${10 + i}:00`,
      date: date.toISOString().split('T')[0],
      type: i % 2 === 0 ? 'lesson' : 'solo',
      status: 'scheduled',
      notes: `Flight lesson ${i}`,
    })
  }

  // Generate mock past schedules
  for (let i = 1; i <= 10; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    past.push({
      id: `past-${i}`,
      studentId: userId,
      instructorId: 'instructor-1',
      aircraftId: `aircraft-${i % 3 + 1}`,
      startTime: `${9 + (i % 5)}:00`,
      endTime: `${10 + (i % 5)}:00`,
      date: date.toISOString().split('T')[0],
      type: i % 3 === 0 ? 'lesson' : i % 3 === 1 ? 'solo' : 'checkride',
      status: 'completed',
      notes: `Completed flight lesson ${i}`,
    })
  }

  return { upcoming, past }
}

