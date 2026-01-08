export interface LibraryFile {
  id: string
  name: string
  path: string  // Full path including folder structure (e.g., "folder1/subfolder/file.pdf")
  folderPath: string  // Path to the folder containing this file (e.g., "folder1/subfolder")
  size: number  // File size in bytes
  type: string  // MIME type
  uploadedAt: string  // ISO date string
  uploadedBy: string  // User ID who uploaded
  url?: string  // Public URL to access the file
  data?: string  // Base64 encoded file data (for local storage)
}

export interface LibraryFolder {
  id: string
  name: string
  path: string  // Full path to this folder (e.g., "folder1/subfolder")
  parentPath: string | null  // Path to parent folder, null for root
  createdAt: string  // ISO date string
  createdBy: string  // User ID who created
}

const STORAGE_KEY_FILES = 'magnolia_library_files'
const STORAGE_KEY_FOLDERS = 'magnolia_library_folders'

// Initialize with empty arrays if none exist
function getStoredFiles(): LibraryFile[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FILES)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getStoredFolders(): LibraryFolder[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FOLDERS)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveFiles(files: LibraryFile[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files))
}

function saveFolders(folders: LibraryFolder[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders))
}

export const fileLibraryService = {
  // Get all files
  getAllFiles(): LibraryFile[] {
    return getStoredFiles()
  },

  // Get all folders
  getAllFolders(): LibraryFolder[] {
    return getStoredFolders()
  },

  // Get files in a specific folder
  getFilesInFolder(folderPath: string | null): LibraryFile[] {
    const allFiles = this.getAllFiles()
    if (folderPath === null) {
      // Get files in root (no folder path)
      return allFiles.filter(file => !file.folderPath || file.folderPath === '')
    }
    return allFiles.filter(file => file.folderPath === folderPath)
  },

  // Get subfolders of a specific folder
  getSubfolders(parentPath: string | null): LibraryFolder[] {
    const allFolders = this.getAllFolders()
    if (parentPath === null) {
      // Get root folders (no parent)
      return allFolders.filter(folder => !folder.parentPath || folder.parentPath === '')
    }
    return allFolders.filter(folder => folder.parentPath === parentPath)
  },

  // Add a file
  addFile(file: Omit<LibraryFile, 'id' | 'uploadedAt'>): LibraryFile {
    const files = this.getAllFiles()
    const newFile: LibraryFile = {
      ...file,
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date().toISOString(),
    }
    files.push(newFile)
    saveFiles(files)
    return newFile
  },

  // Get file data URL (creates a blob URL from base64 data)
  getFileDataUrl(file: LibraryFile): string | null {
    if (file.data) {
      return `data:${file.type};base64,${file.data}`
    }
    if (file.url) {
      return file.url
    }
    return null
  },

  // Create a folder
  createFolder(name: string, parentPath: string | null, createdBy: string): LibraryFolder {
    const folders = this.getAllFolders()
    
    // Validate folder name
    if (!name || name.trim() === '') {
      throw new Error('Folder name cannot be empty')
    }

    // Check for invalid characters
    if (/[<>:"/\\|?*]/.test(name)) {
      throw new Error('Folder name contains invalid characters')
    }

    // Build the full path
    const fullPath = parentPath ? `${parentPath}/${name}` : name

    // Check if folder already exists at this path
    const existing = folders.find(f => f.path === fullPath)
    if (existing) {
      throw new Error('A folder with this name already exists in this location')
    }

    const newFolder: LibraryFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      path: fullPath,
      parentPath: parentPath || null,
      createdAt: new Date().toISOString(),
      createdBy,
    }
    folders.push(newFolder)
    saveFolders(folders)
    return newFolder
  },

  // Delete a file
  deleteFile(fileId: string): boolean {
    const files = this.getAllFiles()
    const index = files.findIndex(f => f.id === fileId)
    if (index === -1) return false
    files.splice(index, 1)
    saveFiles(files)
    return true
  },

  // Delete a folder (and all its contents)
  deleteFolder(folderPath: string): boolean {
    const folders = this.getAllFolders()
    const files = this.getAllFiles()

    // Find all subfolders
    const subfolders = folders.filter(f => 
      f.path === folderPath || f.path.startsWith(`${folderPath}/`)
    )

    // Find all files in this folder and subfolders
    const filesToDelete = files.filter(f => 
      f.folderPath === folderPath || f.folderPath.startsWith(`${folderPath}/`)
    )

    // Delete all files
    filesToDelete.forEach(file => {
      const index = files.findIndex(f => f.id === file.id)
      if (index !== -1) files.splice(index, 1)
    })

    // Delete all subfolders
    subfolders.forEach(folder => {
      const index = folders.findIndex(f => f.id === folder.id)
      if (index !== -1) folders.splice(index, 1)
    })

    saveFiles(files)
    saveFolders(folders)
    return true
  },

  // Get folder structure as a tree
  getFolderTree(): Array<{ folder: LibraryFolder; children: LibraryFolder[] }> {
    const folders = this.getAllFolders()
    const rootFolders = folders.filter(f => !f.parentPath || f.parentPath === '')
    
    const buildTree = (parentPath: string | null): LibraryFolder[] => {
      return folders.filter(f => f.parentPath === parentPath)
    }

    return rootFolders.map(folder => ({
      folder,
      children: buildTree(folder.path),
    }))
  },

  // Get breadcrumb path for navigation
  getBreadcrumbs(folderPath: string | null): Array<{ name: string; path: string | null }> {
    const breadcrumbs: Array<{ name: string; path: string | null }> = [
      { name: 'Library', path: null }
    ]

    if (!folderPath) return breadcrumbs

    const folders = this.getAllFolders()
    const pathParts = folderPath.split('/')
    let currentPath = ''

    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const folder = folders.find(f => f.path === currentPath)
      if (folder) {
        breadcrumbs.push({ name: folder.name, path: currentPath })
      }
    }

    return breadcrumbs
  },
}

