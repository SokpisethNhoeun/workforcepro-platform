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
import {
  DownloadIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormCombobox, FormField, FormSelect } from "@/components/form"
import { api, apiErrorMessage, csrf, sanitizePayload } from "@/lib/api/client"
import { useLookup } from "@/lib/api/lookups"
import { useAuth } from "@/lib/auth/auth-context"

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
  department?: { id?: number; name: string } | null
  position?: { id?: number; title: string } | null
  user?: {
    id: number
    name?: string | null
    email?: string | null
    roles?: string[]
  } | null
}

const initialEmployees: Employee[] = []
type RoleRecord = {
  id: number
  name: string
}

export function EmployeeManagement() {
  const auth = useAuth()
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees)
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null)
  const [editingEmployeeId, setEditingEmployeeId] = React.useState<number | null>(null)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [deletingEmployeeId, setDeletingEmployeeId] = React.useState<number | null>(null)
  const [roles, setRoles] = React.useState<RoleRecord[]>([])
  const [updatingRoleUserId, setUpdatingRoleUserId] = React.useState<number | null>(null)
  const importInputRef = React.useRef<HTMLInputElement | null>(null)
  const departments = useLookup("departments")
  const canAssignRoles = auth.hasPermission("roles.assign")
  const canCreateEmployees = auth.hasPermission("employees.create")
  const canUpdateEmployees = auth.hasPermission("employees.update")
  const canDeleteEmployees = auth.hasPermission("employees.delete")
  const canImportEmployees = auth.hasPermission("employees.import")
  const canExportEmployees = auth.hasPermission("employees.export")

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

  function employeeFormValues(employee: Employee): EmployeeFormInput {
    return {
      employee_code: employee.employee_code ?? "",
      first_name: employee.first_name ?? "",
      last_name: employee.last_name ?? "",
      work_email: employee.work_email ?? "",
      phone: employee.phone ?? "",
      status: employee.status ?? "active",
      base_salary: Number(employee.base_salary ?? 0),
      salary_currency: employee.salary_currency ?? "USD",
      department_id: employee.department?.id ? String(employee.department.id) : "",
      position_id: employee.position?.id ? String(employee.position.id) : "",
    }
  }

  async function fetchEmployee(id: number) {
    const response = await api.get(`/api/v1/employees/${id}`)
    return response.data?.data as Employee
  }

  function upsertEmployee(employee: Employee) {
    setEmployees((current) => {
      const exists = current.some((item) => item.id === employee.id)
      return exists
        ? current.map((item) => (item.id === employee.id ? { ...item, ...employee } : item))
        : [employee, ...current]
    })
  }

  function cancelEdit() {
    setEditingEmployeeId(null)
    form.reset()
  }

  async function viewEmployee(employee: Employee) {
    try {
      const fullEmployee = await fetchEmployee(employee.id)
      setSelectedEmployee(fullEmployee)
      upsertEmployee(fullEmployee)
    } catch (error) {
      sileo.error({ title: "Employee details failed", description: apiErrorMessage(error) })
    }
  }

  async function startEdit(employee: Employee) {
    if (!canUpdateEmployees) return

    try {
      const fullEmployee = await fetchEmployee(employee.id)
      setEditingEmployeeId(fullEmployee.id)
      setSelectedEmployee(fullEmployee)
      form.reset(employeeFormValues(fullEmployee))
      upsertEmployee(fullEmployee)
    } catch (error) {
      sileo.error({ title: "Edit failed", description: apiErrorMessage(error) })
    }
  }

  async function deleteEmployee(employee: Employee) {
    if (!canDeleteEmployees) return
    const employeeName = employee.full_name ?? `${employee.first_name} ${employee.last_name}`

    if (!window.confirm(`Delete ${employeeName}? This cannot be undone.`)) {
      return
    }

    setDeletingEmployeeId(employee.id)
    try {
      await api.delete(`/api/v1/employees/${employee.id}`)
      setEmployees((current) => current.filter((item) => item.id !== employee.id))
      setSelectedEmployee((current) => (current?.id === employee.id ? null : current))
      if (editingEmployeeId === employee.id) {
        cancelEdit()
      }
      sileo.success({ title: "Employee deleted", description: `${employeeName} was removed.` })
    } catch (error) {
      sileo.error({ title: "Delete failed", description: apiErrorMessage(error) })
    } finally {
      setDeletingEmployeeId(null)
    }
  }

  async function updateUserRole(employee: Employee, role: string) {
    if (!employee.user?.id || !role) return

    setUpdatingRoleUserId(employee.user.id)
    try {
      await api.put(`/api/v1/users/${employee.user.id}/roles`, { roles: [role] })
      setEmployees((current) =>
        current.map((item) =>
          item.id === employee.id && item.user
            ? { ...item, user: { ...item.user, roles: [role] } }
            : item
        )
      )
      sileo.success({ title: "Role updated", description: `${employee.full_name ?? "User"} is now ${role}.` })
    } catch (error) {
      sileo.error({ title: "Role update failed", description: apiErrorMessage(error) })
    } finally {
      setUpdatingRoleUserId(null)
    }
  }

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
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const employee = row.original
        const currentRole = employee.user?.roles?.[0] ?? ""

        if (!employee.user?.id) {
          return <span className="text-xs text-muted-foreground">No account</span>
        }

        if (!canAssignRoles) {
          return <span className="rounded-md border px-2 py-1 text-xs">{currentRole || "Unassigned"}</span>
        }

        return (
          <select
            value={currentRole}
            disabled={updatingRoleUserId === employee.user.id || roles.length === 0}
            onChange={(event) => void updateUserRole(employee, event.target.value)}
            className="h-8 min-w-28 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
          >
            {!currentRole ? <option value="">Select role</option> : null}
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        )
      },
    },
    {
      accessorKey: "base_salary",
      header: "Salary",
      cell: ({ row }) => {
        if (row.original.base_salary === undefined || row.original.salary_currency === undefined) {
          return <span className="text-muted-foreground">Restricted</span>
        }

        return `${row.original.salary_currency} ${Number(row.original.base_salary).toLocaleString()}`
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const employee = row.original

        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="View employee"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => void viewEmployee(employee)}
            >
              <EyeIcon className="size-3.5" />
            </button>
            {canUpdateEmployees ? (
              <button
                type="button"
                aria-label="Edit employee"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => void startEdit(employee)}
              >
                <PencilIcon className="size-3.5" />
              </button>
            ) : null}
            {canDeleteEmployees ? (
              <button
                type="button"
                aria-label="Delete employee"
                disabled={deletingEmployeeId === employee.id}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                onClick={() => void deleteEmployee(employee)}
              >
                <Trash2Icon className="size-3.5" />
              </button>
            ) : null}
          </div>
        )
      },
    },
  ]

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

  React.useEffect(() => {
    if (!canAssignRoles) {
      setRoles([])
      return
    }

    let mounted = true

    async function loadRoles() {
      try {
        const response = await api.get("/api/v1/roles")
        if (mounted && Array.isArray(response.data?.data)) {
          setRoles(response.data.data)
        }
      } catch {
        if (mounted) {
          setRoles([])
        }
      }
    }

    void loadRoles()

    return () => {
      mounted = false
    }
  }, [canAssignRoles])

  async function refreshEmployees() {
    setIsLoading(true)
    try {
      const response = await api.get("/api/v1/employees")
      if (Array.isArray(response.data?.data)) {
        setEmployees(response.data.data)
      }
    } catch (error) {
      sileo.error({ title: "Load failed", description: apiErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(values: EmployeeForm) {
    if (editingEmployeeId && !canUpdateEmployees) return
    if (!editingEmployeeId && !canCreateEmployees) return

    setIsSaving(true)
    try {
      await csrf()
      const payload = sanitizePayload(values)
      const response = editingEmployeeId
        ? await api.put(`/api/v1/employees/${editingEmployeeId}`, payload)
        : await api.post("/api/v1/employees", payload)
      const employee = response.data?.data as Employee
      upsertEmployee(employee)
      setSelectedEmployee(employee)
      cancelEdit()
      sileo.success({ title: editingEmployeeId ? "Employee updated" : "Employee saved" })
    } catch (err) {
      sileo.error({ title: "Save failed", description: apiErrorMessage(err) })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !canImportEmployees) return

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      await api.post("/api/v1/employees/import", formData)
      await refreshEmployees()
      sileo.success({ title: "Employees imported", description: `${file.name} was uploaded.` })
    } catch (error) {
      sileo.error({ title: "Import failed", description: apiErrorMessage(error) })
    } finally {
      setIsImporting(false)
    }
  }

  async function handleExport() {
    if (!canExportEmployees) return

    setIsExporting(true)
    try {
      const response = await api.get("/api/v1/employees/export", { responseType: "blob" })
      const contentType = response.headers["content-type"]
      const blob = new Blob([response.data], {
        type: typeof contentType === "string" ? contentType : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const dispositionHeader = response.headers["content-disposition"]
      const disposition = typeof dispositionHeader === "string" ? dispositionHeader : undefined
      const fileName = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? "employees.xlsx"
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
      sileo.success({ title: "Export ready", description: `${fileName} downloaded.` })
    } catch (error) {
      sileo.error({ title: "Export failed", description: apiErrorMessage(error) })
    } finally {
      setIsExporting(false)
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
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(event) => void handleImportFile(event)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!canImportEmployees || isImporting}
              onClick={() => importInputRef.current?.click()}
            >
              <UploadIcon className="size-4" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canExportEmployees || isExporting}
              onClick={() => void handleExport()}
            >
              <DownloadIcon className="size-4" />
              {isExporting ? "Exporting..." : "Export"}
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
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PlusIcon className="size-4" />
              <h2 className="text-sm font-semibold">{editingEmployeeId ? "Edit Employee" : "Create Employee"}</h2>
            </div>
            {editingEmployeeId ? (
              <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                <XIcon className="size-4" />
                Cancel
              </Button>
            ) : null}
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
            <Button type="submit" className="mt-2" disabled={isSaving || (!editingEmployeeId && !canCreateEmployees)}>
              <PlusIcon className="size-4" />
              {isSaving ? "Saving..." : editingEmployeeId ? "Update employee" : "Save employee"}
            </Button>
          </div>
        </form>
      </section>

      {selectedEmployee ? (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{selectedEmployee.full_name ?? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`}</h2>
              <p className="text-sm text-muted-foreground">{selectedEmployee.employee_code}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)}>
              <XIcon className="size-4" />
              Close
            </Button>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="font-medium">{selectedEmployee.work_email || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="font-medium">{selectedEmployee.phone || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Department</dt>
              <dd className="font-medium">{selectedEmployee.department?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Position</dt>
              <dd className="font-medium">{selectedEmployee.position?.title ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">{selectedEmployee.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Salary</dt>
              <dd className="font-medium">
                {selectedEmployee.base_salary === undefined || selectedEmployee.salary_currency === undefined
                  ? "Restricted"
                  : `${selectedEmployee.salary_currency} ${Number(selectedEmployee.base_salary).toLocaleString()}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Account</dt>
              <dd className="font-medium">{selectedEmployee.user?.email ?? "No account"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Role</dt>
              <dd className="font-medium">{selectedEmployee.user?.roles?.[0] ?? "Unassigned"}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  )
}
