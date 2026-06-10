import { OnboardingManagement } from "@/components/onboarding/onboarding-management"
import { PlatformShell } from "@/components/platform-shell"

export default function OnboardingPage() {
  return (
    <PlatformShell title="Onboarding">
      <OnboardingManagement />
    </PlatformShell>
  )
}
