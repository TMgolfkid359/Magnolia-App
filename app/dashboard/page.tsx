'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { fspApi, FlightSchedule } from '@/services/fspApi'
import { Calendar, Clock, Plane, CheckCircle, XCircle, Grid3x3, List } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import CalendarView from '@/components/CalendarView'

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [schedules, setSchedules] = useState<{ upcoming: FlightSchedule[]; past: FlightSchedule[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<{ date: Date; schedules: FlightSchedule[] } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!authLoading && user) {
      loadSchedule()
    }
  }, [user, authLoading])

  const loadSchedule = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = user.role === 'instructor'
        ? await fspApi.getInstructorSchedule(user.id)
        : await fspApi.getStudentSchedule(user.id)
      setSchedules(data)
    } catch (error) {
      console.error('Failed to load schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magnolia-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!schedules) {
    return <div className="text-center text-gray-500">No schedule data available</div>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'bg-blue-100 text-blue-800'
      case 'solo':
        return 'bg-green-100 text-green-800'
      case 'checkride':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const allSchedules = schedules ? [...schedules.upcoming, ...schedules.past] : []

  const handleDateClick = (date: Date, daySchedules: FlightSchedule[]) => {
    setSelectedDateSchedules({ date, schedules: daySchedules })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flight Schedule</h1>
          <p className="text-gray-600">View your upcoming and past flight schedules</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-magnolia-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-magnolia-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="h-4 w-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && schedules && (
        <div className="space-y-6">
          <CalendarView schedules={allSchedules} onDateClick={handleDateClick} />
          
          {/* Selected Date Details */}
          {selectedDateSchedules && selectedDateSchedules.schedules.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {format(selectedDateSchedules.date, 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-3">
                {selectedDateSchedules.schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Plane className="h-5 w-5 text-magnolia-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} Flight
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(schedule.type)}`}>
                        {schedule.type}
                      </span>
                      {getStatusIcon(schedule.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Time:</span> {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div>
                        <span className="font-medium">Aircraft:</span> {schedule.aircraftId}
                      </div>
                      {schedule.instructorId && (
                        <div>
                          <span className="font-medium">Instructor:</span> {schedule.instructorId}
                        </div>
                      )}
                    </div>
                    {schedule.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {schedule.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && schedules && (
        <>

      {/* Upcoming Flights */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-magnolia-600" />
          Upcoming Flights
        </h2>
        {schedules.upcoming.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No upcoming flights scheduled
          </div>
        ) : (
          <div className="grid gap-4">
            {schedules.upcoming.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Plane className="h-5 w-5 text-magnolia-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} Flight
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(schedule.type)}`}>
                        {schedule.type}
                      </span>
                      {getStatusIcon(schedule.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Date:</span> {format(parseISO(schedule.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div>
                        <span className="font-medium">Aircraft:</span> {schedule.aircraftId}
                      </div>
                      {schedule.instructorId && (
                        <div>
                          <span className="font-medium">Instructor:</span> {schedule.instructorId}
                        </div>
                      )}
                    </div>
                    {schedule.notes && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {schedule.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Flights */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
          Past Flights
        </h2>
        {schedules.past.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No past flights recorded
          </div>
        ) : (
          <div className="grid gap-4">
            {schedules.past.slice(0, 10).map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Plane className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} Flight
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(schedule.type)}`}>
                        {schedule.type}
                      </span>
                      {getStatusIcon(schedule.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Date:</span> {format(parseISO(schedule.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div>
                        <span className="font-medium">Aircraft:</span> {schedule.aircraftId}
                      </div>
                      {schedule.instructorId && (
                        <div>
                          <span className="font-medium">Instructor:</span> {schedule.instructorId}
                        </div>
                      )}
                    </div>
                    {schedule.notes && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {schedule.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}

