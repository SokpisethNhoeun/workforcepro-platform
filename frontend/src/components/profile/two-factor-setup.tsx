"use client"

import { CopyIcon, KeyRoundIcon, ShieldCheckIcon, ShieldOffIcon } from "lucide-react"
import * as React from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OtpInput } from "@/components/auth/otp-input"
import { api, apiErrorMessage, csrf } from "@/lib/api/client"

type TwoFactorStatus = {
  enabled: boolean
  confirmed: boolean
}

type SetupData = {
  secret: string
  qr_code_url: string
}

export function TwoFactorSetup() {
  const [status, setStatus] = React.useState<TwoFactorStatus | null>(null)
  const [setupData, setSetupData] = React.useState<SetupData | null>(null)
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[] | null>(null)
  const [confirmCode, setConfirmCode] = React.useState("")
  const [disablePassword, setDisablePassword] = React.useState("")
  const [confirming, setConfirming] = React.useState(false)
  const [disabling, setDisabling] = React.useState(false)
  const [showDisable, setShowDisable] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/auth/two-factor/status")
        if (mounted) setStatus(res.data.data)
      } catch {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function handleEnable() {
    try {
      await csrf()
      const res = await api.post("/api/v1/auth/two-factor/enable")
      setSetupData(res.data.data)
      setRecoveryCodes(null)
      setConfirmCode("")
    } catch (error) {
      sileo.error({
        title: "Setup failed",
        description: apiErrorMessage(error, "Could not start 2FA setup."),
      })
    }
  }

  async function handleConfirm() {
    setConfirming(true)
    try {
      await csrf()
      const res = await api.post("/api/v1/auth/two-factor/confirm", { code: confirmCode })
      setRecoveryCodes(res.data.data.recovery_codes)
      setSetupData(null)
      setStatus({ enabled: true, confirmed: true })
      sileo.success({ title: "2FA enabled", description: "Two-factor authentication is now active." })
    } catch (error) {
      sileo.error({
        title: "Verification failed",
        description: apiErrorMessage(error, "Invalid code. Try again."),
      })
    } finally {
      setConfirming(false)
    }
  }

  async function handleDisable() {
    setDisabling(true)
    try {
      await csrf()
      await api.delete("/api/v1/auth/two-factor/disable", { data: { password: disablePassword } })
      setStatus({ enabled: false, confirmed: false })
      setDisablePassword("")
      setShowDisable(false)
      setRecoveryCodes(null)
      sileo.success({ title: "2FA disabled" })
    } catch (error) {
      sileo.error({
        title: "Disable failed",
        description: apiErrorMessage(error, "Check your password and try again."),
      })
    } finally {
      setDisabling(false)
    }
  }

  async function handleViewRecoveryCodes() {
    try {
      const res = await api.get("/api/v1/auth/two-factor/recovery-codes")
      setRecoveryCodes(res.data.data.recovery_codes)
    } catch (error) {
      sileo.error({
        title: "Failed to load codes",
        description: apiErrorMessage(error),
      })
    }
  }

  async function handleRegenerateRecoveryCodes() {
    try {
      await csrf()
      const res = await api.post("/api/v1/auth/two-factor/recovery-codes")
      setRecoveryCodes(res.data.data.recovery_codes)
      sileo.success({ title: "Recovery codes regenerated" })
    } catch (error) {
      sileo.error({
        title: "Failed",
        description: apiErrorMessage(error),
      })
    }
  }

  function copyRecoveryCodes() {
    if (!recoveryCodes) return
    navigator.clipboard.writeText(recoveryCodes.join("\n"))
    sileo.success({ title: "Copied to clipboard" })
  }

  if (!status) return null

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheckIcon className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
        {status.enabled && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Enabled
          </span>
        )}
      </div>

      {!status.enabled && !setupData && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security by enabling two-factor authentication with an authenticator app like Google Authenticator.
          </p>
          <Button onClick={handleEnable}>
            <KeyRoundIcon className="size-4" />
            Enable 2FA
          </Button>
        </div>
      )}

      {setupData && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan the QR code below with your authenticator app, then enter the 6-digit code to confirm.
          </p>

          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qr_code_url)}`}
              alt="2FA QR Code"
              width={200}
              height={200}
              className="rounded-lg border"
            />
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Manual entry key</p>
            <code className="text-sm font-mono break-all">{setupData.secret}</code>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground text-center">
              Enter verification code
            </p>
            <OtpInput
              value={confirmCode}
              onChange={setConfirmCode}
              autoFocus
              disabled={confirming}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={confirming || confirmCode.length !== 6}>
              <ShieldCheckIcon className="size-4" />
              {confirming ? "Verifying..." : "Confirm & Enable"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSetupData(null); setConfirmCode("") }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {status.enabled && !setupData && (
        <div className="space-y-4">
          {recoveryCodes && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Recovery Codes</p>
                <button
                  type="button"
                  onClick={copyRecoveryCodes}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <CopyIcon className="size-3" />
                  Copy
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-3">
                {recoveryCodes.map((code) => (
                  <code key={code} className="text-xs font-mono">{code}</code>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Store these codes in a safe place. Each code can only be used once.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!recoveryCodes && (
              <Button variant="outline" size="sm" onClick={handleViewRecoveryCodes}>
                View Recovery Codes
              </Button>
            )}
            {recoveryCodes && (
              <Button variant="outline" size="sm" onClick={handleRegenerateRecoveryCodes}>
                Regenerate Codes
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisable(!showDisable)}
              className="text-destructive"
            >
              <ShieldOffIcon className="size-3" />
              Disable 2FA
            </Button>
          </div>

          {showDisable && (
            <div className="space-y-2 rounded-md border border-destructive/20 p-3">
              <p className="text-xs text-muted-foreground">
                Enter your password to disable two-factor authentication.
              </p>
              <Input
                type="password"
                placeholder="Your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleDisable}
                  disabled={disabling || !disablePassword}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {disabling ? "Disabling..." : "Confirm Disable"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowDisable(false); setDisablePassword("") }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
