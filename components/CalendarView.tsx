'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plane } from 'lucide-react'
import { FlightSchedule } from '@/services/fspApi'

interface CalendarViewProps {
  schedules: FlightSchedule[]
  onDateClick?: (date: Date, schedules: FlightSchedule[]) => void
}

export default function CalendarView({ schedules, onDateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of week for the month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = monthStart.getDay()
  
  // Create array of empty cells for days before month starts
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date): FlightSchedule[] => {
    return schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.date)
      return isSameDay(scheduleDate, date)
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const daySchedules = getSchedulesForDate(date)
    if (onDateClick) {
      onDateClick(date, daySchedules)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'scheduled':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'border-blue-400'
      case 'solo':
        return 'border-green-400'
      case 'checkride':
        return 'border-purple-400'
      default:
        return 'border-gray-400'
    }
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week Day Headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-700 py-2"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {daysInMonth.map((day) => {
          const daySchedules = getSchedulesForDate(day)
          const isToday = isSameDay(day, new Date())
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square border-2 rounded-lg p-1 cursor-pointer transition-all
                ${isToday ? 'border-magnolia-600 bg-magnolia-50' : 'border-gray-200'}
                ${isSelected ? 'ring-2 ring-magnolia-600 ring-offset-2' : ''}
                ${daySchedules.length > 0 ? 'hover:border-magnolia-400 hover:bg-magnolia-50' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-magnolia-800' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </div>
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {daySchedules.slice(0, 3).map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`
                        text-xs px-1 py-0.5 rounded truncate
                        ${getStatusColor(schedule.status)} text-white
                        border-l-2 ${getTypeColor(schedule.type)}
                      `}
                      title={`${schedule.type} - ${schedule.startTime}`}
                    >
                      <Plane className="h-2 w-2 inline mr-0.5" />
                      {schedule.startTime}
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  )
}

