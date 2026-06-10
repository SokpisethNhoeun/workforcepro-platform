import { TaskManagement } from "@/components/tasks/task-management"
import { PlatformShell } from "@/components/platform-shell"

export default function TasksPage() {
  return (
    <PlatformShell title="Tasks">
      <TaskManagement />
    </PlatformShell>
  )
}
