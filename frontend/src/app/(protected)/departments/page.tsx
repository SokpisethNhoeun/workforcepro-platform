import { DepartmentManagement } from "@/components/departments/department-management"
import { PlatformShell } from "@/components/platform-shell"

export default function DepartmentsPage() {
  return (
    <PlatformShell title="Departments">
      <DepartmentManagement />
    </PlatformShell>
  )
}
