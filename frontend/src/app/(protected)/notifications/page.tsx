import { NotificationCenter } from "@/components/notifications/notification-center"
import { PlatformShell } from "@/components/platform-shell"

export default function NotificationsPage() {
  return (
    <PlatformShell title="Notifications">
      <NotificationCenter />
    </PlatformShell>
  )
}
