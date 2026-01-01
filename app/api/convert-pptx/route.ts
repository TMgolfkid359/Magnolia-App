import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const { fileData } = await request.json()

    if (!fileData) {
      return NextResponse.json(
        { error: 'No file data provided' },
        { status: 400 }
      )
    }

    // Remove data URL prefix if present (e.g., "data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,")
    const base64Data = fileData.includes(',') 
      ? fileData.split(',')[1] 
      : fileData

    // Decode base64 to binary
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Parse PPTX (which is a ZIP file)
    const zip = await JSZip.loadAsync(bytes)
    
    // Get slide files (ppt/slides/slide1.xml, slide2.xml, etc.)
    const slideFiles: string[] = []
    zip.forEach((relativePath, file) => {
      if (relativePath.startsWith('ppt/slides/slide') && relativePath.endsWith('.xml')) {
        slideFiles.push(relativePath)
      }
    })

    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0')
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0')
      return numA - numB
    })

    // Extract slide content
    const slides: Array<{ number: number; content: string; images: string[] }> = []

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i]
      const slideXml = await zip.file(slideFile)?.async('string')
      
      if (slideXml) {
        // Extract text content from XML (simplified parsing)
        const textMatches = slideXml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || []
        const texts = textMatches.map(match => {
          const textMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/)
          return textMatch ? textMatch[1] : ''
        }).filter(Boolean)

        // Extract image references using relationship IDs
        const imageRefs: string[] = []
        const embedMatches = slideXml.match(/r:embed="([^"]+)"/g) || []
        embedMatches.forEach(match => {
          const refMatch = match.match(/r:embed="([^"]+)"/)
          if (refMatch) {
            imageRefs.push(refMatch[1])
          }
        })

        // Get relationship file for this slide to resolve image IDs
        const slideNum = slideFile.match(/slide(\d+)\.xml/)?.[1] || ''
        const relFile = `ppt/slides/_rels/slide${slideNum}.xml.rels`
        const relXml = await zip.file(relFile)?.async('string')
        
        const images: string[] = []
        if (relXml) {
          // Map relationship IDs to media files
          for (const refId of imageRefs) {
            const relMatch = relXml.match(new RegExp(`Id="${refId}"[^>]*Target="([^"]+)"`))
            if (relMatch) {
              const mediaPath = relMatch[1].replace('..', 'ppt')
              const imageFile = zip.file(mediaPath)
              if (imageFile) {
                const imageData = await imageFile.async('base64')
                const imageType = mediaPath.endsWith('.png') ? 'png' : 
                                 mediaPath.endsWith('.gif') ? 'gif' : 'jpeg'
                images.push(`data:image/${imageType};base64,${imageData}`)
              }
            }
          }
        } else {
          // Fallback: try direct media path
          for (const ref of imageRefs) {
            const imagePath = `ppt/media/${ref}`
            const imageFile = zip.file(imagePath)
            if (imageFile) {
              const imageData = await imageFile.async('base64')
              const imageType = imagePath.endsWith('.png') ? 'png' : 
                               imagePath.endsWith('.gif') ? 'gif' : 'jpeg'
              images.push(`data:image/${imageType};base64,${imageData}`)
            }
          }
        }

        slides.push({
          number: i + 1,
          content: texts.join('\n'),
          images,
        })
      }
    }

    return NextResponse.json({
      success: true,
      slides,
      totalSlides: slides.length,
    })
  } catch (error) {
    console.error('Error converting PPTX:', error)
    return NextResponse.json(
      { error: 'Failed to convert PPTX file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

