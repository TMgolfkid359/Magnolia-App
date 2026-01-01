import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/services/userService'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const operatorId = process.env.NEXT_PUBLIC_FSP_OPERATOR_ID || ''
    const apiKey = process.env.NEXT_PUBLIC_FSP_API_KEY || ''

    if (!operatorId || !apiKey) {
      return NextResponse.json(
        { error: 'FSP API not configured' },
        { status: 500 }
      )
    }

    // Get user from portal
    const portalUser = userService.getUserByEmail(email)
    if (!portalUser) {
      return NextResponse.json(
        { error: 'User not found in portal' },
        { status: 404 }
      )
    }

    // Get FSP student ID
    let fspStudentId = portalUser.fspStudentId

    if (!fspStudentId) {
      return NextResponse.json(
        { error: 'FSP account not connected. Please connect your account in Settings.', upcoming: [], past: [] },
        { status: 404 }
      )
    }

    // Fetch schedule from FSP
    const scheduleResponse = await fetch(
      `${process.env.NEXT_PUBLIC_FSP_API_URL || 'https://api.flightschedulepro.com'}/operators/${operatorId}/flights?student_id=${fspStudentId}`,
      {
        headers: {
          'x-subscription-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!scheduleResponse.ok) {
      throw new Error(`FSP API error: ${scheduleResponse.status}`)
    }

    const scheduleData = await scheduleResponse.json()
    const flights = scheduleData.flights || scheduleData.data || scheduleData || []

    // Filter and transform flights
    const now = new Date()
    const upcoming: any[] = []
    const past: any[] = []

    flights.forEach((flight: any) => {
      const flightDate = new Date(flight.date || flight.startDate || flight.startTime)
      const isUpcoming = flightDate >= now && 
                        flight.status !== 'completed' && 
                        flight.status !== 'cancelled'

      const transformed = {
        id: flight.id || flight.flightId,
        studentId: fspStudentId,
        instructorId: flight.instructorId || flight.instructor_id,
        aircraftId: flight.aircraftId || flight.tailNumber || flight.tail_number || 'N/A',
        startTime: flight.startTime || flight.start_time || '00:00',
        endTime: flight.endTime || flight.end_time || '00:00',
        date: flight.date || flight.startDate || flight.start_date,
        type: (flight.type || flight.flightType || 'lesson').toLowerCase(),
        status: (flight.status || 'scheduled').toLowerCase(),
        notes: flight.notes || flight.remarks,
      }

      if (isUpcoming) {
        upcoming.push(transformed)
      } else {
        past.push(transformed)
      }
    })

    // Sort upcoming by date
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      success: true,
      upcoming,
      past,
    })
  } catch (error: any) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedule', upcoming: [], past: [] },
      { status: 500 }
    )
  }
}

