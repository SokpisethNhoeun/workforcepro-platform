import { PerformanceManagement } from "@/components/performance/performance-management"
import { PlatformShell } from "@/components/platform-shell"

export default function PerformancePage() {
  return (
    <PlatformShell title="Performance">
      <PerformanceManagement />
    </PlatformShell>
  )
}
