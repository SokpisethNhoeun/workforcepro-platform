import { LeaveManagement } from "@/components/leave/leave-management"
import { PlatformShell } from "@/components/platform-shell"

export default function LeaveRequestsPage() {
  return (
    <PlatformShell title="Leave Requests">
      <LeaveManagement />
    </PlatformShell>
  )
}
