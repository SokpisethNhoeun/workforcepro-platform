import { DocumentManagement } from "@/components/documents/document-management"
import { PlatformShell } from "@/components/platform-shell"

export default function DocumentsPage() {
  return (
    <PlatformShell title="Documents">
      <DocumentManagement />
    </PlatformShell>
  )
}
