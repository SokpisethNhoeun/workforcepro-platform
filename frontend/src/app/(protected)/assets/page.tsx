import { AssetManagement } from "@/components/assets/asset-management"
import { PlatformShell } from "@/components/platform-shell"

export default function AssetsPage() {
  return (
    <PlatformShell title="Assets">
      <AssetManagement />
    </PlatformShell>
  )
}
