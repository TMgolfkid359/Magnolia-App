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
  // Get student schedule by FSP student ID
  async getStudentSchedule(fspStudentId: string): Promise<StudentSchedule> {
    // If no API key is configured, return mock data
    if (!FSP_API_KEY || FSP_API_KEY === '') {
      console.warn('FSP API key not configured, using mock data')
      return getMockSchedule(fspStudentId)
    }

    try {
      // Adjust endpoint based on FSP API documentation
      // Common endpoints: /api/v1/students/{id}/schedule, /api/v1/schedules?student_id={id}
      const response = await apiClient.get(`/api/v1/students/${fspStudentId}/schedule`)
      
      // Transform FSP response to match our interface
      // FSP API response format may vary - adjust based on actual API response
      const schedules: any[] = response.data.schedules || response.data.data || response.data || []
      
      const now = new Date()
      const upcoming: FlightSchedule[] = []
      const past: FlightSchedule[] = []
      
      schedules.forEach((schedule: any) => {
        const scheduleDate = new Date(schedule.date || schedule.scheduled_date || schedule.start_date)
        const transformed: FlightSchedule = {
          id: schedule.id || schedule.schedule_id || schedule.reservation_id || String(Date.now()),
          studentId: schedule.student_id || schedule.studentId || fspStudentId,
          instructorId: schedule.instructor_id || schedule.instructorId,
          aircraftId: schedule.aircraft_id || schedule.aircraftId || schedule.aircraft || schedule.tail_number || 'N/A',
          startTime: schedule.start_time || schedule.startTime || schedule.start || '00:00',
          endTime: schedule.end_time || schedule.endTime || schedule.end || '00:00',
          date: schedule.date || schedule.scheduled_date || schedule.start_date || new Date().toISOString().split('T')[0],
          type: (schedule.type || schedule.flight_type || schedule.reservation_type || 'lesson').toLowerCase(),
          status: (schedule.status || 'scheduled').toLowerCase(),
          notes: schedule.notes || schedule.remarks || schedule.description,
        }
        
        if (scheduleDate >= now && transformed.status !== 'completed' && transformed.status !== 'cancelled') {
          upcoming.push(transformed)
        } else {
          past.push(transformed)
        }
      })
      
      // Sort upcoming by date, past by date descending
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      return { upcoming, past }
    } catch (error: any) {
      console.error('Error fetching student schedule:', error)
      
      // If 404 or no data, return empty arrays instead of mock data in production
      if (error.response?.status === 404) {
        console.warn(`No schedule found for student ${fspStudentId}`)
        return { upcoming: [], past: [] }
      }
      
      // If unauthorized, return empty (don't expose API errors to users)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('FSP API authentication failed. Check your API key.')
        return { upcoming: [], past: [] }
      }
      
      // In development, return mock data if API fails
      // In production, you might want to return empty arrays
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock data due to API error')
        return getMockSchedule(fspStudentId)
      }
      
      return { upcoming: [], past: [] }
    }
  },

  // Get instructor schedule
  async getInstructorSchedule(fspInstructorId: string): Promise<StudentSchedule> {
    // If no API key is configured, return mock data
    if (!FSP_API_KEY || FSP_API_KEY === '') {
      console.warn('FSP API key not configured, using mock data')
      return getMockSchedule(fspInstructorId)
    }

    try {
      const response = await apiClient.get(`/api/v1/instructors/${fspInstructorId}/schedule`)
      
      // Similar transformation as above
      const schedules: any[] = response.data.schedules || response.data.data || response.data || []
      const now = new Date()
      const upcoming: FlightSchedule[] = []
      const past: FlightSchedule[] = []
      
      schedules.forEach((schedule: any) => {
        const scheduleDate = new Date(schedule.date || schedule.scheduled_date || schedule.start_date)
        const transformed: FlightSchedule = {
          id: schedule.id || schedule.schedule_id || schedule.reservation_id || String(Date.now()),
          studentId: schedule.student_id || schedule.studentId,
          instructorId: schedule.instructor_id || schedule.instructorId || fspInstructorId,
          aircraftId: schedule.aircraft_id || schedule.aircraftId || schedule.aircraft || schedule.tail_number || 'N/A',
          startTime: schedule.start_time || schedule.startTime || schedule.start || '00:00',
          endTime: schedule.end_time || schedule.endTime || schedule.end || '00:00',
          date: schedule.date || schedule.scheduled_date || schedule.start_date || new Date().toISOString().split('T')[0],
          type: (schedule.type || schedule.flight_type || schedule.reservation_type || 'lesson').toLowerCase(),
          status: (schedule.status || 'scheduled').toLowerCase(),
          notes: schedule.notes || schedule.remarks || schedule.description,
        }
        
        if (scheduleDate >= now && transformed.status !== 'completed' && transformed.status !== 'cancelled') {
          upcoming.push(transformed)
        } else {
          past.push(transformed)
        }
      })
      
      // Sort upcoming by date, past by date descending
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      return { upcoming, past }
    } catch (error: any) {
      console.error('Error fetching instructor schedule:', error)
      
      if (error.response?.status === 404) {
        console.warn(`No schedule found for instructor ${fspInstructorId}`)
        return { upcoming: [], past: [] }
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('FSP API authentication failed. Check your API key.')
        return { upcoming: [], past: [] }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock data due to API error')
        return getMockSchedule(fspInstructorId)
      }
      
      return { upcoming: [], past: [] }
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

