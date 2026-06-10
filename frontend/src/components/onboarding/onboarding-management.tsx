"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2Icon, ClipboardListIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormCombobox, FormDate, FormField } from "@/components/form"
import { useLookup } from "@/lib/api/lookups"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const schema = z.object({
  employee_id: z.coerce.number().min(1, "Required"),
  title: z.string().min(1, "Required"),
  due_date: z.string().optional(),
})

type ChecklistFormInput = z.input<typeof schema>
type ChecklistForm = z.infer<typeof schema>

type OnboardingTask = {
  id: number
  title: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
}

type Checklist = {
  id: number
  title: string
  status: string
  due_date: string | null
  completed_at: string | null
  employee?: { id: number; first_name: string; last_name: string } | null
  tasks: OnboardingTask[]
  created_at: string
}

const initialChecklists: Checklist[] = []

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
}

export function OnboardingManagement() {
  const [checklists, setChecklists] = React.useState<Checklist[]>(initialChecklists)
  const [showForm, setShowForm] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<number | null>(null)

  const form = useForm<ChecklistFormInput, unknown, ChecklistForm>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: "", title: "", due_date: "" },
  })

  const onboardingEmployees = useLookup("employees")

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/onboarding")
        if (mounted && Array.isArray(res.data?.data)) setChecklists(res.data.data)
      } catch {
        if (mounted) setChecklists(initialChecklists)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function cancelForm() {
    form.reset({ employee_id: "", title: "", due_date: "" })
    setShowForm(false)
  }

  async function onSubmit(values: ChecklistForm) {
    try {
      await csrf()
      const res = await api.post("/api/v1/onboarding", sanitizePayload(values))
      setChecklists((cur) => [res.data?.data, ...cur])
      sileo.success({ title: "Checklist created" })
      cancelForm()
    } catch {
      sileo.error({ title: "Create failed", description: "The onboarding checklist was not saved to the backend." })
    }
  }

  async function toggleTask(taskId: number, checklistId: number) {
    try {
      await csrf()
      const res = await api.put(`/api/v1/onboarding-tasks/${taskId}/toggle`)
      const updated = res.data?.data as OnboardingTask
      setChecklists((cur) =>
        cur.map((c) =>
          c.id === checklistId
            ? { ...c, tasks: c.tasks.map((t) => (t.id === taskId ? updated : t)) }
            : c
        )
      )
    } catch { sileo.error({ title: "Toggle failed" }) }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/onboarding/${id}`)
      setChecklists((cur) => cur.filter((c) => c.id !== id))
      sileo.success({ title: "Checklist deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ClipboardListIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Onboarding</h1>
              <p className="text-sm text-muted-foreground">Employee onboarding checklists</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Checklist"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">New Onboarding Checklist</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-3">
            <FormCombobox
              control={form.control}
              name="employee_id"
              label="Employee"
              options={onboardingEmployees.options}
              loading={onboardingEmployees.loading}
              placeholder="Select employee"
            />
            <FormField control={form.control} name="title" label="Title" placeholder="New Hire - [Name]" />
            <FormDate control={form.control} name="due_date" label="Due Date" />
            <div className="md:col-span-3">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-3">
        {checklists.map((c) => {
          const completedCount = c.tasks.filter((t) => t.is_completed).length
          const progress = c.tasks.length > 0 ? Math.round((completedCount / c.tasks.length) * 100) : 0
          const isExpanded = expandedId === c.id

          return (
            <div key={c.id} className="rounded-lg border bg-card shadow-sm">
              <div className="flex cursor-pointer items-center justify-between p-4" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{c.title}</h3>
                    <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusColors[c.status] ?? ""}`}>{c.status.replace("_", " ")}</span>
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    {c.employee && <span>{c.employee.first_name} {c.employee.last_name}</span>}
                    {c.due_date && <span>Due: {c.due_date}</span>}
                    <span>{completedCount}/{c.tasks.length} tasks</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="ml-3 flex gap-1">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}><Trash2Icon className="size-3.5" /></button>
                </div>
              </div>

              {isExpanded && c.tasks.length > 0 && (
                <div className="border-t px-4 pb-4 pt-2">
                  <div className="space-y-2">
                    {c.tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 rounded-md border p-2">
                        <button
                          className={`flex size-5 items-center justify-center rounded border ${t.is_completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                          onClick={() => toggleTask(t.id, c.id)}
                        >
                          {t.is_completed && <CheckCircle2Icon className="size-3" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm ${t.is_completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                          {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {checklists.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No onboarding checklists.</p>}
      </section>
    </div>
  )
}
