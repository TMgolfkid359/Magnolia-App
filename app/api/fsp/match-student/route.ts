import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/services/userService'

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

    // Fetch students from FSP API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FSP_API_URL || 'https://api.flightschedulepro.com'}/operators/${operatorId}/students`,
      {
        headers: {
          'x-subscription-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`FSP API error: ${response.status}`)
    }

    const data = await response.json()
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

