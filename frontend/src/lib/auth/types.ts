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
  avatar_url?: string | null
  locale?: string | null
  timezone?: string | null
  is_active: boolean
  email_verified_at?: string | null
  last_login_at?: string | null
  two_factor_enabled?: boolean
  roles: string[]
  permissions: string[]
  employee?: EmployeeSummary
}

export type TwoFactorChallenge = {
  two_factor_required: true
  challenge_token: string
}

export type LoginResult = AuthUser | TwoFactorChallenge

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<LoginResult>
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthUser>
  loginWithGoogle: (code: string) => Promise<LoginResult>
  verifyTwoFactor: (challengeToken: string, code: string, recoveryCode?: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  hasRole: (role: string | string[]) => boolean
  hasPermission: (permission: string | string[]) => boolean
}
