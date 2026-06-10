import { EmployeeManagement } from "@/components/employees/employee-management"
import { PlatformShell } from "@/components/platform-shell"

export default function EmployeesPage() {
  return (
    <PlatformShell title="Employees">
      <EmployeeManagement />
    </PlatformShell>
  )
}
