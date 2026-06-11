"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, EyeOffIcon, LockKeyholeIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@heroui/react"

import { AuthCard } from "@/components/auth/auth-card"
import { Input } from "@/components/ui/input"
import { api, apiErrorMessage } from "@/lib/api/client"

const tokenSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  })

type TokenResetForm = z.infer<typeof tokenSchema>

function TokenResetView({ email, token }: { email: string; token: string }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const form = useForm<TokenResetForm>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { password: "", password_confirmation: "" },
  })

  async function onSubmit(values: TokenResetForm) {
    try {
      await api.post("/api/v1/auth/reset-password", {
        token,
        email,
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
      sileo.success({
        title: "Password reset",
        description: "You can now sign in with your new password.",
      })
      router.push("/login")
    } catch (error) {
      sileo.error({
        title: "Reset failed",
        description: apiErrorMessage(error, "The link may have expired. Try again."),
      })
    }
  }

  return (
    <AuthCard
      title="Reset password"
      description={`Set a new password for ${email}`}
      icon={<LockKeyholeIcon className="size-4" />}
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            New password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirm">
            Confirm new password
          </label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              className="pr-10"
              {...form.register("password_confirmation")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password_confirmation && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password_confirmation.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          isDisabled={form.formState.isSubmitting}
          fullWidth
        >
          {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const token = searchParams.get("token")

  if (token && email) {
    return <TokenResetView email={email} token={token} />
  }

  if (email) {
    return (
      <AuthCard title="Check your email" icon={<LockKeyholeIcon className="size-4" />}>
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
            Please check your inbox and click the link to set a new password.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Reset password" icon={<LockKeyholeIcon className="size-4" />}>
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Invalid or missing password reset link.{" "}
          <Link href="/forgot-password" className="text-primary hover:underline underline-offset-4">
            Request a new one
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordInner />
    </React.Suspense>
  )
}