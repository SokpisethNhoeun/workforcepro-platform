import { ShieldCheckIcon } from "lucide-react"
import * as React from "react"

type AuthCardProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export function AuthCard({ title, description, icon, children }: AuthCardProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--workspace)] p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-xl border overflow-hidden">
        {/* Branded header */}
        <div className="bg-primary px-8 py-5 flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2 shrink-0">
            <ShieldCheckIcon className="size-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">WorkforcePro</p>
            <p className="text-xs text-white/70">Enterprise HR Platform</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
