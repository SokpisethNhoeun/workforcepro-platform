"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { api, apiData } from "@/lib/api/client"
import { clearAuthCookie, getAuthCookie, setAuthCookie } from "@/lib/auth/cookie"
import type { AuthContextValue, AuthUser, TwoFactorChallenge } from "@/lib/auth/types"

const AuthContext = React.createContext<AuthContextValue | null>(null)

type RegisterResponse = {
  user: AuthUser
}

type LoginResponse = RegisterResponse | TwoFactorChallenge

function toArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value]
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchMe = React.useCallback(async () => {
    const response = await api.get("/api/v1/auth/me")
    const data = apiData<AuthUser>(response)
    setUser(data)
    return data
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function boot() {
      if (!getAuthCookie()) {
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        await fetchMe()
      } catch {
        if (!cancelled) {
          clearAuthCookie()
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [fetchMe])

  const register = React.useCallback<AuthContextValue["register"]>(
    async (name, email, password, phone) => {
      const response = await api.post("/api/auth/register", {
        name,
        email,
        password,
        password_confirmation: password,
        phone: phone ?? undefined,
      })
      const data = apiData<RegisterResponse>(response)

      setAuthCookie("1", false)
      setUser(data.user)
      return data.user
    },
    []
  )

  const login = React.useCallback<AuthContextValue["login"]>(
    async (email, password, remember = true) => {
      const response = await api.post("/api/auth/login", { email, password, remember })
      const data = apiData<LoginResponse>(response)

      if ("two_factor_required" in data) {
        return data as TwoFactorChallenge
      }

      setAuthCookie("1", remember)
      setUser(data.user)
      return data.user
    },
    []
  )

  const loginWithGoogle = React.useCallback<AuthContextValue["loginWithGoogle"]>(
    async (code) => {
      const response = await api.post("/api/auth/google/callback", { code })
      const data = apiData<LoginResponse>(response)

      if ("two_factor_required" in data) {
        return data as TwoFactorChallenge
      }

      setAuthCookie("1", true)
      setUser(data.user)
      return data.user
    },
    []
  )

  const verifyTwoFactor = React.useCallback<AuthContextValue["verifyTwoFactor"]>(
    async (challengeToken, code, recoveryCode) => {
      const response = await api.post("/api/auth/two-factor-challenge", {
        challenge_token: challengeToken,
        code: recoveryCode ? undefined : code,
        recovery_code: recoveryCode,
      })
      const data = apiData<{ user: AuthUser }>(response)

      setAuthCookie("1", true)
      setUser(data.user)
      return data.user
    },
    []
  )

  const logout = React.useCallback(async () => {
    try {
      await api.post("/api/auth/logout")
    } catch {
      // ignore — we still want to clear local state
    }
    clearAuthCookie()
    setUser(null)
    router.push("/login")
  }, [router])

  const refresh = React.useCallback(async () => {
    await fetchMe()
  }, [fetchMe])

  const hasRole = React.useCallback(
    (role: string | string[]) => {
      if (!user || !user.roles) return false
      const needed = toArray(role)
      return needed.some((r) => user.roles.includes(r))
    },
    [user]
  )

  const hasPermission = React.useCallback(
    (permission: string | string[]) => {
      if (!user || !user.permissions) return false
      const needed = toArray(permission)
      return needed.some((p) => user.permissions.includes(p))
    },
    [user]
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      loginWithGoogle,
      verifyTwoFactor,
      logout,
      refresh,
      hasRole,
      hasPermission,
    }),
    [user, isLoading, login, register, loginWithGoogle, verifyTwoFactor, logout, refresh, hasRole, hasPermission]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }
  return ctx
}
