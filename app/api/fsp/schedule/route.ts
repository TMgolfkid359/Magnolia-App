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

    // Fetch schedule from FSP - try multiple endpoint formats
    const apiUrl = process.env.NEXT_PUBLIC_FSP_API_URL || 'https://api.flightschedulepro.com'
    const endpoints = [
      `${apiUrl}/operators/${operatorId}/flights?student_id=${fspStudentId}`,  // Try without /api/v1 first
      `${apiUrl}/api/v1/operators/${operatorId}/flights?student_id=${fspStudentId}`,  // Try with /api/v1
      `${apiUrl}/api/operators/${operatorId}/flights?student_id=${fspStudentId}`,  // Try with /api
      `${apiUrl}/operators/${operatorId}/students/${fspStudentId}/flights`,  // Try alternative structure
    ]
    
    let scheduleResponse: Response | null = null
    let lastError: string = ''
    let scheduleData: any = null

    for (const endpoint of endpoints) {
      try {
        console.log('FSP Schedule API Request:', {
          url: endpoint,
          operatorId,
          fspStudentId,
          hasApiKey: !!apiKey,
        })

        scheduleResponse = await fetch(endpoint, {
          headers: {
            'x-subscription-key': apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (scheduleResponse.ok) {
          scheduleData = await scheduleResponse.json()
          console.log('FSP Schedule API Success:', { url: endpoint, dataKeys: Object.keys(scheduleData) })
          break
        } else {
          const errorText = await scheduleResponse.text()
          lastError = `Status ${scheduleResponse.status}: ${errorText}`
          console.log(`FSP Schedule API Error for ${endpoint}:`, {
            status: scheduleResponse.status,
            statusText: scheduleResponse.statusText,
            error: errorText,
          })
          
          // If it's not a 404, don't try other endpoints
          if (scheduleResponse.status !== 404) {
            throw new Error(`FSP API error: ${scheduleResponse.status} - ${errorText}`)
          }
        }
      } catch (err: any) {
        lastError = err.message
        console.error(`Error fetching ${endpoint}:`, err)
        // Continue to next endpoint if this was a 404 or network error
        if (scheduleResponse && scheduleResponse.status === 404) {
          continue
        }
        // If it's a network error (no response), try next endpoint
        if (!scheduleResponse) {
          continue
        }
        // For other errors, throw immediately
        throw err
      }
    }

    if (!scheduleResponse || !scheduleResponse.ok || !scheduleData) {
      const errorMessage = lastError || 'All endpoints returned 404. The API endpoint structure may be incorrect.'
      console.error('FSP Schedule API: All endpoints failed', { 
        lastError, 
        endpoints,
        operatorId,
        fspStudentId,
        apiUrl,
        hasApiKey: !!apiKey 
      })
      
      return NextResponse.json(
        { 
          error: `Unable to fetch schedule from Flight Schedule Pro. All endpoint attempts failed (404 errors). This may indicate:
- The API endpoint structure is incorrect
- The Operator ID (${operatorId}) is invalid  
- The student ID (${fspStudentId}) is invalid
- The API requires a different authentication method
Please verify your API credentials and endpoint structure in the FSP API documentation.`,
          upcoming: [],
          past: [],
          debug: process.env.NODE_ENV === 'development' ? { endpoints, lastError } : undefined
        },
        { status: 500 }
      )
    }
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

