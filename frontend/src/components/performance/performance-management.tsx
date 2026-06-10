"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormCombobox, FormField } from "@/components/form"
import { useLookup } from "@/lib/api/lookups"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const schema = z.object({
  employee_id: z.coerce.number().min(1, "Required"),
  period: z.string().min(1, "Required"),
  score: z.coerce.number().min(0).max(100),
  summary: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
})

type PerfFormInput = z.input<typeof schema>
type PerfForm = z.infer<typeof schema>

type PerfReview = {
  id: number
  period: string
  score: string | number
  summary: string | null
  strengths: string | null
  improvements: string | null
  employee?: { id: number; first_name: string; last_name: string } | null
  reviewer?: { id: number; name: string } | null
  created_at: string
}

const initialReviews: PerfReview[] = []

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-yellow-600"
  return "text-red-600"
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-100 dark:bg-green-900"
  if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900"
  return "bg-red-100 dark:bg-red-900"
}

export function PerformanceManagement() {
  const [reviews, setReviews] = React.useState<PerfReview[]>(initialReviews)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const form = useForm<PerfFormInput, unknown, PerfForm>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: "", period: "", score: 0, summary: "", strengths: "", improvements: "" },
  })

  const perfEmployees = useLookup("employees")

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/performance")
        if (mounted && Array.isArray(res.data?.data)) setReviews(res.data.data)
      } catch {
        if (mounted) setReviews(initialReviews)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function startEdit(r: PerfReview) {
    setEditingId(r.id)
    form.reset({ employee_id: r.employee?.id ? String(r.employee.id) : "", period: r.period, score: Number(r.score), summary: r.summary ?? "", strengths: r.strengths ?? "", improvements: r.improvements ?? "" })
    setShowForm(true)
  }

  function cancelForm() {
    setEditingId(null)
    form.reset({ employee_id: "", period: "", score: 0, summary: "", strengths: "", improvements: "" })
    setShowForm(false)
  }

  async function onSubmit(values: PerfForm) {
    try {
      await csrf()
      if (editingId) {
        const res = await api.put(`/api/v1/performance/${editingId}`, sanitizePayload(values))
        setReviews((cur) => cur.map((r) => (r.id === editingId ? { ...r, ...res.data?.data } : r)))
        sileo.success({ title: "Review updated" })
      } else {
        const res = await api.post("/api/v1/performance", sanitizePayload(values))
        setReviews((cur) => [res.data?.data, ...cur])
        sileo.success({ title: "Review created" })
      }
      cancelForm()
    } catch {
      sileo.error({ title: editingId ? "Update failed" : "Create failed", description: "The performance review was not saved to the backend." })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/performance/${id}`)
      setReviews((cur) => cur.filter((r) => r.id !== id))
      sileo.success({ title: "Review deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <StarIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Performance Reviews</h1>
              <p className="text-sm text-muted-foreground">Employee performance evaluations</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Review"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Edit Review" : "New Performance Review"}</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormCombobox
              control={form.control}
              name="employee_id"
              label="Employee"
              options={perfEmployees.options}
              loading={perfEmployees.loading}
              placeholder="Select employee"
            />
            <FormField control={form.control} name="period" label="Period" placeholder="2026-Q1" />
            <FormField control={form.control} name="score" label="Score (0-100)" type="number" inputMode="numeric" />
            <FormField control={form.control} name="summary" label="Summary" />
            <FormField control={form.control} name="strengths" label="Strengths" />
            <FormField control={form.control} name="improvements" label="Areas for Improvement" />
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit">{editingId ? "Update" : "Create"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>}
            </div>
          </form>
        </section>
      )}

      <section className="space-y-3">
        {reviews.map((r) => {
          const score = Number(r.score)
          return (
            <div key={r.id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-12 items-center justify-center rounded-lg ${scoreBg(score)}`}>
                      <span className={`text-lg font-bold ${scoreColor(score)}`}>{score}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : "Employee"}</h3>
                      <p className="text-xs text-muted-foreground">Period: {r.period} · Reviewer: {r.reviewer?.name ?? "—"}</p>
                    </div>
                  </div>
                  {r.summary && <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>}
                  <div className="mt-2 flex gap-4">
                    {r.strengths && (
                      <div>
                        <p className="text-xs font-medium text-green-600">Strengths</p>
                        <p className="text-xs text-muted-foreground">{r.strengths}</p>
                      </div>
                    )}
                    {r.improvements && (
                      <div>
                        <p className="text-xs font-medium text-orange-600">Improvements</p>
                        <p className="text-xs text-muted-foreground">{r.improvements}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => startEdit(r)}><PencilIcon className="size-3.5" /></button>
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(r.id)}><Trash2Icon className="size-3.5" /></button>
                </div>
              </div>
            </div>
          )
        })}
        {reviews.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No performance reviews yet.</p>}
      </section>
    </div>
  )
}
