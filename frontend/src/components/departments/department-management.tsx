"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2Icon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormTextarea } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"

const departmentSchema = z.object({
  name: z.string().min(2, "Required"),
  code: z.string().min(1, "Required").max(40),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
})

type DepartmentForm = z.infer<typeof departmentSchema>

type Department = {
  id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
  employees_count: number
  manager?: { name: string } | null
}

const initialDepartments: Department[] = []

export function DepartmentManagement() {
  const [departments, setDepartments] = React.useState<Department[]>(initialDepartments)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const form = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", code: "", description: "", is_active: true },
  })

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.manager?.name ?? "Unassigned",
      id: "manager",
      header: "Manager",
    },
    {
      accessorKey: "employees_count",
      header: "Employees",
      cell: ({ row }) => row.original.employees_count,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span className={`rounded-md border px-2 py-1 text-xs ${row.original.is_active ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400" : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"}`}>
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => startEdit(row.original)}
          >
            <PencilIcon className="size-3.5" />
          </button>
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: departments,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const response = await api.get("/api/v1/departments")
        if (mounted && Array.isArray(response.data?.data)) {
          setDepartments(response.data.data)
        }
      } catch {
        if (mounted) setDepartments(initialDepartments)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function startEdit(dept: Department) {
    setEditingId(dept.id)
    form.reset({ name: dept.name, code: dept.code, description: dept.description ?? "", is_active: dept.is_active })
  }

  function cancelEdit() {
    setEditingId(null)
    form.reset({ name: "", code: "", description: "", is_active: true })
  }

  async function onSubmit(values: DepartmentForm) {
    try {
      await csrf()
      if (editingId) {
        const response = await api.put(`/api/v1/departments/${editingId}`, sanitizePayload(values))
        const updated = response.data?.data as Department
        setDepartments((cur) => cur.map((d) => (d.id === editingId ? { ...d, ...updated } : d)))
        sileo.success({ title: "Department updated" })
      } else {
        const response = await api.post("/api/v1/departments", sanitizePayload(values))
        const created = response.data?.data as Department
        setDepartments((cur) => [{ ...created, employees_count: 0 }, ...cur])
        sileo.success({ title: "Department created" })
      }
      cancelEdit()
    } catch {
      sileo.error({ title: editingId ? "Update failed" : "Create failed", description: "The department was not saved to the backend." })
    }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/departments/${id}`)
      setDepartments((cur) => cur.filter((d) => d.id !== id))
      sileo.success({ title: "Department deleted" })
    } catch {
      sileo.error({ title: "Delete failed" })
    }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2Icon className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Department Management</h1>
            <p className="text-sm text-muted-foreground">Manage company departments, assign managers, and track headcount.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
                placeholder="Search departments"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${departments.length} departments`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                        <button className="inline-flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                        </button>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No departments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm">
            <span className="text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlusIcon className="size-4" />
              <h2 className="text-sm font-semibold">{editingId ? "Edit Department" : "Create Department"}</h2>
            </div>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
            )}
          </div>
          <div className="grid gap-3">
            <FormField control={form.control} name="name" label="Department name" />
            <FormField control={form.control} name="code" label="Code" />
            <FormTextarea control={form.control} name="description" label="Description" rows={2} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 rounded border" {...form.register("is_active")} />
              Active
            </label>
            <Button type="submit" className="mt-2">
              <PlusIcon className="size-4" />
              {editingId ? "Update department" : "Save department"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
