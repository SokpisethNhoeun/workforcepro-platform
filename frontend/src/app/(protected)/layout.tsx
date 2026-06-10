"use client"

import { useRouter, usePathname } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/lib/auth/auth-context"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(pathname || "/dashboard")
      router.replace(`/login?next=${next}`)
    }
  }, [isLoading, user, router, pathname])

  if (isLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[color:var(--workspace)] text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="size-3 animate-pulse rounded-full bg-primary" />
          Loading workspace…
        </div>
      </div>
    )
  }

  return <>{children}</>
}
