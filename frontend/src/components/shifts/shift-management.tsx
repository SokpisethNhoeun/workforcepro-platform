"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClockIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormField } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const schema = z.object({
  name: z.string().min(1, "Required"),
  start_time: z.string().min(1, "Required"),
  end_time: z.string().min(1, "Required"),
  break_minutes: z.coerce.number().min(0).default(60),
  is_active: z.boolean().default(true),
})

type ShiftFormInput = z.input<typeof schema>
type ShiftForm = z.infer<typeof schema>

type Shift = {
  id: number
  name: string
  start_time: string
  end_time: string
  break_minutes: number
  days_of_week: string[] | null
  is_active: boolean
}

const initialShifts: Shift[] = []

export function ShiftManagement() {
  const [shifts, setShifts] = React.useState<Shift[]>(initialShifts)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const form = useForm<ShiftFormInput, unknown, ShiftForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", start_time: "08:00", end_time: "17:00", break_minutes: 60, is_active: true },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/shifts")
        if (mounted && Array.isArray(res.data?.data)) setShifts(res.data.data)
      } catch {
        if (mounted) setShifts(initialShifts)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function startEdit(s: Shift) {
    setEditingId(s.id)
    form.reset({ name: s.name, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5), break_minutes: s.break_minutes, is_active: s.is_active })
    setShowForm(true)
  }

  function cancelForm() {
    setEditingId(null)
    form.reset({ name: "", start_time: "08:00", end_time: "17:00", break_minutes: 60, is_active: true })
    setShowForm(false)
  }

  async function onSubmit(values: ShiftForm) {
    try {
      await csrf()
      if (editingId) {
        const res = await api.put(`/api/v1/shifts/${editingId}`, sanitizePayload(values))
        setShifts((cur) => cur.map((s) => (s.id === editingId ? { ...s, ...res.data?.data } : s)))
        sileo.success({ title: "Shift updated" })
      } else {
        const res = await api.post("/api/v1/shifts", sanitizePayload(values))
        setShifts((cur) => [res.data?.data, ...cur])
        sileo.success({ title: "Shift created" })
      }
      cancelForm()
    } catch {
      sileo.error({ title: editingId ? "Update failed" : "Create failed", description: "The shift was not saved to the backend." })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/shifts/${id}`)
      setShifts((cur) => cur.filter((s) => s.id !== id))
      sileo.success({ title: "Shift deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ClockIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Shifts</h1>
              <p className="text-sm text-muted-foreground">Manage work shifts and schedules</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Shift"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Edit Shift" : "New Shift"}</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormField control={form.control} name="name" label="Name" />
            <FormField control={form.control} name="break_minutes" label="Break (min)" type="number" inputMode="numeric" />
            <FormField control={form.control} name="start_time" label="Start Time" type="time" />
            <FormField control={form.control} name="end_time" label="End Time" type="time" />
            <div className="flex items-end gap-2 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 rounded border" {...form.register("is_active")} />
                Active
              </label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit">{editingId ? "Update" : "Create"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>}
            </div>
          </form>
        </section>
      )}

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Start</th>
                <th className="p-3 font-medium">End</th>
                <th className="p-3 font-medium">Break</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 font-mono text-xs">{s.start_time?.slice(0, 5)}</td>
                  <td className="p-3 font-mono text-xs">{s.end_time?.slice(0, 5)}</td>
                  <td className="p-3">{s.break_minutes}m</td>
                  <td className="p-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${s.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => startEdit(s)}><PencilIcon className="size-3.5" /></button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2Icon className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No shifts configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
