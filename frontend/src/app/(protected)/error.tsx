"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangleIcon, RotateCcwIcon, HomeIcon } from "lucide-react"

import { Button } from "@heroui/react"

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  React.useEffect(() => {
    console.error("[protected error]", error)
  }, [error])

  return (
    <main className="grid min-h-[calc(100vh-3.5rem)] place-items-center bg-[color:var(--workspace)] p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-md bg-destructive/15 text-destructive">
          <AlertTriangleIcon className="size-6" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          WorkforcePro
        </p>
        <h1 className="mt-2 text-2xl font-semibold">This page hit an error</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t finish loading this module. Try again, or jump back to your dashboard.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">ref: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onPress={() => reset()} variant="primary">
            <RotateCcwIcon className="size-4" />
            Try again
          </Button>
          <Button onPress={() => router.push("/dashboard")} variant="outline">
            <HomeIcon className="size-4" />
            Back to dashboard
          </Button>
        </div>
      </section>
    </main>
  )
}
