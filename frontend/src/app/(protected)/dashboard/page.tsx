"use client"

import * as React from "react"
import {
  ActivityIcon,
  BadgeDollarSignIcon,
  CalendarDaysIcon,
  Clock3Icon,
  UsersRoundIcon,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { PlatformShell } from "@/components/platform-shell"
import { api } from "@/lib/api/client"

type SummaryData = {
  employees: { total: number; active: number; on_probation: number }
  attendance: { today_present: number; today_late: number }
  leave: { pending: number; approved_this_month: number }
  expenses: { pending_amount: number; approved_this_month: number }
  payroll: { last_run: string | null }
}

type TrendPoint = { date: string; total: number; late_count: number }

export default function DashboardPage() {
  const mounted = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false
  )
  const [summary, setSummary] = React.useState<SummaryData | null>(null)
  const [trend, setTrend] = React.useState<TrendPoint[]>([])

  React.useEffect(() => {
    api.get("/api/v1/reports/summary").then((r) => {
      if (r.data?.data) setSummary(r.data.data)
    }).catch(() => {})

    api.get("/api/v1/reports/attendance-trend", { params: { days: 7 } }).then((r) => {
      if (r.data?.data) setTrend(r.data.data)
    }).catch(() => {})
  }, [])

  const attendanceRate = summary
    ? summary.employees.active > 0
      ? ((summary.attendance.today_present / summary.employees.active) * 100).toFixed(1)
      : "0"
    : "—"

  const stats = [
    { label: "Employees", value: summary ? String(summary.employees.total) : "—", delta: `${summary?.employees.active ?? 0} active`, icon: UsersRoundIcon },
    { label: "Attendance Today", value: summary ? `${attendanceRate}%` : "—", delta: `${summary?.attendance.today_late ?? 0} late`, icon: Clock3Icon },
    { label: "Pending Leave", value: summary ? String(summary.leave.pending) : "—", delta: `${summary?.leave.approved_this_month ?? 0} approved this month`, icon: CalendarDaysIcon },
    { label: "Pending Expenses", value: summary ? `$${summary.expenses.pending_amount.toLocaleString()}` : "—", delta: summary?.payroll.last_run ?? "No payroll yet", icon: BadgeDollarSignIcon },
  ]

  const chartData = trend.map((t) => ({
    day: new Date(t.date).toLocaleDateString("en-US", { weekday: "short" }),
    present: t.total - t.late_count,
    late: t.late_count,
  }))

  return (
    <PlatformShell title="Dashboard">
      <div className="space-y-4 p-4">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{stat.delta}</p>
              </div>
            )
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Attendance Overview</h2>
                <p className="text-xs text-muted-foreground">Present and late sessions (last 7 days)</p>
              </div>
              <ActivityIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="h-72">
              {mounted && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={32} />
                    <Tooltip />
                    <Bar dataKey="present" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : mounted ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No attendance data yet</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Quick Stats</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <span className="font-medium">Active Employees</span>
                <span className="text-xs text-muted-foreground">{summary?.employees.active ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <span className="font-medium">On Probation</span>
                <span className="text-xs text-muted-foreground">{summary?.employees.on_probation ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <span className="font-medium">Expenses This Month</span>
                <span className="text-xs text-muted-foreground">${summary?.expenses.approved_this_month?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <span className="font-medium">Last Payroll</span>
                <span className="text-xs text-muted-foreground">{summary?.payroll.last_run ?? "Not run yet"}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  )
}
