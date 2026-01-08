import { NextRequest, NextResponse } from 'next/server'
import { fileLibraryService } from '@/services/fileLibraryService'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderPath = formData.get('folderPath') as string | null
    const uploadedBy = formData.get('uploadedBy') as string
    const visibility = (formData.get('visibility') as 'all' | 'instructor') || 'all'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!uploadedBy) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for base64 storage)
    const maxSize = 10 * 1024 * 1024 // 10MB (reduced for localStorage)
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert file to base64 for local storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')

    // Build file path
    let urlPath = ''
    if (folderPath) {
      urlPath = `${folderPath}/${file.name}`
    } else {
      urlPath = file.name
    }

    // Save file metadata with base64 data (stored in localStorage)
    const libraryFile = fileLibraryService.addFile({
      name: file.name,
      path: urlPath,
      folderPath: folderPath || '',
      size: file.size,
      type: file.type,
      uploadedBy,
      data: base64Data, // Store file as base64 in localStorage
      url: `/api/library/file/${file.name}`, // API endpoint to serve the file
      visibility, // Visibility setting: 'all' or 'instructor'
    })

    return NextResponse.json({
      success: true,
      file: libraryFile,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

