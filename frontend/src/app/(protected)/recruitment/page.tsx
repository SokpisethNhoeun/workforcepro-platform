import { RecruitmentManagement } from "@/components/recruitment/recruitment-management"
import { PlatformShell } from "@/components/platform-shell"

export default function RecruitmentPage() {
  return (
    <PlatformShell title="Recruitment">
      <RecruitmentManagement />
    </PlatformShell>
  )
}
