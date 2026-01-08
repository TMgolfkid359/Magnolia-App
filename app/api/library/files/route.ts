import { NextRequest, NextResponse } from 'next/server'
import { fileLibraryService } from '@/services/fileLibraryService'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderPath = searchParams.get('folderPath')

    const files = fileLibraryService.getFilesInFolder(folderPath || null)
    const folders = fileLibraryService.getSubfolders(folderPath || null)
    const breadcrumbs = fileLibraryService.getBreadcrumbs(folderPath || null)

    return NextResponse.json({
      success: true,
      files,
      folders,
      breadcrumbs,
    })
  } catch (error: any) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

