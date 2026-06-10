import { ProfilePage } from "@/components/profile/profile-page"
import { PlatformShell } from "@/components/platform-shell"

export default function ProfileRoute() {
  return (
    <PlatformShell title="Profile">
      <ProfilePage />
    </PlatformShell>
  )
}
