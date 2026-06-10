"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { MonitorIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormDate, FormField, FormSelect } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const ASSET_CATEGORY_OPTIONS = [
  { value: "laptop", label: "Laptop" },
  { value: "phone", label: "Phone" },
  { value: "monitor", label: "Monitor" },
  { value: "furniture", label: "Furniture" },
  { value: "vehicle", label: "Vehicle" },
  { value: "software", label: "Software" },
  { value: "other", label: "Other" },
]

const schema = z.object({
  name: z.string().min(1, "Required"),
  asset_code: z.string().min(1, "Required"),
  category: z.enum(["laptop", "phone", "monitor", "furniture", "vehicle", "software", "other"]),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})

type AssetFormInput = z.input<typeof schema>
type AssetForm = z.infer<typeof schema>

type Asset = {
  id: number
  name: string
  asset_code: string
  category: string
  status: string
  serial_number: string | null
  purchase_date: string | null
  purchase_cost: string | number
  currency: string
  notes: string | null
  assignee?: { id: number; first_name: string; last_name: string } | null
}

const initialAssets: Asset[] = []

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  assigned: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  maintenance: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  retired: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

export function AssetManagement() {
  const [assets, setAssets] = React.useState<Asset[]>(initialAssets)
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const form = useForm<AssetFormInput, unknown, AssetForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", asset_code: "", category: "laptop", serial_number: "", purchase_date: "", purchase_cost: 0, notes: "" },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/assets")
        if (mounted && Array.isArray(res.data?.data)) setAssets(res.data.data)
      } catch {
        if (mounted) setAssets(initialAssets)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function startEdit(a: Asset) {
    setEditingId(a.id)
    form.reset({ name: a.name, asset_code: a.asset_code, category: a.category as AssetForm["category"], serial_number: a.serial_number ?? "", purchase_date: a.purchase_date ?? "", purchase_cost: Number(a.purchase_cost), notes: a.notes ?? "" })
    setShowForm(true)
  }

  function cancelForm() {
    setEditingId(null)
    form.reset({ name: "", asset_code: "", category: "laptop", serial_number: "", purchase_date: "", purchase_cost: 0, notes: "" })
    setShowForm(false)
  }

  async function onSubmit(values: AssetForm) {
    try {
      await csrf()
      if (editingId) {
        const res = await api.put(`/api/v1/assets/${editingId}`, sanitizePayload(values))
        setAssets((cur) => cur.map((a) => (a.id === editingId ? { ...a, ...res.data?.data } : a)))
        sileo.success({ title: "Asset updated" })
      } else {
        const res = await api.post("/api/v1/assets", sanitizePayload(values))
        setAssets((cur) => [res.data?.data, ...cur])
        sileo.success({ title: "Asset created" })
      }
      cancelForm()
    } catch {
      sileo.error({ title: editingId ? "Update failed" : "Create failed", description: "The asset was not saved to the backend." })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/assets/${id}`)
      setAssets((cur) => cur.filter((a) => a.id !== id))
      sileo.success({ title: "Asset deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <MonitorIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Assets</h1>
              <p className="text-sm text-muted-foreground">Track company assets and equipment</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Asset"}
          </Button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Edit Asset" : "New Asset"}</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormField control={form.control} name="name" label="Name" />
            <FormField control={form.control} name="asset_code" label="Asset Code" disabled={!!editingId} />
            <FormSelect
              control={form.control}
              name="category"
              label="Category"
              options={ASSET_CATEGORY_OPTIONS}
            />
            <FormField control={form.control} name="serial_number" label="Serial Number" />
            <FormDate control={form.control} name="purchase_date" label="Purchase Date" />
            <FormField control={form.control} name="purchase_cost" label="Purchase Cost" type="number" inputMode="decimal" />
            <FormField control={form.control} name="notes" label="Notes" className="md:col-span-2" />
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
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Assigned To</th>
                <th className="p-3 font-medium">Cost</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{a.asset_code}</td>
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 capitalize">{a.category}</td>
                  <td className="p-3 text-muted-foreground">{a.assignee ? `${a.assignee.first_name} ${a.assignee.last_name}` : "—"}</td>
                  <td className="p-3 font-mono">${Number(a.purchase_cost).toLocaleString()}</td>
                  <td className="p-3"><span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusColors[a.status] ?? ""}`}>{a.status}</span></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => startEdit(a)}><PencilIcon className="size-3.5" /></button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(a.id)}><Trash2Icon className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No assets registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
