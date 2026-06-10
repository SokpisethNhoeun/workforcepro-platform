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
import { OtpInput } from "@/components/auth/otp-input"
import { Input } from "@/components/ui/input"
import { api, apiErrorMessage } from "@/lib/api/client"

const RESEND_COOLDOWN = 60

const schema = z
  .object({
    code: z.string().length(6, "Enter all 6 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  })

type ResetForm = z.infer<typeof schema>

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""

  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const form = useForm<ResetForm>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", password: "", password_confirmation: "" },
  })

  async function onSubmit(values: ResetForm) {
    try {
      await api.post("/api/v1/auth/reset-password-with-otp", {
        email,
        code: values.code,
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
        description: apiErrorMessage(error, "Invalid code or something went wrong."),
      })
    }
  }

  async function handleResend() {
    if (!email) return
    setResending(true)
    try {
      await api.post("/api/v1/auth/send-reset-otp", { email })
      sileo.success({ title: "Code resent", description: "Check your inbox for a new code." })
      setCooldown(RESEND_COOLDOWN)
      form.setValue("code", "")
    } catch (error) {
      sileo.error({
        title: "Could not resend",
        description: apiErrorMessage(error, "Please try again."),
      })
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return (
      <AuthCard
        title="Reset password"
        icon={<LockKeyholeIcon className="size-4" />}
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            No email address provided.{" "}
            <Link href="/forgot-password" className="text-primary hover:underline underline-offset-4">
              Go back
            </Link>
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset password"
      description={`Enter the code sent to ${email}`}
      icon={<LockKeyholeIcon className="size-4" />}
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground text-center">
            Verification code
          </p>
          <OtpInput
            value={form.watch("code")}
            onChange={(v) => form.setValue("code", v, { shouldValidate: true })}
            autoFocus
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive text-center">
              {form.formState.errors.code.message}
            </p>
          )}
        </div>

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
          {form.formState.isSubmitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>
          Didn&apos;t receive the code?{" "}
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary font-medium hover:underline underline-offset-4 disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </p>
        <p>
          <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
            Back to sign in
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
