"use client"

import * as React from "react"
import { sileo } from "sileo"

import { apiErrorMessage } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import type { LoginResult } from "@/lib/auth/types"

type GoogleButtonProps = {
  onSuccess: (result: LoginResult) => void
  label?: string
}

type GoogleRedirectResponse = {
  message?: string
  data?: {
    url?: string
  }
}

export function GoogleButton({ onSuccess, label = "Sign in with Google" }: GoogleButtonProps) {
  const auth = useAuth()
  const [loading, setLoading] = React.useState(() => {
    if (typeof window === "undefined") return false
    const params = new URLSearchParams(window.location.search)
    return !!params.get("code")
  })
  const handledRef = React.useRef(false)

  const handleClick = React.useCallback(() => {
    setLoading(true)

    fetch("/api/auth/google", {
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        const data = (await response.json()) as GoogleRedirectResponse
        if (!response.ok || !data.data?.url) {
          throw new Error(data.message ?? "OAuth is not configured.")
        }

        window.location.href = data.data.url
      })
      .catch((error) => {
        setLoading(false)
        sileo.error({
          title: "Google Sign-In unavailable",
          description: error instanceof Error ? error.message : "OAuth is not configured.",
        })
      })
  }, [])

  React.useEffect(() => {
    if (handledRef.current) return
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (!code) return
    handledRef.current = true

    auth
      .loginWithGoogle(code)
      .then((result) => {
        window.history.replaceState({}, "", "/login")
        onSuccess(result)
      })
      .catch((error) => {
        window.history.replaceState({}, "", "/login")
        setLoading(false)
        sileo.error({
          title: "Google sign-in failed",
          description: apiErrorMessage(error, "Could not sign in with Google."),
        })
      })
  }, [auth, onSuccess])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
    >
      <svg className="size-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {loading ? "Signing in..." : label}
    </button>
  )
}
