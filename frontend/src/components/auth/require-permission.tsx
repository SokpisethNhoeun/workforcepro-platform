"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/lib/auth/auth-context"
import { getDefaultRouteForUser } from "@/lib/auth/routes"

type RequirePermissionProps = {
  permission?: string | string[]
  role?: string | string[]
  children: React.ReactNode
}

export function RequirePermission({ permission, role, children }: RequirePermissionProps) {
  const { isLoading, user, hasPermission, hasRole } = useAuth()
  const router = useRouter()

  const allowed = React.useMemo(() => {
    if (!user) return false
    if (permission && !hasPermission(permission)) return false
    if (role && !hasRole(role)) return false
    return true
  }, [user, permission, role, hasPermission, hasRole])

  React.useEffect(() => {
    if (!isLoading && user && !allowed) {
      router.replace(getDefaultRouteForUser(user))
    }
  }, [isLoading, user, allowed, router])

  if (isLoading || !user || !allowed) return null
  return <>{children}</>
}
