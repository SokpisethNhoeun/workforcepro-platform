"use client"

import * as React from "react"
import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { api, csrf } from "@/lib/api/client"

type ApprovalItem = {
  id: number
  type: "leave_request" | "expense"
  title: string
  description: string | null
  status: string
  created_at: string
  meta: Record<string, unknown>
}

const initialItems: ApprovalItem[] = []
const initialMeta = { pending_leaves: 0, pending_expenses: 0, total: 0 }

const typeColors: Record<string, string> = {
  leave_request: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  expense: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
}

export function ApprovalCenter() {
  const [items, setItems] = React.useState<ApprovalItem[]>(initialItems)
  const [meta, setMeta] = React.useState(initialMeta)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/approvals")
        if (mounted && Array.isArray(res.data?.data)) {
          setItems(res.data.data)
          if (res.data?.meta) setMeta(res.data.meta)
        }
      } catch {
        if (mounted) setItems(initialItems)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function handleAction(item: ApprovalItem, action: "approve" | "reject") {
    try {
      await csrf()
      await api.put(`/api/v1/approvals/${item.type}/${item.id}/${action}`)
      setItems((cur) => cur.filter((i) => !(i.id === item.id && i.type === item.type)))
      sileo.success({ title: `${action === "approve" ? "Approved" : "Rejected"}` })
    } catch {
      sileo.error({ title: "Action failed" })
    }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ClockIcon className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Approvals</h1>
            <p className="text-sm text-muted-foreground">Pending items requiring your approval</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-primary">{meta.total}</p>
          <p className="text-xs text-muted-foreground">Total Pending</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{meta.pending_leaves}</p>
          <p className="text-xs text-muted-foreground">Leave Requests</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-purple-600">{meta.pending_expenses}</p>
          <p className="text-xs text-muted-foreground">Expenses</p>
        </div>
      </div>

      <section className="space-y-2">
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${typeColors[item.type] ?? ""}`}>
                    {item.type.replace("_", " ")}
                  </span>
                </div>
                {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  {item.type === "leave_request" && (
                    <>
                      <span>{String(item.meta.start_date)} → {String(item.meta.end_date)}</span>
                      <span>{String(item.meta.total_days)} day(s)</span>
                    </>
                  )}
                  {item.type === "expense" && (
                    <span>${String(item.meta.amount)} {String(item.meta.currency)}</span>
                  )}
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleAction(item, "approve")}>
                  <CheckCircle2Icon className="size-3.5" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction(item, "reject")}>
                  <XCircleIcon className="size-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No pending approvals.</p>}
      </section>
    </div>
  )
}
