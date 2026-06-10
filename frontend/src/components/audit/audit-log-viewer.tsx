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
import { ScrollTextIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api/client"

type AuditLogRecord = {
  id: number
  user_id: number | null
  action: string
  method: string | null
  path: string | null
  status_code: number | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: { id: number; name: string; email: string } | null
}

const initialLogs: AuditLogRecord[] = []

const methodColors: Record<string, string> = {
  GET: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  POST: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  PUT: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  PATCH: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
  DELETE: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
}

export function AuditLogViewer() {
  const [logs, setLogs] = React.useState<AuditLogRecord[]>(initialLogs)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [methodFilter, setMethodFilter] = React.useState<string>("all")

  const filteredLogs = methodFilter === "all" ? logs : logs.filter((l) => l.method === methodFilter)

  const columns: ColumnDef<AuditLogRecord>[] = [
    {
      accessorKey: "created_at",
      header: "Time",
      cell: ({ row }) => (
        <div className="text-xs">
          <div>{new Date(row.original.created_at).toLocaleDateString()}</div>
          <div className="text-muted-foreground">{new Date(row.original.created_at).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.user?.name ?? "System",
      id: "user",
      header: "User",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.user?.name ?? "System"}</div>
          <div className="text-xs text-muted-foreground">{row.original.user?.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => {
        const m = row.original.method ?? ""
        return <span className={`rounded-md border px-2 py-0.5 text-xs font-mono font-medium ${methodColors[m] ?? ""}`}>{m}</span>
      },
    },
    {
      accessorKey: "path",
      header: "Path",
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.path}</span>,
    },
    {
      accessorKey: "status_code",
      header: "Status",
      cell: ({ row }) => {
        const code = row.original.status_code
        const color = code && code >= 200 && code < 300
          ? "text-green-600 dark:text-green-400"
          : code && code >= 400
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground"
        return <span className={`font-mono text-xs font-medium ${color}`}>{code}</span>
      },
    },
    {
      accessorKey: "ip_address",
      header: "IP",
      cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{row.original.ip_address}</span>,
    },
  ]

  const table = useReactTable({
    data: filteredLogs,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await api.get("/api/v1/audit-logs")
        if (mounted && Array.isArray(res.data?.data)) setLogs(res.data.data)
      } catch {
        if (mounted) setLogs(initialLogs)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ScrollTextIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Audit Logs</h1>
              <p className="text-sm text-muted-foreground">Track all API activity and system changes</p>
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "POST", "PUT", "DELETE"].map((m) => (
              <Button key={m} variant={methodFilter === m ? "default" : "outline"} size="sm" onClick={() => setMethodFilter(m)}>
                {m === "all" ? "All" : m}
              </Button>
            ))}
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
              placeholder="Search logs by user, path, or action"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${filteredLogs.length} entries`}
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
                    No audit logs found.
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
