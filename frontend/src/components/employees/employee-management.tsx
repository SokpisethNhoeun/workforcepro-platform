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
import { DownloadIcon, PlusIcon, SearchIcon, UploadIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormCombobox, FormField, FormSelect } from "@/components/form"
import { api, apiErrorMessage, csrf, sanitizePayload } from "@/lib/api/client"
import { useLookup } from "@/lib/api/lookups"

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "KHR", label: "KHR — Cambodian Riel" },
  { value: "THB", label: "THB — Thai Baht" },
  { value: "VND", label: "VND — Vietnamese Dong" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "GBP", label: "GBP — Pound Sterling" },
]

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "probation", label: "Probation" },
  { value: "suspended", label: "Suspended" },
  { value: "terminated", label: "Terminated" },
]

const employeeSchema = z.object({
  employee_code: z.string().min(2, "Required"),
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  work_email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["active", "probation", "suspended", "terminated"]),
  base_salary: z.coerce.number().min(0),
  salary_currency: z.string().length(3),
  department_id: z.string().optional().or(z.literal("")),
  position_id: z.string().optional().or(z.literal("")),
})

type EmployeeForm = z.infer<typeof employeeSchema>
type EmployeeFormInput = z.input<typeof employeeSchema>

type Employee = EmployeeForm & {
  id: number
  full_name?: string
  department?: { name: string } | null
  position?: { title: string } | null
}

const initialEmployees: Employee[] = []

const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "employee_code",
    header: "Code",
    cell: ({ row }) => <span className="font-medium">{row.original.employee_code}</span>,
  },
  {
    accessorKey: "full_name",
    header: "Employee",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.full_name ?? `${row.original.first_name} ${row.original.last_name}`}</div>
        <div className="text-xs text-muted-foreground">{row.original.work_email}</div>
      </div>
    ),
  },
  {
    accessorFn: (row) => row.department?.name ?? "Unassigned",
    id: "department",
    header: "Department",
  },
  {
    accessorFn: (row) => row.position?.title ?? "Unassigned",
    id: "position",
    header: "Position",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="rounded-md border px-2 py-1 text-xs capitalize">{row.original.status}</span>
    ),
  },
  {
    accessorKey: "base_salary",
    header: "Salary",
    cell: ({ row }) => `${row.original.salary_currency} ${Number(row.original.base_salary).toLocaleString()}`,
  },
]

export function EmployeeManagement() {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const departments = useLookup("departments")

  const form = useForm<EmployeeFormInput, unknown, EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_code: "",
      first_name: "",
      last_name: "",
      work_email: "",
      phone: "",
      status: "active",
      base_salary: 0,
      salary_currency: "USD",
      department_id: "",
      position_id: "",
    },
  })

  const departmentId = form.watch("department_id")
  const positions = useLookup("positions", departmentId ? { department_id: departmentId } : undefined)

  React.useEffect(() => {
    form.setValue("position_id", "")
  }, [departmentId, form])

  const table = useReactTable({
    data: employees,
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

    async function loadEmployees() {
      setIsLoading(true)
      try {
        const response = await api.get("/api/v1/employees")
        if (mounted && Array.isArray(response.data?.data)) {
          setEmployees(response.data.data)
        }
      } catch {
        if (mounted) {
          setEmployees(initialEmployees)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadEmployees()

    return () => {
      mounted = false
    }
  }, [])

  async function onSubmit(values: EmployeeForm) {
    try {
      await csrf()
      const payload = sanitizePayload(values)
      const response = await api.post("/api/v1/employees", payload)
      const employee = response.data?.data as Employee
      setEmployees((current) => [employee, ...current])
      form.reset()
      sileo.success({ title: "Employee saved" })
    } catch (err) {
      sileo.error({ title: "Save failed", description: apiErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Employee Management</h1>
            <p className="text-sm text-muted-foreground">Profiles, contacts, contracts, documents, imports, and exports.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <UploadIcon className="size-4" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <DownloadIcon className="size-4" />
              Export
            </Button>
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
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
                placeholder="Search employees"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${employees.length} records`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                        <button
                          className="inline-flex items-center gap-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : ""}
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
                      No employees match the current filters.
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
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PlusIcon className="size-4" />
            <h2 className="text-sm font-semibold">Create Employee</h2>
          </div>
          <div className="grid gap-3">
            <FormField control={form.control} name="employee_code" label="Employee code" />
            <FormField control={form.control} name="first_name" label="First name" />
            <FormField control={form.control} name="last_name" label="Last name" />
            <FormField control={form.control} name="work_email" label="Work email" type="email" autoComplete="off" />
            <FormField control={form.control} name="phone" label="Phone" type="tel" />
            <FormCombobox
              control={form.control}
              name="department_id"
              label="Department"
              options={departments.options}
              loading={departments.loading}
              placeholder="Select department"
            />
            <FormCombobox
              control={form.control}
              name="position_id"
              label="Position"
              options={positions.options}
              loading={positions.loading}
              placeholder={departmentId ? "Select position" : "Select department first"}
              disabled={!departmentId}
            />
            <FormField control={form.control} name="base_salary" label="Base salary" type="number" inputMode="decimal" />
            <FormSelect
              control={form.control}
              name="salary_currency"
              label="Currency"
              options={CURRENCY_OPTIONS}
            />
            <FormSelect
              control={form.control}
              name="status"
              label="Status"
              options={STATUS_OPTIONS}
            />
            <Button type="submit" className="mt-2">
              <PlusIcon className="size-4" />
              Save employee
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
