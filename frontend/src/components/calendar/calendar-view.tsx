"use client"

import * as React from "react"
import {
  DayFlowCalendar,
  useCalendarApp,
  createMonthView,
  createWeekView,
  createEventsPlugin,
  createDayView,
  createAgendaView,
} from "@dayflow/react"
import "@dayflow/core/dist/styles.components.css"
import { Temporal } from "temporal-polyfill"
import { sileo } from "sileo"

import { api, apiErrorMessage, csrf } from "@/lib/api/client"

type LeaveEvent = {
  id: number
  employee?: { full_name: string } | null
  leave_type?: { name: string } | null
  start_date: string
  end_date: string
  status: string
}

type AttendanceEvent = {
  id: number
  employee?: { full_name: string } | null
  date: string
  status: string
  check_in: string | null
  check_out: string | null
}

type CalendarEventRecord = {
  id: number
  uuid: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  all_day: boolean
  calendar_id: string
  color: string | null
}

type AnyTemporal = Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime

type CalEvent = {
  id: string
  title: string
  start: AnyTemporal
  end: AnyTemporal
  allDay?: boolean
  calendarId?: string
}

function toPlainDate(dateStr: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateStr.slice(0, 10))
}

function toPlainDateTime(isoStr: string): Temporal.PlainDateTime {
  const d = new Date(isoStr)
  return Temporal.PlainDateTime.from({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  })
}

function toIsoString(value: AnyTemporal, allDay: boolean): string {
  const str = value.toString()
  const datePart = str.slice(0, 10)
  if (allDay) {
    return `${datePart} 00:00:00`
  }
  if (value instanceof Temporal.PlainDateTime || value instanceof Temporal.ZonedDateTime) {
    return `${datePart} ${str.slice(11, 19)}`
  }
  return `${datePart} 00:00:00`
}

const USER_EVENT_PREFIX = "evt-"

function isUserEvent(id: string): boolean {
  return id.startsWith(USER_EVENT_PREFIX)
}

function uuidFromEventId(id: string): string {
  return id.slice(USER_EVENT_PREFIX.length)
}

