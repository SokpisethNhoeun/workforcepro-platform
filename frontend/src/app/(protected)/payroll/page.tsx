import { PayrollManagement } from "@/components/payroll/payroll-management"
import { PlatformShell } from "@/components/platform-shell"

export default function PayrollPage() {
  return (
    <PlatformShell title="Payroll">
      <PayrollManagement />
    </PlatformShell>
  )
}
