"use client"

import * as React from "react"

import { useAuth } from "@/lib/auth/auth-context"

type CanProps = {
  role?: string | string[]
  permission?: string | string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function Can({ role, permission, fallback = null, children }: CanProps) {
  const { hasRole, hasPermission, isLoading } = useAuth()
  if (isLoading) return null
  if (role && !hasRole(role)) return <>{fallback}</>
  if (permission && !hasPermission(permission)) return <>{fallback}</>
  return <>{children}</>
}
