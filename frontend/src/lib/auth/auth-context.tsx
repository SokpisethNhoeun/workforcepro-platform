"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { api, apiData, csrf, getStoredToken, setAuthToken } from "@/lib/api/client"
import { clearAuthCookie, getAuthCookie, setAuthCookie } from "@/lib/auth/cookie"
import type { AuthContextValue, AuthUser } from "@/lib/auth/types"

const AuthContext = React.createContext<AuthContextValue | null>(null)

type LoginResponse = {
  user: AuthUser
  access_token?: string
  token_type?: string
}

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
      // If we don't have a token or an auth cookie hint, we assume guest
      if (!getStoredToken() && !getAuthCookie()) {
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
          setAuthToken(null)
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
      await csrf()
      const response = await api.post("/api/v1/auth/register", {
        name,
        email,
        password,
        password_confirmation: password,
        phone: phone ?? undefined,
      })
      const data = apiData<LoginResponse>(response)

      setAuthCookie(data.access_token ?? "1", false)
      if (data.access_token) {
        setAuthToken(data.access_token)
      }
      setUser(data.user)
      return data.user
    },
    []
  )

  const login = React.useCallback<AuthContextValue["login"]>(
    async (email, password, remember = true) => {
      await csrf()
      const response = await api.post("/api/v1/auth/login", { email, password, remember })
      const data = apiData<LoginResponse>(response)

      // Always set the auth cookie if login is successful to inform the middleware
      setAuthCookie(data.access_token ?? "1", remember)

      if (data.access_token) {
        setAuthToken(data.access_token)
      }
      setUser(data.user)
      return data.user
    },
    []
  )

  const logout = React.useCallback(async () => {
    try {
      await api.post("/api/v1/auth/logout")
    } catch {
      // ignore — we still want to clear local state
    }
    setAuthToken(null)
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
      logout,
      refresh,
      hasRole,
      hasPermission,
    }),
    [user, isLoading, login, register, logout, refresh, hasRole, hasPermission]
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
