export type EmployeeSummary = {
  id: number
  employee_code?: string | null
  full_name?: string | null
  department?: { id: number; name: string } | null
  position?: { id: number; name: string } | null
} | null

export type AuthUser = {
  id: number
  name: string
  email: string
  phone?: string | null
  avatar_path?: string | null
  locale?: string | null
  timezone?: string | null
  is_active: boolean
  email_verified_at?: string | null
  last_login_at?: string | null
  roles: string[]
  permissions: string[]
  employee?: EmployeeSummary
}

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  hasRole: (role: string | string[]) => boolean
  hasPermission: (permission: string | string[]) => boolean
}
