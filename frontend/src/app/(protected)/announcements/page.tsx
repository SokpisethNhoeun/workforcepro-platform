import { AnnouncementBoard } from "@/components/announcements/announcement-board"
import { PlatformShell } from "@/components/platform-shell"

export default function AnnouncementsPage() {
  return (
    <PlatformShell title="Announcements">
      <AnnouncementBoard />
    </PlatformShell>
  )
}
