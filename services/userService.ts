// User Management Service
// Stores users in localStorage (can be replaced with API calls)

export interface PortalUser {
  id: string
  name: string
  email: string
  role: 'student' | 'instructor' | 'admin'
  enrolled: boolean
  enrollmentDate?: string
  lastLogin?: string
  fspStudentId?: string  // Flight Schedule Pro student ID
  fspInstructorId?: string  // Flight Schedule Pro instructor ID
}

const STORAGE_KEY = 'magnolia_users'

// Initialize with default users if none exist
const defaultUsers: PortalUser[] = [
  {
    id: '1',
    name: 'John Student',
    email: 'student@example.com',
    role: 'student',
    enrolled: true,
    enrollmentDate: '2024-01-01',
  },
  {
    id: '2',
    name: 'Jane Instructor',
    email: 'instructor@example.com',
    role: 'instructor',
    enrolled: true,
    enrollmentDate: '2024-01-01',
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@magnolia.com',
    role: 'admin',
    enrolled: true,
    enrollmentDate: '2024-01-01',
  },
]

export const userService = {
  // Get all users
  getAllUsers(): PortalUser[] {
    if (typeof window === 'undefined') return defaultUsers
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      this.saveUsers(defaultUsers)
      return defaultUsers
    }
    
    try {
      return JSON.parse(stored)
    } catch {
      return defaultUsers
    }
  },

  // Get user by ID
  getUserById(id: string): PortalUser | undefined {
    const users = this.getAllUsers()
    return users.find(u => u.id === id)
  },

  // Get user by email
  getUserByEmail(email: string): PortalUser | undefined {
    const users = this.getAllUsers()
    return users.find(u => u.email === email)
  },

  // Save users
  saveUsers(users: PortalUser[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  },

  // Add new user
  addUser(user: Omit<PortalUser, 'id'>): PortalUser {
    const users = this.getAllUsers()
    const newUser: PortalUser = {
      ...user,
      id: Date.now().toString(),
    }
    users.push(newUser)
    this.saveUsers(users)
    return newUser
  },

  // Update user
  updateUser(id: string, updates: Partial<PortalUser>): PortalUser | null {
    const users = this.getAllUsers()
    const index = users.findIndex(u => u.id === id)
    if (index === -1) return null
    
    users[index] = { ...users[index], ...updates }
    this.saveUsers(users)
    return users[index]
  },

  // Update user role
  updateUserRole(id: string, role: 'student' | 'instructor' | 'admin'): PortalUser | null {
    return this.updateUser(id, { role })
  },

  // Delete user
  deleteUser(id: string): boolean {
    const users = this.getAllUsers()
    const filtered = users.filter(u => u.id !== id)
    if (filtered.length === users.length) return false
    
    this.saveUsers(filtered)
    return true
  },

  // Get enrolled users only
  getEnrolledUsers(): PortalUser[] {
    return this.getAllUsers().filter(u => u.enrolled)
  },

  // Update FSP IDs for a user
  updateUserFspId(userId: string, fspStudentId?: string, fspInstructorId?: string): PortalUser | null {
    const updates: Partial<PortalUser> = {}
    if (fspStudentId !== undefined) updates.fspStudentId = fspStudentId
    if (fspInstructorId !== undefined) updates.fspInstructorId = fspInstructorId
    return this.updateUser(userId, updates)
  },
}

