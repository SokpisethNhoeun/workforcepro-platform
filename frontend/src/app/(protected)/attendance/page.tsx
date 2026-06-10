import { AttendanceManagement } from "@/components/attendance/attendance-management"
import { PlatformShell } from "@/components/platform-shell"

export default function AttendancePage() {
  return (
    <PlatformShell title="Attendance">
      <AttendanceManagement />
    </PlatformShell>
  )
}
