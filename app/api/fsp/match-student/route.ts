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

    // Fetch students from FSP API - try multiple endpoint formats
    const apiUrl = process.env.NEXT_PUBLIC_FSP_API_URL || 'https://api.flightschedulepro.com'
    const endpoints = [
      `${apiUrl}/operators/${operatorId}/students`,  // Try without /api/v1 first
      `${apiUrl}/api/v1/operators/${operatorId}/students`,  // Try with /api/v1
      `${apiUrl}/api/operators/${operatorId}/students`,  // Try with /api
    ]
    
    let response: Response | null = null
    let lastError: string = ''
    let data: any = null

    for (const endpoint of endpoints) {
      try {
        console.log('FSP API Request:', {
          url: endpoint,
          operatorId,
          hasApiKey: !!apiKey,
        })

        response = await fetch(endpoint, {
          headers: {
            'x-subscription-key': apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          data = await response.json()
          console.log('FSP API Success:', { url: endpoint, dataKeys: Object.keys(data) })
          break
        } else {
          const errorText = await response.text()
          lastError = `Status ${response.status}: ${errorText}`
          console.log(`FSP API Error for ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          })
          
          // If it's not a 404, don't try other endpoints
          if (response.status !== 404) {
            throw new Error(`FSP API error: ${response.status} - ${errorText}`)
          }
        }
      } catch (err: any) {
        lastError = err.message
        console.error(`Error fetching ${endpoint}:`, err)
        // Continue to next endpoint if this was a 404 or network error
        if (response && response.status === 404) {
          continue
        }
        // If it's a network error (no response), try next endpoint
        if (!response) {
          continue
        }
        // For other errors, throw immediately
        throw err
      }
    }

    if (!response || !response.ok || !data) {
      const errorMessage = lastError || 'All endpoints returned 404. The API endpoint structure may be incorrect.'
      console.error('FSP API: All endpoints failed', { 
        lastError, 
        endpoints,
        operatorId,
        apiUrl,
        hasApiKey: !!apiKey 
      })
      
      // Return a more helpful error message
      return NextResponse.json(
        { 
          error: `Unable to connect to Flight Schedule Pro API. All endpoint attempts failed (404 errors). This may indicate:
- The API endpoint structure is incorrect
- The Operator ID (${operatorId}) is invalid
- The API requires a different authentication method
Please verify your API credentials and endpoint structure in the FSP API documentation.`,
          fspStudentId: null,
          debug: process.env.NODE_ENV === 'development' ? { endpoints, lastError } : undefined
        },
        { status: 500 }
      )
    }

    const students = data.students || data.data || data || []

    // Find matching student by email
    const student = students.find((s: any) => 
      s.email?.toLowerCase() === email.toLowerCase() ||
      s.emailAddress?.toLowerCase() === email.toLowerCase()
    )

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found in Flight Schedule Pro. Please verify your email address.', fspStudentId: null },
        { status: 404 }
      )
    }

    const fspStudentId = student.id || student.studentId

    return NextResponse.json({
      success: true,
      fspStudentId,
      student: {
        id: fspStudentId,
        name: student.name || student.fullName,
        email: student.email || student.emailAddress,
      },
    })
  } catch (error: any) {
    console.error('Error matching student:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect to Flight Schedule Pro. Please try again later.' },
      { status: 500 }
    )
  }
}

