"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileTextIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormCombobox, FormDate, FormField, FormSelect } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"
import { useLookup } from "@/lib/api/lookups"

const DOCUMENT_TYPE_OPTIONS = [
  { value: "contract", label: "Contract" },
  { value: "id_card", label: "ID Card" },
  { value: "certificate", label: "Certificate" },
  { value: "resume", label: "Resume" },
  { value: "other", label: "Other" },
]

const schema = z.object({
  employee_id: z.coerce.number().min(1, "Required"),
  type: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  file_path: z.string().min(1, "Required"),
  expires_at: z.string().optional(),
})

type DocFormInput = z.input<typeof schema>
type DocForm = z.infer<typeof schema>

type Doc = {
  id: number
  type: string
  title: string
  file_path: string
  mime_type: string | null
  size_bytes: number
  expires_at: string | null
  employee?: { id: number; first_name: string; last_name: string } | null
  uploader?: { id: number; name: string } | null
  created_at: string
}

const initialDocs: Doc[] = []

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentManagement() {
  const [docs, setDocs] = React.useState<Doc[]>(initialDocs)
  const [showForm, setShowForm] = React.useState(false)

  const form = useForm<DocFormInput, unknown, DocForm>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: "", type: "contract", title: "", file_path: "", expires_at: "" },
  })

  const docEmployees = useLookup("employees")

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/documents")
        if (mounted && Array.isArray(res.data?.data)) setDocs(res.data.data)
      } catch {
        if (mounted) setDocs(initialDocs)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function cancelForm() {
    form.reset({ employee_id: "", type: "contract", title: "", file_path: "", expires_at: "" })
    setShowForm(false)
  }

  async function onSubmit(values: DocForm) {
    try {
      await csrf()
      const res = await api.post("/api/v1/documents", sanitizePayload(values))
      setDocs((cur) => [res.data?.data, ...cur])
      sileo.success({ title: "Document uploaded" })
      cancelForm()
    } catch {
      sileo.error({ title: "Upload failed", description: "The document was not saved to the backend." })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/documents/${id}`)
      setDocs((cur) => cur.filter((d) => d.id !== id))
      sileo.success({ title: "Document deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileTextIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Documents</h1>
              <p className="text-sm text-muted-foreground">Employee documents and files</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "Upload Document"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Upload Document</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormCombobox
              control={form.control}
              name="employee_id"
              label="Employee"
              options={docEmployees.options}
              loading={docEmployees.loading}
              placeholder="Select employee"
            />
            <FormSelect
              control={form.control}
              name="type"
              label="Type"
              options={DOCUMENT_TYPE_OPTIONS}
            />
            <FormField control={form.control} name="title" label="Title" />
            <FormField control={form.control} name="file_path" label="File Path" placeholder="/documents/file.pdf" />
            <FormDate control={form.control} name="expires_at" label="Expires At" />
            <div className="flex items-end md:col-span-1">
              <Button type="submit">Upload</Button>
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
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Size</th>
                <th className="p-3 font-medium">Expires</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{d.title}</td>
                  <td className="p-3 capitalize">{d.type.replace("_", " ")}</td>
                  <td className="p-3 text-muted-foreground">{d.employee ? `${d.employee.first_name} ${d.employee.last_name}` : "—"}</td>
                  <td className="p-3 font-mono text-xs">{formatSize(d.size_bytes)}</td>
                  <td className="p-3">{d.expires_at ?? "—"}</td>
                  <td className="p-3 text-right">
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(d.id)}><Trash2Icon className="size-3.5" /></button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No documents uploaded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
