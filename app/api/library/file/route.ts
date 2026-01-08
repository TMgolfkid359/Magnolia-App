import { NextRequest, NextResponse } from 'next/server'
import { fileLibraryService } from '@/services/fileLibraryService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')
    const fileName = searchParams.get('name')
    const filePath = searchParams.get('path')

    if (!fileId && !fileName && !filePath) {
      return NextResponse.json(
        { error: 'File identifier is required' },
        { status: 400 }
      )
    }

    // Get file from service
    const files = fileLibraryService.getAllFiles()
    let file = null

    if (fileId) {
      file = files.find(f => f.id === fileId)
    } else if (fileName) {
      file = files.find(f => f.name === fileName)
    } else if (filePath) {
      file = files.find(f => f.path === filePath)
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // If file has base64 data, convert it to a blob response
    if (file.data) {
      const buffer = Buffer.from(file.data, 'base64')
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${file.name}"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    }

    // Fallback to URL if available
    if (file.url) {
      return NextResponse.redirect(file.url)
    }

    return NextResponse.json(
      { error: 'File data not available' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to serve file' },
      { status: 500 }
    )
  }
}

