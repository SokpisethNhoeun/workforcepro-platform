"use client"

import { ShieldCheckIcon } from "lucide-react"
import * as React from "react"
import { sileo } from "sileo"

import { Button } from "@heroui/react"

import { AuthCard } from "@/components/auth/auth-card"
import { OtpInput } from "@/components/auth/otp-input"
import { Input } from "@/components/ui/input"
import { apiErrorMessage } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import type { AuthUser } from "@/lib/auth/types"

type TwoFactorChallengeProps = {
  challengeToken: string
  onSuccess: (user: AuthUser) => void
  onCancel: () => void
}

export function TwoFactorChallenge({ challengeToken, onSuccess, onCancel }: TwoFactorChallengeProps) {
  const auth = useAuth()
  const [mode, setMode] = React.useState<"totp" | "recovery">("totp")
  const [code, setCode] = React.useState("")
  const [recoveryCode, setRecoveryCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const user = await auth.verifyTwoFactor(
        challengeToken,
        mode === "totp" ? code : "",
        mode === "recovery" ? recoveryCode : undefined
      )
      sileo.success({ title: "Signed in", description: "Welcome back!" })
      onSuccess(user)
    } catch (error) {
      sileo.error({
        title: "Verification failed",
        description: apiErrorMessage(error, "Invalid code. Please try again."),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Two-factor authentication"
      description={
        mode === "totp"
          ? "Enter the 6-digit code from your authenticator app"
          : "Enter one of your recovery codes"
      }
      icon={<ShieldCheckIcon className="size-4" />}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "totp" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground text-center">
              Authentication code
            </p>
            <OtpInput
              value={code}
              onChange={setCode}
              autoFocus
              disabled={submitting}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="recovery">
              Recovery code
            </label>
            <Input
              id="recovery"
              type="text"
              placeholder="xxxxx-xxxxx"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              autoFocus
              disabled={submitting}
            />
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          isDisabled={submitting || (mode === "totp" ? code.length !== 6 : !recoveryCode)}
          fullWidth
        >
          {submitting ? "Verifying..." : "Verify"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground space-y-1">
        {mode === "totp" ? (
          <button
            type="button"
            onClick={() => { setMode("recovery"); setCode("") }}
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Use a recovery code instead
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setMode("totp"); setRecoveryCode("") }}
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Use authenticator app instead
          </button>
        )}
        <p>
          <button
            type="button"
            onClick={onCancel}
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Back to sign in
          </button>
        </p>
      </div>
    </AuthCard>
  )
}
