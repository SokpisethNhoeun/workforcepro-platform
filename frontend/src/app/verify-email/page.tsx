"use client"

import { MailCheckIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { sileo } from "sileo"

import { AuthCard } from "@/components/auth/auth-card"
import { OtpInput } from "@/components/auth/otp-input"
import { api, apiErrorMessage } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"

const RESEND_COOLDOWN = 60

export default function VerifyEmailPage() {
  const router = useRouter()
  const auth = useAuth()
  const [code, setCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleVerify() {
    if (code.length !== 6) {
      sileo.error({ title: "Invalid code", description: "Please enter all 6 digits." })
      return
    }
    setLoading(true)
    try {
      await api.post("/api/v1/auth/email/verify", { code })
      await auth.refresh()
      sileo.success({ title: "Email verified", description: "Your account is now active." })
      router.push("/dashboard")
    } catch (error) {
      sileo.error({
        title: "Verification failed",
        description: apiErrorMessage(error, "Invalid or expired code. Try again."),
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await api.post("/api/v1/auth/email/resend")
      sileo.success({ title: "Code sent", description: "Check your inbox for a new code." })
      setCooldown(RESEND_COOLDOWN)
      setCode("")
    } catch (error) {
      sileo.error({
        title: "Could not resend",
        description: apiErrorMessage(error, "Please try again shortly."),
      })
    } finally {
      setResending(false)
    }
  }

  const email = auth.user?.email ?? "your email"

  return (
    <AuthCard
      title="Verify your email"
      description={`We sent a 6-digit code to ${email}`}
      icon={<MailCheckIcon className="size-4" />}
    >
      <div className="space-y-6">
        <OtpInput value={code} onChange={setCode} autoFocus disabled={loading} />

        <button
          type="button"
          onClick={handleVerify}
          disabled={code.length !== 6 || loading}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying…" : "Verify email"}
        </button>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>
            Didn&apos;t receive the code?{" "}
            {cooldown > 0 ? (
              <span className="text-muted-foreground">Resend in {cooldown}s</span>
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
            <Link
              href="/login"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  )
}
