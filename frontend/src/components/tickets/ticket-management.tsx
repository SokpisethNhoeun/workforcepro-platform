"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { LifeBuoyIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormCombobox, FormField, FormSelect, FormTextarea } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"
import { useLookup } from "@/lib/api/lookups"

const TICKET_CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "payroll", label: "Payroll" },
  { value: "benefits", label: "Benefits" },
  { value: "policy", label: "Policy" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
]

const TICKET_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const schema = z.object({
  employee_id: z.coerce.number().min(1, "Required"),
  category: z.enum(["general", "payroll", "benefits", "policy", "complaint", "other"]),
  subject: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
})

type TicketFormInput = z.input<typeof schema>
type TicketForm = z.infer<typeof schema>

type Ticket = {
  id: number
  subject: string
  description: string
  category: string
  priority: string
  status: string
  resolved_at: string | null
  employee?: { id: number; first_name: string; last_name: string } | null
  assignee?: { id: number; name: string } | null
  created_at: string
}

const initialTickets: Ticket[] = []

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

export function TicketManagement() {
  const [tickets, setTickets] = React.useState<Ticket[]>(initialTickets)
  const [showForm, setShowForm] = React.useState(false)
  const [filter, setFilter] = React.useState("all")

  const form = useForm<TicketFormInput, unknown, TicketForm>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: "", category: "general", subject: "", description: "", priority: "medium" },
  })

  const ticketEmployees = useLookup("employees")

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/hr-tickets")
        if (mounted && Array.isArray(res.data?.data)) setTickets(res.data.data)
      } catch {
        if (mounted) setTickets(initialTickets)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function cancelForm() {
    form.reset({ employee_id: "", category: "general", subject: "", description: "", priority: "medium" })
    setShowForm(false)
  }

  async function onSubmit(values: TicketForm) {
    try {
      await csrf()
      const res = await api.post("/api/v1/hr-tickets", sanitizePayload(values))
      setTickets((cur) => [res.data?.data, ...cur])
      sileo.success({ title: "Ticket created" })
      cancelForm()
    } catch {
      sileo.error({ title: "Create failed", description: "The ticket was not saved to the backend." })
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await csrf()
      const res = await api.put(`/api/v1/hr-tickets/${id}`, { status })
      const updated = res.data?.data as Ticket
      setTickets((cur) => cur.map((t) => (t.id === id ? updated : t)))
      sileo.success({ title: "Status updated" })
    } catch { sileo.error({ title: "Update failed" }) }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/hr-tickets/${id}`)
      setTickets((cur) => cur.filter((t) => t.id !== id))
      sileo.success({ title: "Ticket deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter)

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LifeBuoyIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">HR Tickets</h1>
              <p className="text-sm text-muted-foreground">Employee support requests</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Ticket"}
          </Button>
        </div>
      </section>

      <div className="flex gap-2">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">New Ticket</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormCombobox
              control={form.control}
              name="employee_id"
              label="Employee"
              options={ticketEmployees.options}
              loading={ticketEmployees.loading}
              placeholder="Select employee"
            />
            <FormSelect
              control={form.control}
              name="category"
              label="Category"
              options={TICKET_CATEGORY_OPTIONS}
            />
            <FormSelect
              control={form.control}
              name="priority"
              label="Priority"
              options={TICKET_PRIORITY_OPTIONS}
            />
            <FormField control={form.control} name="subject" label="Subject" />
            <FormTextarea
              control={form.control}
              name="description"
              label="Description"
              className="md:col-span-2"
            />
            <div className="md:col-span-2">
              <Button type="submit">Submit Ticket</Button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Priority</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{t.subject}</td>
                  <td className="p-3 text-muted-foreground">{t.employee ? `${t.employee.first_name} ${t.employee.last_name}` : "—"}</td>
                  <td className="p-3 capitalize">{t.category}</td>
                  <td className="p-3"><span className={`rounded-md px-2 py-0.5 text-xs capitalize ${priorityColors[t.priority] ?? ""}`}>{t.priority}</span></td>
                  <td className="p-3">
                    <select
                      value={t.status}
                      onChange={(e) => updateStatus(t.id, e.target.value)}
                      className={`rounded-md border-0 px-2 py-0.5 text-xs font-medium ${statusColors[t.status] ?? ""}`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2Icon className="size-3.5" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No tickets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
