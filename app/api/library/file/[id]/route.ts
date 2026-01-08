import { NextRequest, NextResponse } from 'next/server'
import { fileLibraryService } from '@/services/fileLibraryService'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id

    // Get file metadata
    const files = fileLibraryService.getAllFiles()
    const file = files.find(f => f.id === fileId)

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete file metadata (file data is stored in localStorage, so deleting metadata removes it)
    const success = fileLibraryService.deleteFile(fileId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}

