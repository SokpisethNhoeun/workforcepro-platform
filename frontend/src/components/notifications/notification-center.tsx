"use client"

import * as React from "react"
import { BellIcon, CheckCheckIcon, Trash2Icon } from "lucide-react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { api, csrf } from "@/lib/api/client"

type Notification = {
  id: number
  type: string
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}

const initialNotifications: Notification[] = []

const typeColors: Record<string, string> = {
  info: "bg-blue-500",
  leave: "bg-green-500",
  task: "bg-orange-500",
  payroll: "bg-purple-500",
  warning: "bg-yellow-500",
}

export function NotificationCenter() {
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = React.useState(2)
  const [filter, setFilter] = React.useState<"all" | "unread">("all")

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/notifications")
        if (mounted && Array.isArray(res.data?.data)) {
          setNotifications(res.data.data)
          setUnreadCount(res.data?.meta?.unread_count ?? 0)
        }
      } catch {
        if (mounted) setNotifications(initialNotifications)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function markAsRead(id: number) {
    try {
      await csrf()
      const res = await api.put(`/api/v1/notifications/${id}/read`)
      const updated = res.data?.data as Notification
      setNotifications((cur) => cur.map((n) => (n.id === id ? updated : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch { sileo.error({ title: "Failed to mark as read" }) }
  }

  async function markAllRead() {
    try {
      await csrf()
      await api.post("/api/v1/notifications/mark-all-read")
      const res = await api.get("/api/v1/notifications")
      if (Array.isArray(res.data?.data)) {
        setNotifications(res.data.data)
        setUnreadCount(res.data?.meta?.unread_count ?? 0)
      }
      sileo.success({ title: "All marked as read" })
    } catch { sileo.error({ title: "Failed" }) }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/notifications/${id}`)
      const n = notifications.find((n) => n.id === id)
      if (n && !n.read_at) setUnreadCount((c) => Math.max(0, c - 1))
      setNotifications((cur) => cur.filter((n) => n.id !== id))
      sileo.success({ title: "Notification removed" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read_at) : notifications

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BellIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Notifications</h1>
              <p className="text-sm text-muted-foreground">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheckIcon className="size-4" />
            Mark All Read
          </Button>
        </div>
      </section>

      <div className="flex gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
          All
        </button>
        <button onClick={() => setFilter("unread")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === "unread" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
          Unread ({unreadCount})
        </button>
      </div>

      <section className="space-y-2">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border bg-card p-4 shadow-sm transition-colors ${!n.read_at ? "border-l-4 border-l-primary" : "opacity-75"}`}
            onClick={() => { if (!n.read_at) markAsRead(n.id) }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${typeColors[n.type] ?? typeColors.info}`} />
                  <h3 className="text-sm font-medium">{n.title}</h3>
                  {!n.read_at && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">NEW</span>}
                </div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}>
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{filter === "unread" ? "No unread notifications." : "No notifications."}</p>}
      </section>
    </div>
  )
}
