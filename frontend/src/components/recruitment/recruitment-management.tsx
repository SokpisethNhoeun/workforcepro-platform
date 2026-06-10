"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { BriefcaseIcon, PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormDate, FormField, FormSelect, FormTextarea } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
]

const POSTING_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "filled", label: "Filled" },
]

const postingSchema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  requirements: z.string().optional(),
  employment_type: z.enum(["full_time", "part_time", "contract", "internship"]),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  status: z.enum(["draft", "open", "closed", "filled"]),
  closes_at: z.string().optional(),
})

type PostingFormInput = z.input<typeof postingSchema>
type PostingForm = z.infer<typeof postingSchema>

type JobPosting = {
  id: number
  title: string
  description: string | null
  requirements: string | null
  employment_type: string
  salary_min: string | number | null
  salary_max: string | number | null
  status: string
  closes_at: string | null
  applications_count?: number
  department?: { id: number; name: string } | null
  created_at: string
}

const initialPostings: JobPosting[] = []

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  open: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  closed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  filled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
}

export function RecruitmentManagement() {
  const [postings, setPostings] = React.useState<JobPosting[]>(initialPostings)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const form = useForm<PostingFormInput, unknown, PostingForm>({
    resolver: zodResolver(postingSchema),
    defaultValues: { title: "", description: "", requirements: "", employment_type: "full_time", salary_min: 0, salary_max: 0, status: "draft", closes_at: "" },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/job-postings")
        if (mounted && Array.isArray(res.data?.data)) setPostings(res.data.data)
      } catch {
        if (mounted) setPostings(initialPostings)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function startEdit(p: JobPosting) {
    setEditingId(p.id)
    form.reset({
      title: p.title,
      description: p.description ?? "",
      requirements: p.requirements ?? "",
      employment_type: p.employment_type as PostingForm["employment_type"],
      salary_min: Number(p.salary_min) || 0,
      salary_max: Number(p.salary_max) || 0,
      status: p.status as PostingForm["status"],
      closes_at: p.closes_at ?? "",
    })
    setShowForm(true)
  }

  function cancelForm() {
    setEditingId(null)
    form.reset({ title: "", description: "", requirements: "", employment_type: "full_time", salary_min: 0, salary_max: 0, status: "draft", closes_at: "" })
    setShowForm(false)
  }

  async function onSubmit(values: PostingForm) {
    try {
      await csrf()
      if (editingId) {
        const res = await api.put(`/api/v1/job-postings/${editingId}`, sanitizePayload(values))
        setPostings((cur) => cur.map((p) => (p.id === editingId ? { ...p, ...res.data?.data } : p)))
        sileo.success({ title: "Job posting updated" })
      } else {
        const res = await api.post("/api/v1/job-postings", sanitizePayload(values))
        setPostings((cur) => [res.data?.data, ...cur])
        sileo.success({ title: "Job posting created" })
      }
      cancelForm()
    } catch {
      sileo.error({ title: editingId ? "Update failed" : "Create failed", description: "The job posting was not saved to the backend." })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/job-postings/${id}`)
      setPostings((cur) => cur.filter((p) => p.id !== id))
      sileo.success({ title: "Job posting deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BriefcaseIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Recruitment</h1>
              <p className="text-sm text-muted-foreground">Manage job postings and applications</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Posting"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Edit Posting" : "New Job Posting"}</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormField control={form.control} name="title" label="Job Title" className="md:col-span-2" />
            <FormTextarea
              control={form.control}
              name="description"
              label="Description"
              className="md:col-span-2"
            />
            <FormTextarea
              control={form.control}
              name="requirements"
              label="Requirements"
              rows={2}
              className="md:col-span-2"
            />
            <FormSelect
              control={form.control}
              name="employment_type"
              label="Type"
              options={EMPLOYMENT_TYPE_OPTIONS}
            />
            <FormSelect
              control={form.control}
              name="status"
              label="Status"
              options={POSTING_STATUS_OPTIONS}
            />
            <FormField control={form.control} name="salary_min" label="Salary Min ($)" type="number" inputMode="numeric" />
            <FormField control={form.control} name="salary_max" label="Salary Max ($)" type="number" inputMode="numeric" />
            <FormDate control={form.control} name="closes_at" label="Closes At" />
            <div className="flex items-end gap-2">
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
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Department</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Salary Range</th>
                <th className="p-3 font-medium">Apps</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {postings.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 text-muted-foreground">{p.department?.name ?? "—"}</td>
                  <td className="p-3 capitalize">{p.employment_type.replace("_", " ")}</td>
                  <td className="p-3 font-mono text-xs">
                    {p.salary_min || p.salary_max
                      ? `$${Number(p.salary_min || 0).toLocaleString()} - $${Number(p.salary_max || 0).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="size-3 text-muted-foreground" />
                      {p.applications_count ?? 0}
                    </div>
                  </td>
                  <td className="p-3"><span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusColors[p.status] ?? ""}`}>{p.status}</span></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => startEdit(p)}><PencilIcon className="size-3.5" /></button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2Icon className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {postings.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No job postings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
