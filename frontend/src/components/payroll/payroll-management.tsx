"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { BadgeDollarSignIcon, EyeIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormDate, FormField, FormSelect } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const PAYROLL_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "KHR", label: "KHR" },
  { value: "EUR", label: "EUR" },
  { value: "THB", label: "THB" },
]

const schema = z.object({
  period: z.string().min(1, "Required"),
  run_date: z.string().min(1, "Required"),
  currency: z.string().min(1, "Required"),
  notes: z.string().optional(),
})

type PayrollForm = {
  period: string
  run_date: string
  currency: string
  notes?: string
}

type PayrollRun = {
  id: number
  period: string
  run_date: string
  status: string
  total_amount: string | number
  currency: string
  notes: string | null
  payslips_count?: number
}

const initialRuns: PayrollRun[] = []

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  processing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function PayrollManagement() {
  const [runs, setRuns] = React.useState<PayrollRun[]>(initialRuns)
  const [showForm, setShowForm] = React.useState(false)
  const [selectedRun, setSelectedRun] = React.useState<PayrollRun | null>(null)

  const form = useForm<PayrollForm>({
    resolver: zodResolver(schema),
    defaultValues: { period: "", run_date: "", currency: "USD", notes: "" },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/payroll")
        if (mounted && Array.isArray(res.data?.data)) setRuns(res.data.data)
      } catch {
        if (mounted) setRuns(initialRuns)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function cancelForm() {
    form.reset({ period: "", run_date: "", currency: "USD", notes: "" })
    setShowForm(false)
  }

  async function onSubmit(values: PayrollForm) {
    try {
      await csrf()
      const res = await api.post("/api/v1/payroll", sanitizePayload(values))
      setRuns((cur) => [res.data?.data, ...cur])
      sileo.success({ title: "Payroll run created" })
      cancelForm()
    } catch {
      sileo.error({ title: "Create failed", description: "The payroll run was not saved to the backend." })
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await csrf()
      const res = await api.put(`/api/v1/payroll/${id}`, { status })
      const updated = res.data?.data as PayrollRun
      setRuns((cur) => cur.map((r) => (r.id === id ? updated : r)))
      sileo.success({ title: "Status updated" })
    } catch { sileo.error({ title: "Update failed" }) }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/payroll/${id}`)
      setRuns((cur) => cur.filter((r) => r.id !== id))
      sileo.success({ title: "Payroll run deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  async function handleProcess(id: number) {
    try {
      await csrf()
      const res = await api.post(`/api/v1/payroll/${id}/process`)
      setRuns((cur) => cur.map((r) => (r.id === id ? res.data?.data : r)))
      sileo.success({ title: "Payroll processed successfully" })
    } catch { sileo.error({ title: "Processing failed" }) }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BadgeDollarSignIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Payroll</h1>
              <p className="text-sm text-muted-foreground">Manage payroll runs and payslips</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Run"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">New Payroll Run</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormField control={form.control} name="period" label="Period (YYYY-MM)" placeholder="2026-06" />
            <FormDate control={form.control} name="run_date" label="Run Date" />
            <FormSelect
              control={form.control}
              name="currency"
              label="Currency"
              options={PAYROLL_CURRENCY_OPTIONS}
            />
            <FormField control={form.control} name="notes" label="Notes" />
            <div className="md:col-span-2">
              <Button type="submit">Create Run</Button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Period</th>
                <th className="p-3 font-medium">Run Date</th>
                <th className="p-3 font-medium">Employees</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono font-medium">{r.period}</td>
                  <td className="p-3">{r.run_date}</td>
                  <td className="p-3">{r.payslips_count ?? 0}</td>
                  <td className="p-3 font-mono">${Number(r.total_amount).toLocaleString()}</td>
                  <td className="p-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className={`rounded-md border-0 px-2 py-0.5 text-xs font-medium ${statusColors[r.status] ?? ""}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {r.status === "draft" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                          onClick={() => handleProcess(r.id)}
                        >
                          Process
                        </Button>
                      )}
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setSelectedRun(r)}><EyeIcon className="size-3.5" /></button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(r.id)}><Trash2Icon className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payroll runs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRun && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Payroll: {selectedRun.period}</h2>
            <Button size="sm" variant="outline" onClick={() => setSelectedRun(null)}>Close</Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Period</p>
              <p className="font-mono font-medium">{selectedRun.period}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="font-mono font-medium">${Number(selectedRun.total_amount).toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="font-medium">{selectedRun.payslips_count ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{selectedRun.status}</p>
            </div>
          </div>
          {selectedRun.notes && <p className="mt-2 text-sm text-muted-foreground">{selectedRun.notes}</p>}
        </section>
      )}
    </div>
  )
}
