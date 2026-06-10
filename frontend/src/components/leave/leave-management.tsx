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
import { CalendarDaysIcon, CheckCircle2Icon, PlusIcon, SearchIcon, XCircleIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormCombobox, FormDate, FormTextarea } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"
import { useLookup } from "@/lib/api/lookups"

const leaveSchema = z.object({
  employee_id: z.coerce.number().min(1, "Required"),
  leave_type_id: z.coerce.number().min(1, "Required"),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  reason: z.string().optional(),
})

type LeaveForm = z.infer<typeof leaveSchema>
type LeaveFormInput = z.input<typeof leaveSchema>

type LeaveRequestRecord = {
  id: number
  employee_id: number
  leave_type_id: number
  start_date: string
  end_date: string
  total_days: number
  status: string
  reason: string | null
  rejection_reason: string | null
  responded_at: string | null
  employee?: {
    id: number
    employee_code: string
    first_name: string
    last_name: string
    full_name: string
    department?: { name: string } | null
  }
  leave_type?: { name: string; code: string } | null
  approver?: { name: string } | null
}

const initialRequests: LeaveRequestRecord[] = []

export function LeaveManagement() {
  const [requests, setRequests] = React.useState<LeaveRequestRecord[]>(initialRequests)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const form = useForm<LeaveFormInput, unknown, LeaveForm>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" },
  })

  const employees = useLookup("employees")
  const leaveTypeOptions = useLookup("leaveTypes")

  const filteredRequests = statusFilter === "all"
    ? requests
    : requests.filter((r) => r.status === statusFilter)

  const columns: ColumnDef<LeaveRequestRecord>[] = [
    {
      accessorFn: (row) => row.employee?.employee_code ?? "",
      id: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-medium">{row.original.employee?.employee_code}</span>,
    },
    {
      accessorFn: (row) => row.employee?.full_name ?? "",
      id: "employee",
      header: "Employee",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.employee?.full_name}</div>
          <div className="text-xs text-muted-foreground">{row.original.employee?.department?.name}</div>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.leave_type?.name ?? "",
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {row.original.leave_type?.name}
        </span>
      ),
    },
    {
      accessorKey: "start_date",
      header: "From",
    },
    {
      accessorKey: "end_date",
      header: "To",
    },
    {
      accessorKey: "total_days",
      header: "Days",
      cell: ({ row }) => `${row.original.total_days}d`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        const colors =
          s === "approved"
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
            : s === "rejected"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
              : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400"
        return <span className={`rounded-md border px-2 py-1 text-xs capitalize ${colors}`}>{s}</span>
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        if (row.original.status !== "pending") return null
        return (
          <div className="flex gap-1">
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
              onClick={() => handleApprove(row.original.id)}
            >
              <CheckCircle2Icon className="size-4" />
            </button>
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-400"
              onClick={() => handleReject(row.original.id)}
            >
              <XCircleIcon className="size-4" />
            </button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredRequests,
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
        const reqRes = await api.get("/api/v1/leave-requests")
        if (mounted && Array.isArray(reqRes.data?.data)) setRequests(reqRes.data.data)
      } catch {
        if (mounted) setRequests(initialRequests)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function onSubmit(values: LeaveForm) {
    try {
      await csrf()
      const res = await api.post("/api/v1/leave-requests", sanitizePayload(values))
      const created = res.data?.data as LeaveRequestRecord
      setRequests((cur) => [created, ...cur])
      form.reset()
      sileo.success({ title: "Leave request submitted" })
    } catch {
      sileo.error({ title: "Submit failed", description: "The leave request was not saved to the backend." })
    }
  }

  async function handleApprove(id: number) {
    try {
      await csrf()
      const res = await api.put(`/api/v1/leave-requests/${id}/approve`)
      const updated = res.data?.data as LeaveRequestRecord
      setRequests((cur) => cur.map((r) => (r.id === id ? updated : r)))
      sileo.success({ title: "Leave approved" })
    } catch {
      sileo.error({ title: "Approval failed", description: "The leave request was not updated in the backend." })
    }
  }

  async function handleReject(id: number) {
    try {
      await csrf()
      const res = await api.put(`/api/v1/leave-requests/${id}/reject`, { rejection_reason: "Insufficient leave balance" })
      const updated = res.data?.data as LeaveRequestRecord
      setRequests((cur) => cur.map((r) => (r.id === id ? updated : r)))
      sileo.success({ title: "Leave rejected" })
    } catch {
      sileo.error({ title: "Rejection failed", description: "The leave request was not updated in the backend." })
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const approvedCount = requests.filter((r) => r.status === "approved").length
  const rejectedCount = requests.filter((r) => r.status === "rejected").length

  return (
    <div className="space-y-4 p-4">
      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Pending", value: pendingCount, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Approved", value: approvedCount, color: "text-green-600 dark:text-green-400" },
          { label: "Rejected", value: rejectedCount, color: "text-red-600 dark:text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="size-5 text-primary" />
                <div>
                  <h1 className="text-lg font-semibold">Leave Requests</h1>
                  <p className="text-sm text-muted-foreground">Manage employee leave requests and approvals</p>
                </div>
              </div>
              <div className="flex gap-2">
                {["all", "pending", "approved", "rejected"].map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                  placeholder="Search leave requests"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${filteredRequests.length} requests`}
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
                        No leave requests found.
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
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PlusIcon className="size-4" />
            <h2 className="text-sm font-semibold">New Leave Request</h2>
          </div>
          <div className="grid gap-3">
            <FormCombobox
              control={form.control}
              name="employee_id"
              label="Employee"
              options={employees.options}
              loading={employees.loading}
              placeholder="Select employee"
            />
            <FormCombobox
              control={form.control}
              name="leave_type_id"
              label="Leave Type"
              options={leaveTypeOptions.options}
              loading={leaveTypeOptions.loading}
              placeholder="Select leave type"
            />
            <FormDate control={form.control} name="start_date" label="Start Date" />
            <FormDate control={form.control} name="end_date" label="End Date" />
            <FormTextarea
              control={form.control}
              name="reason"
              label="Reason"
              placeholder="Optional reason for leave"
            />
            <Button type="submit" className="mt-2">
              <PlusIcon className="size-4" />
              Submit Request
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
