import { ApprovalCenter } from "@/components/approvals/approval-center"
import { PlatformShell } from "@/components/platform-shell"

export default function ApprovalsPage() {
  return (
    <PlatformShell title="Approvals">
      <ApprovalCenter />
    </PlatformShell>
  )
}
