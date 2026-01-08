'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { FolderOpen, FileText, Download, ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ name: string; path: string | null }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadFiles()
    }
  }, [currentFolderPath, user])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const folderParam = currentFolderPath ? `?folderPath=${encodeURIComponent(currentFolderPath)}` : ''
      const response = await fetch(`/api/library/files${folderParam}`)
      const data = await response.json()
      if (data.success) {
        // Filter files based on user role and visibility
        const allFiles = data.files || []
        const filteredFiles = allFiles.filter((file: any) => {
          const visibility = file.visibility || 'all'
          if (user?.role === 'admin') {
            return true // Admins can see everything
          }
          if (visibility === 'all') {
            return true
          }
          // Only instructors can see 'instructor' files
          return user?.role === 'instructor'
        })
        setFiles(filteredFiles)
        setFolders(data.folders || [])
        setBreadcrumbs(data.breadcrumbs || [])
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
          <p className="text-gray-600 mt-1">Browse and download documents</p>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={() => setCurrentFolderPath(crumb.path)}
                  className={`${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-600 hover:text-magnolia-600'
                  }`}
                >
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {folders.length === 0 && files.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">This folder is empty</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {/* Folders */}
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setCurrentFolderPath(folder.path)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <FolderOpen className="h-6 w-6 text-magnolia-600" />
                      <div>
                        <p className="font-medium text-gray-900">{folder.name}</p>
                        <p className="text-sm text-gray-500">Folder</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Files */}
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <FileText className="h-6 w-6 text-gray-400" />
                      <div>
                        <a
                          href={`/api/library/file?id=${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-magnolia-600"
                        >
                          {file.name}
                        </a>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                          {file.visibility === 'instructor' && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              Instructor Only
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/library/file?id=${file.id}`}
                      download={file.name}
                      className="p-2 text-magnolia-600 hover:bg-magnolia-50 rounded-lg transition-colors"
                      title="Download file"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

