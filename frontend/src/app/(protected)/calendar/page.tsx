import { CalendarView } from "@/components/calendar/calendar-view"
import { PlatformShell } from "@/components/platform-shell"

export default function CalendarPage() {
  return (
    <PlatformShell title="Calendar">
      <CalendarView />
    </PlatformShell>
  )
}
