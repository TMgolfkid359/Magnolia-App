// Video Management Service
// Stores videos in localStorage (can be replaced with API calls)

export interface VideoLesson {
  id: string
  title: string
  description: string
  category: 'ground' | 'flight' | 'safety' | 'systems'
  duration: string
  date: string
  thumbnail?: string
  videoUrl: string
  instructor?: string
}

const STORAGE_KEY = 'magnolia_videos'

// Initialize with default videos if none exist
const defaultVideos: VideoLesson[] = [
  {
    id: '1',
    title: 'Aircraft Systems Overview',
    description: 'Comprehensive overview of aircraft systems including engine, electrical, and avionics.',
    category: 'systems',
    duration: '45:30',
    date: '2024-01-10',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructor: 'John Instructor',
  },
  {
    id: '2',
    title: 'Pre-Flight Inspection Walkthrough',
    description: 'Step-by-step guide to performing a thorough pre-flight inspection.',
    category: 'flight',
    duration: '32:15',
    date: '2024-01-08',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructor: 'Jane Instructor',
  },
  {
    id: '3',
    title: 'Weather Patterns and Safety',
    description: 'Understanding weather patterns and how they affect flight safety.',
    category: 'safety',
    duration: '55:20',
    date: '2024-01-05',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructor: 'John Instructor',
  },
  {
    id: '4',
    title: 'Aerodynamics Fundamentals',
    description: 'Basic principles of aerodynamics and how they apply to flight.',
    category: 'ground',
    duration: '40:10',
    date: '2024-01-03',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructor: 'Jane Instructor',
  },
  {
    id: '5',
    title: 'Radio Communications',
    description: 'Proper radio communication procedures and phraseology.',
    category: 'ground',
    duration: '28:45',
    date: '2024-01-01',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructor: 'John Instructor',
  },
  {
    id: '6',
    title: 'Emergency Procedures',
    description: 'Critical emergency procedures every pilot must know.',
    category: 'safety',
    duration: '50:00',
    date: '2023-12-28',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructor: 'Jane Instructor',
  },
]

export const videoService = {
  // Get all videos
  getAllVideos(): VideoLesson[] {
    if (typeof window === 'undefined') return defaultVideos
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Initialize with default videos
      this.saveVideos(defaultVideos)
      return defaultVideos
    }
    
    try {
      return JSON.parse(stored)
    } catch {
      return defaultVideos
    }
  },

  // Get video by ID
  getVideoById(id: string): VideoLesson | undefined {
    const videos = this.getAllVideos()
    return videos.find(v => v.id === id)
  },

  // Save videos
  saveVideos(videos: VideoLesson[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos))
  },

  // Add new video
  addVideo(video: Omit<VideoLesson, 'id'>): VideoLesson {
    const videos = this.getAllVideos()
    const newVideo: VideoLesson = {
      ...video,
      id: Date.now().toString(), // Simple ID generation
    }
    videos.push(newVideo)
    this.saveVideos(videos)
    return newVideo
  },

  // Update video
  updateVideo(id: string, updates: Partial<VideoLesson>): VideoLesson | null {
    const videos = this.getAllVideos()
    const index = videos.findIndex(v => v.id === id)
    if (index === -1) return null
    
    videos[index] = { ...videos[index], ...updates }
    this.saveVideos(videos)
    return videos[index]
  },

  // Delete video
  deleteVideo(id: string): boolean {
    const videos = this.getAllVideos()
    const filtered = videos.filter(v => v.id !== id)
    if (filtered.length === videos.length) return false
    
    this.saveVideos(filtered)
    return true
  },
}

