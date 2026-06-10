import { SettingsPage } from "@/components/settings/settings-page"
import { PlatformShell } from "@/components/platform-shell"

export default function SettingsRoute() {
  return (
    <PlatformShell title="Settings">
      <SettingsPage />
    </PlatformShell>
  )
}
