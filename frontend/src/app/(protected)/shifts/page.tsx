import { ShiftManagement } from "@/components/shifts/shift-management"
import { PlatformShell } from "@/components/platform-shell"

export default function ShiftsPage() {
  return (
    <PlatformShell title="Shifts">
      <ShiftManagement />
    </PlatformShell>
  )
}
