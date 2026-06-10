import Link from "next/link"
import { LockIcon } from "lucide-react"

import { Button } from "@heroui/react"

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[color:var(--workspace)] p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <LockIcon className="size-6" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">WorkforcePro</p>
        <h1 className="mt-2 text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don’t have permission to view this page. If you think this is a mistake, contact your administrator.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="block w-full">
            <Button variant="primary" fullWidth>
              Back to dashboard
            </Button>
          </Link>
          <Link href="/login" className="block w-full">
            <Button variant="outline" fullWidth>
              Switch account
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
