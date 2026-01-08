import { NextRequest, NextResponse } from 'next/server'
import { fileLibraryService } from '@/services/fileLibraryService'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { name, parentPath, createdBy } = await request.json()

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'Folder name and creator ID are required' },
        { status: 400 }
      )
    }

    const folder = fileLibraryService.createFolder(name, parentPath || null, createdBy)

    return NextResponse.json({
      success: true,
      folder,
    })
  } catch (error: any) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderPath = searchParams.get('path')

    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      )
    }

    const success = fileLibraryService.deleteFolder(folderPath)

    if (!success) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete folder' },
      { status: 500 }
    )
  }
}

