import Link from "next/link"
import { CompassIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@heroui/react"

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[color:var(--workspace)] p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheckIcon className="size-6" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">WorkforcePro</p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn’t find what you were looking for. The link may be outdated or the page may have moved.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="block w-full">
            <Button variant="primary" fullWidth>
              Back to dashboard
            </Button>
          </Link>
          <Link href="/login" className="block w-full">
            <Button variant="outline" fullWidth>
              <CompassIcon className="mr-1 size-4" />
              Go to sign in
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
