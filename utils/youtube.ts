/**
 * Converts various YouTube URL formats to embed format
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID (already correct)
 */
export function normalizeYouTubeUrl(url: string): string {
  if (!url) return url

  // Already in embed format
  if (url.includes('/embed/')) {
    return url
  }

  // Extract video ID from various formats
  let videoId = ''

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) {
    videoId = watchMatch[1]
  }

  // Format: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
  if (shortMatch) {
    videoId = shortMatch[1]
  }

  // Format: https://www.youtube.com/embed/VIDEO_ID (already correct)
  const embedMatch = url.match(/\/embed\/([^?&]+)/)
  if (embedMatch) {
    return url
  }

  // If we found a video ID, convert to embed format
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`
  }

  // If no match, return original URL (might already be correct or invalid)
  return url
}

