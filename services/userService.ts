// User Management Service
// Stores users in localStorage (can be replaced with API calls)

export type EnrollmentStatus = 'pending' | 'approved'
export type Location = 'LZU' | '2M8'  // Lawrenceville (LZU) or Charles W Baker (2M8)

export interface PortalUser {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  role: 'student' | 'instructor' | 'admin'
  enrolled: boolean
  enrollmentStatus?: EnrollmentStatus  // 'pending' for new students, 'approved' for verified students
  enrollmentDate?: string
  lastLogin?: string
  location?: Location  // Location: Lawrenceville (LZU) or Charles W Baker (2M8)
  fspStudentId?: string  // Flight Schedule Pro student ID
  fspInstructorId?: string  // Flight Schedule Pro instructor ID
  enrolledCourseIds?: string[]  // Array of course IDs the user is enrolled in
  assignedInstructorIds?: string[]  // Array of instructor IDs assigned to the user
}

const STORAGE_KEY = 'magnolia_users'

// Initialize with default users if none exist
const defaultUsers: PortalUser[] = [
  {
    id: '1',
    name: 'John Student',
    firstName: 'John',
    lastName: 'Student',
    email: 'student@example.com',
    role: 'student',
    enrolled: true,
    enrollmentStatus: 'approved',
    enrollmentDate: '2024-01-01',
    enrolledCourseIds: ['indoc-1', 'ground-1', 'preflight-1'],
    assignedInstructorIds: ['2'],
  },
  {
    id: '2',
    name: 'Jane Instructor',
    firstName: 'Jane',
    lastName: 'Instructor',
    email: 'instructor@example.com',
    role: 'instructor',
    enrolled: true,
    enrollmentDate: '2024-01-01',
  },
  {
    id: '3',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
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

  // Get pending students (awaiting approval)
  getPendingStudents(): PortalUser[] {
    return this.getAllUsers().filter(
      u => u.role === 'student' && 
      (u.enrollmentStatus === 'pending' || (!u.enrollmentStatus && u.enrolled))
    )
  },

  // Get students assigned to an instructor
  getStudentsByInstructor(instructorId: string): PortalUser[] {
    return this.getAllUsers().filter(
      u => u.role === 'student' && 
      u.assignedInstructorIds?.includes(instructorId)
    )
  },

  // Approve a student (grant access)
  approveStudent(studentId: string): PortalUser | null {
    return this.updateUser(studentId, { 
      enrollmentStatus: 'approved',
      enrolled: true 
    })
  },

  // Update FSP IDs for a user
  updateUserFspId(userId: string, fspStudentId?: string, fspInstructorId?: string): PortalUser | null {
    const updates: Partial<PortalUser> = {}
    if (fspStudentId !== undefined) updates.fspStudentId = fspStudentId
    if (fspInstructorId !== undefined) updates.fspInstructorId = fspInstructorId
    return this.updateUser(userId, updates)
  },
}