export function CalendarView() {
  const [events, setEvents] = React.useState<CalEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [version, setVersion] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      setLoading(true)
      setError(null)
      try {
        const [leaveRes, attendanceRes, eventsRes] = await Promise.allSettled([
          api.get("/api/v1/leave-requests?status=approved&per_page=100"),
          api.get("/api/v1/attendance?per_page=100"),
          api.get("/api/v1/calendar/events?per_page=200"),
        ])

        const calendarEvents: CalEvent[] = []

        if (leaveRes.status === "fulfilled" && Array.isArray(leaveRes.value.data?.data)) {
          for (const leave of leaveRes.value.data.data as LeaveEvent[]) {
            try {
              calendarEvents.push({
                id: `leave-${leave.id}`,
                title: `${leave.employee?.full_name ?? "Employee"} — ${leave.leave_type?.name ?? "Leave"}`,
                start: toPlainDate(leave.start_date),
                end: toPlainDate(leave.end_date),
                allDay: true,
                calendarId: "leave",
              })
            } catch {
              // skip malformed dates
            }
          }
        }

        if (attendanceRes.status === "fulfilled" && Array.isArray(attendanceRes.value.data?.data)) {
          for (const att of attendanceRes.value.data.data as AttendanceEvent[]) {
            if (att.status === "late" && att.check_in) {
              try {
                const start = toPlainDateTime(att.check_in)
                const end = att.check_out ? toPlainDateTime(att.check_out) : start.add({ hours: 1 })
                calendarEvents.push({
                  id: `late-${att.id}`,
                  title: `${att.employee?.full_name ?? "Employee"} — Late`,
                  start,
                  end,
                  allDay: false,
                  calendarId: "attendance",
                })
              } catch {
                // skip malformed dates
              }
            }
          }
        }

        if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value.data?.data)) {
          for (const ev of eventsRes.value.data.data as CalendarEventRecord[]) {
            try {
              calendarEvents.push({
                id: `${USER_EVENT_PREFIX}${ev.uuid}`,
                title: ev.title,
                start: ev.all_day ? toPlainDate(ev.start_at) : toPlainDateTime(ev.start_at),
                end: ev.all_day ? toPlainDate(ev.end_at) : toPlainDateTime(ev.end_at),
                allDay: ev.all_day,
                calendarId: ev.calendar_id || "general",
              })
            } catch {
              // skip malformed dates
            }
          }
        }

        if (!cancelled) {
          setEvents(calendarEvents)
          setVersion((v) => v + 1)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load calendar events")
          setEvents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadEvents()
    return () => {
      cancelled = true
    }
  }, [])

  const handleEventCreate = React.useCallback(async (event: CalEvent) => {
    try {
      await csrf()
      const uuid = isUserEvent(event.id) ? uuidFromEventId(event.id) : event.id
      const allDay = !!event.allDay
      const calendarId = event.calendarId ?? "general"
      const res = await api.post("/api/v1/calendar/events", {
        uuid,
        title: event.title || "Untitled event",
        start_at: toIsoString(event.start, allDay),
        end_at: toIsoString(event.end, allDay),
        all_day: allDay,
        calendar_id: ["leave", "attendance"].includes(calendarId) ? "general" : calendarId,
      })
      const saved = res.data?.data as CalendarEventRecord | undefined
      if (saved) {
        sileo.success({ title: "Event saved" })
      }
    } catch (err) {
      sileo.error({ title: "Save failed", description: apiErrorMessage(err) })
    }
  }, [])

  const handleEventUpdate = React.useCallback(async (event: CalEvent) => {
    if (!isUserEvent(event.id)) return
    const uuid = uuidFromEventId(event.id)
    const allDay = !!event.allDay
    const calendarId = event.calendarId ?? "general"
    try {
      await csrf()
      await api.put(`/api/v1/calendar/events/${uuid}`, {
        title: event.title || "Untitled event",
        start_at: toIsoString(event.start, allDay),
        end_at: toIsoString(event.end, allDay),
        all_day: allDay,
        calendar_id: ["leave", "attendance"].includes(calendarId) ? "general" : calendarId,
      })
    } catch (err) {
      sileo.error({ title: "Update failed", description: apiErrorMessage(err) })
    }
  }, [])

  const handleEventDelete = React.useCallback(async (eventId: string) => {
    if (!isUserEvent(eventId)) return
    const uuid = uuidFromEventId(eventId)
    try {
      await csrf()
      await api.delete(`/api/v1/calendar/events/${uuid}`)
    } catch (err) {
      sileo.error({ title: "Delete failed", description: apiErrorMessage(err) })
    }
  }, [])

  const calendar = useCalendarApp(
    {
      views: [createMonthView(), createWeekView(), createDayView(), createAgendaView()],
      plugins: [createEventsPlugin()],
      events,
      defaultView: "month",
      calendars: [
        {
          id: "general",
          name: "General",
          colors: {
            eventColor: "#6366f1",
            eventSelectedColor: "#4f46e5",
            lineColor: "#6366f1",
            textColor: "#ffffff",
          },
        },
        {
          id: "team",
          name: "Team",
          colors: {
            eventColor: "#10b981",
            eventSelectedColor: "#059669",
            lineColor: "#10b981",
            textColor: "#ffffff",
          },
        },
        {
          id: "meeting",
          name: "Meetings",
          colors: {
            eventColor: "#8b5cf6",
            eventSelectedColor: "#7c3aed",
            lineColor: "#8b5cf6",
            textColor: "#ffffff",
          },
        },
        {
          id: "leave",
          name: "Leave",
          colors: {
            eventColor: "#3b82f6",
            eventSelectedColor: "#2563eb",
            lineColor: "#3b82f6",
            textColor: "#ffffff",
          },
          readOnly: true,
        },
        {
          id: "attendance",
          name: "Late Arrivals",
          colors: {
            eventColor: "#f59e0b",
            eventSelectedColor: "#d97706",
            lineColor: "#f59e0b",
            textColor: "#ffffff",
          },
          readOnly: true,
        },
        {
          id: "holiday",
          name: "Public Holidays",
          colors: {
            eventColor: "#ef4444",
            eventSelectedColor: "#dc2626",
            lineColor: "#ef4444",
            textColor: "#ffffff",
          },
        },
      ],
      callbacks: {
        onEventCreate: handleEventCreate,
        onEventUpdate: handleEventUpdate,
        onEventDelete: handleEventDelete,
      },
    },
    version,
  )

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-2 p-4">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
        {loading ? (
          <div className="absolute inset-x-0 top-0 z-10 border-b bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Loading calendar events…
          </div>
        ) : null}
        <div className="absolute inset-0 [&>.df-calendar-wrapper]:h-full [&_.df-calendar-wrapper]:w-full">
          <DayFlowCalendar calendar={calendar} />
        </div>
      </div>
    </div>
  )
}
