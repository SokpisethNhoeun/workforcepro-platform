"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckSquareIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormDate, FormField, FormSelect, FormTextarea } from "@/components/form"

const TASK_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const TASK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]
import { api, apiErrorMessage, csrf, sanitizePayload } from "@/lib/api/client"

const schema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  due_date: z.string().optional(),
})

type TaskForm = z.infer<typeof schema>

type Task = {
  id: number
  title: string
  description: string | null
  priority: string
  status: string
  due_date: string | null
  completed_at: string | null
  assignee?: { id: number; first_name: string; last_name: string } | null
  assigner?: { id: number; name: string } | null
  created_at: string
}

const initialTasks: Task[] = []

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

export function TaskManagement() {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [filter, setFilter] = React.useState("all")

  const form = useForm<TaskForm>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", priority: "medium", status: "pending", due_date: "" },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/tasks")
        if (mounted && Array.isArray(res.data?.data)) setTasks(res.data.data)
      } catch {
        if (mounted) setTasks(initialTasks)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function cancelForm() {
    setEditingId(null)
    form.reset({ title: "", description: "", priority: "medium", status: "pending", due_date: "" })
    setShowForm(false)
  }

  function startEdit(t: Task) {
    setEditingId(t.id)
    form.reset({ title: t.title, description: t.description ?? "", priority: t.priority as TaskForm["priority"], status: t.status as TaskForm["status"], due_date: t.due_date ?? "" })
    setShowForm(true)
  }

  async function onSubmit(values: TaskForm) {
    try {
      await csrf()
      const payload = sanitizePayload(values)
      if (editingId) {
        const res = await api.put(`/api/v1/tasks/${editingId}`, payload)
        setTasks((cur) => cur.map((t) => (t.id === editingId ? { ...t, ...res.data?.data } : t)))
        sileo.success({ title: "Task updated" })
      } else {
        const res = await api.post("/api/v1/tasks", payload)
        setTasks((cur) => [res.data?.data, ...cur])
        sileo.success({ title: "Task created" })
      }
      cancelForm()
    } catch (err) {
      sileo.error({ title: editingId ? "Update failed" : "Create failed", description: apiErrorMessage(err) })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/tasks/${id}`)
      setTasks((cur) => cur.filter((t) => t.id !== id))
      sileo.success({ title: "Task deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <CheckSquareIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Tasks</h1>
              <p className="text-sm text-muted-foreground">Track and manage work assignments</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Task"}
          </Button>
        </div>
      </section>

      <div className="flex gap-2">
        {["all", "pending", "in_progress", "completed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Edit Task" : "New Task"}</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormField control={form.control} name="title" label="Title" className="md:col-span-2" />
            <FormTextarea control={form.control} name="description" label="Description" className="md:col-span-2" />
            <FormSelect
              control={form.control}
              name="priority"
              label="Priority"
              options={TASK_PRIORITY_OPTIONS}
            />
            <FormDate control={form.control} name="due_date" label="Due Date" />
            {editingId && (
              <FormSelect
                control={form.control}
                name="status"
                label="Status"
                options={TASK_STATUS_OPTIONS}
              />
            )}
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit">{editingId ? "Update" : "Create"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>}
            </div>
          </form>
        </section>
      )}

      <section className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</h3>
                <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${priorityColors[t.priority] ?? ""}`}>{t.priority}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusColors[t.status] ?? ""}`}>{t.status.replace("_", " ")}</span>
              </div>
              {t.description && <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>}
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                {t.due_date && <span>Due: {t.due_date}</span>}
                {t.assigner && <span>By: {t.assigner.name}</span>}
              </div>
            </div>
            <div className="flex gap-1">
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => startEdit(t)}><PencilIcon className="size-3.5" /></button>
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2Icon className="size-3.5" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No tasks found.</p>}
      </section>
    </div>
  )
}
