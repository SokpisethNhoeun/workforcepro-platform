import { AuditLogViewer } from "@/components/audit/audit-log-viewer"
import { PlatformShell } from "@/components/platform-shell"

export default function AuditLogsPage() {
  return (
    <PlatformShell title="Audit Logs">
      <AuditLogViewer />
    </PlatformShell>
  )
}
