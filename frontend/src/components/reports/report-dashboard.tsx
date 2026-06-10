"use client"

import * as React from "react"
import { BarChart3Icon, UsersIcon, ClockIcon, DollarSignIcon, CalendarIcon } from "lucide-react"

import { api } from "@/lib/api/client"

type ReportSummary = {
  employees: { total: number; active: number; on_probation: number }
  attendance: { today_present: number; today_late: number }
  leave: { pending: number; approved_this_month: number }
  expenses: { pending_amount: number; approved_this_month: number }
  payroll: { last_run: string | null }
}

type DeptHeadcount = { department: string; count: number }

const initialSummary: ReportSummary = {
  employees: { total: 0, active: 0, on_probation: 0 },
  attendance: { today_present: 0, today_late: 0 },
  leave: { pending: 0, approved_this_month: 0 },
  expenses: { pending_amount: 0, approved_this_month: 0 },
  payroll: { last_run: null },
}

const initialDepts: DeptHeadcount[] = []

export function ReportDashboard() {
  const [summary, setSummary] = React.useState<ReportSummary>(initialSummary)
  const [depts, setDepts] = React.useState<DeptHeadcount[]>(initialDepts)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [sumRes, deptRes] = await Promise.all([
          api.get("/api/v1/reports/summary"),
          api.get("/api/v1/reports/department-headcount"),
        ])
        if (mounted) {
          if (sumRes.data?.data) setSummary(sumRes.data.data)
          if (Array.isArray(deptRes.data?.data)) setDepts(deptRes.data.data)
        }
      } catch {
        if (mounted) {
          setSummary(initialSummary)
          setDepts(initialDepts)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const maxDept = Math.max(...depts.map((d) => d.count), 1)

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <BarChart3Icon className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Reports</h1>
            <p className="text-sm text-muted-foreground">Overview of key HR metrics</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="size-4" />
            <span>Employees</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{summary.employees.active}</p>
          <p className="text-xs text-muted-foreground">{summary.employees.total} total · {summary.employees.on_probation} on probation</p>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockIcon className="size-4" />
            <span>Today&apos;s Attendance</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{summary.attendance.today_present}</p>
          <p className="text-xs text-muted-foreground">{summary.attendance.today_late} late arrivals</p>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="size-4" />
            <span>Leave Requests</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{summary.leave.pending}</p>
          <p className="text-xs text-muted-foreground">pending · {summary.leave.approved_this_month} approved this month</p>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSignIcon className="size-4" />
            <span>Pending Expenses</span>
          </div>
          <p className="mt-2 text-3xl font-bold">${summary.expenses.pending_amount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">${summary.expenses.approved_this_month.toLocaleString()} approved this month</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Department Headcount</h2>
          <div className="space-y-3">
            {depts.map((d) => (
              <div key={d.department} className="flex items-center gap-3">
                <span className="w-28 truncate text-sm">{d.department}</span>
                <div className="relative h-6 flex-1 rounded-md bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md bg-primary/70"
                    style={{ width: `${(d.count / maxDept) * 100}%` }}
                  />
                  <span className="relative z-10 flex h-full items-center px-2 text-xs font-medium">{d.count}</span>
                </div>
              </div>
            ))}
            {depts.length === 0 && <p className="text-sm text-muted-foreground">No data available.</p>}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{summary.employees.total}</p>
              <p className="text-xs text-muted-foreground">Total Headcount</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.employees.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.leave.pending}</p>
              <p className="text-xs text-muted-foreground">Pending Leaves</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.payroll.last_run ?? "N/A"}</p>
              <p className="text-xs text-muted-foreground">Last Payroll</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
