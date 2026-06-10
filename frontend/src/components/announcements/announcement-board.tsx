"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { MegaphoneIcon, PencilIcon, PinIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormField, FormSelect, FormTextarea } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const ANNOUNCEMENT_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const schema = z.object({
  title: z.string().min(2, "Required"),
  body: z.string().min(1, "Required"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  is_pinned: z.boolean().optional(),
})

type AnnouncementForm = z.infer<typeof schema>

type Announcement = {
  id: number
  title: string
  body: string
  priority: string
  is_pinned: boolean
  published_at: string | null
  expires_at: string | null
  author?: { id: number; name: string } | null
  created_at: string
}

const initialAnnouncements: Announcement[] = []

const priorityColors: Record<string, string> = {
  urgent: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  high: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
  normal: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  low: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
}

export function AnnouncementBoard() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(initialAnnouncements)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const form = useForm<AnnouncementForm>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", priority: "normal", is_pinned: false },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await api.get("/api/v1/announcements")
        if (mounted && Array.isArray(res.data?.data)) setAnnouncements(res.data.data)
      } catch {
        if (mounted) setAnnouncements(initialAnnouncements)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function startEdit(a: Announcement) {
    setEditingId(a.id)
    form.reset({ title: a.title, body: a.body, priority: a.priority as AnnouncementForm["priority"], is_pinned: a.is_pinned })
    setShowForm(true)
  }

  function cancelForm() {
    setEditingId(null)
    form.reset({ title: "", body: "", priority: "normal", is_pinned: false })
    setShowForm(false)
  }

  async function onSubmit(values: AnnouncementForm) {
    try {
      await csrf()
      if (editingId) {
        const res = await api.put(`/api/v1/announcements/${editingId}`, sanitizePayload(values))
        const updated = res.data?.data as Announcement
        setAnnouncements((cur) => cur.map((a) => (a.id === editingId ? { ...a, ...updated } : a)))
        sileo.success({ title: "Announcement updated" })
      } else {
        const res = await api.post("/api/v1/announcements", sanitizePayload(values))
        const created = res.data?.data as Announcement
        setAnnouncements((cur) => [created, ...cur])
        sileo.success({ title: "Announcement published" })
      }
      cancelForm()
    } catch {
      sileo.error({ title: editingId ? "Update failed" : "Publish failed", description: "The announcement was not saved to the backend." })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/announcements/${id}`)
      setAnnouncements((cur) => cur.filter((a) => a.id !== id))
      sileo.success({ title: "Announcement deleted" })
    } catch {
      sileo.error({ title: "Delete failed" })
    }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <MegaphoneIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Announcements</h1>
              <p className="text-sm text-muted-foreground">Company-wide announcements and updates</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Announcement"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Edit Announcement" : "New Announcement"}</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
            <FormField control={form.control} name="title" label="Title" />
            <FormTextarea control={form.control} name="body" label="Body" rows={4} />
            <div className="flex gap-3">
              <FormSelect
                control={form.control}
                name="priority"
                label="Priority"
                options={ANNOUNCEMENT_PRIORITY_OPTIONS}
                className="flex-1"
              />
              <label className="flex items-end gap-2 pb-1 text-sm">
                <input type="checkbox" className="size-4 rounded border" {...form.register("is_pinned")} />
                Pin to top
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Update" : "Publish"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>}
            </div>
          </form>
        </section>
      )}

      <section className="space-y-3">
        {isLoading && <p className="text-center text-sm text-muted-foreground">Loading...</p>}
        {announcements.map((a) => (
          <div key={a.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {a.is_pinned && <PinIcon className="size-3.5 text-primary" />}
                  <h3 className="font-semibold">{a.title}</h3>
                  <span className={`rounded-md border px-2 py-0.5 text-xs capitalize ${priorityColors[a.priority] ?? priorityColors.normal}`}>
                    {a.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  <span>By {a.author?.name ?? "Unknown"}</span>
                  <span>{a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => startEdit(a)}>
                  <PencilIcon className="size-3.5" />
                </button>
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && announcements.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No announcements yet.</p>
        )}
      </section>
    </div>
  )
}
