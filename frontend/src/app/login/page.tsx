"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, EyeOffIcon, LogInIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@heroui/react"

import { AuthCard } from "@/components/auth/auth-card"
import { GoogleButton } from "@/components/auth/google-button"
import { TwoFactorChallenge } from "@/components/auth/two-factor-challenge"
import { Input } from "@/components/ui/input"
import { apiErrorMessage } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { canAccessUserRoute, getDefaultRouteForUser } from "@/lib/auth/routes"
import type { AuthUser } from "@/lib/auth/types"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
})

type LoginForm = z.infer<typeof schema>

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [challengeToken, setChallengeToken] = React.useState<string | null>(null)

  const form = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  })

  const redirectAfterLogin = React.useCallback((user: AuthUser) => {
    const next = searchParams.get("next")
    router.push(next && next.startsWith("/") && canAccessUserRoute(user, next) ? next : getDefaultRouteForUser(user))
  }, [router, searchParams])

  async function onSubmit(values: LoginForm) {
    try {
      const result = await auth.login(values.email, values.password, values.remember ?? false)
      if ("two_factor_required" in result) {
        setChallengeToken(result.challenge_token)
        return
      }
      sileo.success({ title: "Signed in", description: "Welcome back!" })
      redirectAfterLogin(result)
    } catch (error) {
      sileo.error({
        title: "Sign in failed",
        description: apiErrorMessage(error, "Check your credentials and try again."),
      })
    }
  }

  if (challengeToken) {
    return (
      <TwoFactorChallenge
        challengeToken={challengeToken}
        onSuccess={(user) => redirectAfterLogin(user)}
        onCancel={() => setChallengeToken(null)}
      />
    )
  }

  return (
    <AuthCard
      title="Sign in"
      description="Enter your credentials to access your workspace"
      icon={<LogInIcon className="size-4" />}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              {...form.register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              className="size-4 rounded border accent-primary"
              {...form.register("remember")}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          isDisabled={form.formState.isSubmitting}
          fullWidth
          className="mt-2"
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <GoogleButton
        onSuccess={(result) => {
          if ("two_factor_required" in result) {
            setChallengeToken(result.challenge_token)
            return
          }
          sileo.success({ title: "Signed in", description: "Welcome back!" })
          redirectAfterLogin(result)
        }}
      />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline underline-offset-4">
          Create account
        </Link>
      </p>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginInner />
    </React.Suspense>
  )
}
