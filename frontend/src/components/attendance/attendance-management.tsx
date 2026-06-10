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
import { Clock3Icon, LogInIcon, LogOutIcon, SearchIcon } from "lucide-react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, csrf } from "@/lib/api/client"

type AttendanceRecord = {
  id: number
  employee_id: number
  date: string
  check_in: string | null
  check_out: string | null
  check_in_method: string
  check_out_method: string
  work_hours: number | null
  overtime_hours: number
  status: string
  employee?: {
    id: number
    employee_code: string
    first_name: string
    last_name: string
    full_name: string
    department?: { name: string } | null
    position?: { title: string } | null
  }
}

type Summary = {
  total_checked_in: number
  total_checked_out: number
  total_late: number
  total_on_time: number
}

const initialRecords: AttendanceRecord[] = []
const initialSummary: Summary = { total_checked_in: 0, total_checked_out: 0, total_late: 0, total_on_time: 0 }

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

export function AttendanceManagement() {
  const [records, setRecords] = React.useState<AttendanceRecord[]>(initialRecords)
  const [summary, setSummary] = React.useState<Summary>(initialSummary)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [employeeId, setEmployeeId] = React.useState("")

  const columns: ColumnDef<AttendanceRecord>[] = [
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
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "check_in",
      header: "Check In",
      cell: ({ row }) => formatTime(row.original.check_in),
    },
    {
      accessorKey: "check_out",
      header: "Check Out",
      cell: ({ row }) => formatTime(row.original.check_out),
    },
    {
      accessorKey: "work_hours",
      header: "Hours",
      cell: ({ row }) => row.original.work_hours != null ? `${row.original.work_hours}h` : "—",
    },
    {
      accessorKey: "overtime_hours",
      header: "OT",
      cell: ({ row }) => row.original.overtime_hours > 0 ? `${row.original.overtime_hours}h` : "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        const colors = s === "present"
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
          : s === "late"
            ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400"
            : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
        return <span className={`rounded-md border px-2 py-1 text-xs capitalize ${colors}`}>{s}</span>
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        if (row.original.check_out) return null
        return (
          <Button variant="outline" size="sm" onClick={() => handleCheckOut(row.original.id)}>
            <LogOutIcon className="size-3.5" />
            Out
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: records,
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
        const [recordsRes, summaryRes] = await Promise.all([
          api.get("/api/v1/attendance"),
          api.get("/api/v1/attendance/summary"),
        ])
        if (mounted) {
          if (Array.isArray(recordsRes.data?.data)) setRecords(recordsRes.data.data)
          if (summaryRes.data?.data) setSummary(summaryRes.data.data)
        }
      } catch {
        if (mounted) {
          setRecords(initialRecords)
          setSummary(initialSummary)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function handleCheckIn() {
    const eid = parseInt(employeeId, 10)
    if (!eid) {
      sileo.error({ title: "Enter an employee ID" })
      return
    }
    try {
      await csrf()
      const res = await api.post("/api/v1/attendance/check-in", { employee_id: eid })
      const record = res.data?.data as AttendanceRecord
      setRecords((cur) => [record, ...cur.filter((r) => r.employee_id !== eid || r.date !== record.date)])
      setSummary((s) => ({ ...s, total_checked_in: s.total_checked_in + 1, total_on_time: s.total_on_time + 1 }))
      setEmployeeId("")
      sileo.success({ title: "Checked in", description: record.employee?.full_name })
    } catch {
      sileo.error({ title: "Check-in failed", description: "The attendance record was not saved to the backend." })
    }
  }

  async function handleCheckOut(attendanceId: number) {
    try {
      await csrf()
      const res = await api.put(`/api/v1/attendance/${attendanceId}/check-out`)
      const updated = res.data?.data as AttendanceRecord
      setRecords((cur) => cur.map((r) => (r.id === attendanceId ? updated : r)))
      setSummary((s) => ({ ...s, total_checked_out: s.total_checked_out + 1 }))
      sileo.success({ title: "Checked out" })
    } catch {
      sileo.error({ title: "Check-out failed", description: "The attendance record was not updated in the backend." })
    }
  }

  const stats = [
    { label: "Checked In", value: summary.total_checked_in, color: "text-blue-600 dark:text-blue-400" },
    { label: "Checked Out", value: summary.total_checked_out, color: "text-green-600 dark:text-green-400" },
    { label: "On Time", value: summary.total_on_time, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Late", value: summary.total_late, color: "text-yellow-600 dark:text-yellow-400" },
  ]

  return (
    <div className="space-y-4 p-4">
      <section className="grid gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">Today</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Clock3Icon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Attendance</h1>
              <p className="text-sm text-muted-foreground">Today&apos;s attendance log</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Employee ID"
              className="w-36"
            />
            <Button onClick={handleCheckIn}>
              <LogInIcon className="size-4" />
              Check In
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
              placeholder="Search attendance records"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${records.length} records`}
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
                    No attendance records found.
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
      </section>
    </div>
  )
}
