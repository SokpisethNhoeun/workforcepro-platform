export default function ProtectedLoading() {
  return (
    <div className="flex min-h-screen bg-[color:var(--workspace)]">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <div className="space-y-3 p-4">
          <div className="h-9 animate-pulse rounded-md bg-muted" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-7 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1">
        <header className="flex h-14 items-center border-b bg-background/95 px-4">
          <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
        </header>
        <div className="grid place-items-center p-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="size-3 animate-pulse rounded-full bg-primary" />
            Loading workspace…
          </div>
        </div>
      </main>
    </div>
  )
}
