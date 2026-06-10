import { ReportDashboard } from "@/components/reports/report-dashboard"
import { PlatformShell } from "@/components/platform-shell"

export default function ReportsPage() {
  return (
    <PlatformShell title="Reports">
      <ReportDashboard />
    </PlatformShell>
  )
}
