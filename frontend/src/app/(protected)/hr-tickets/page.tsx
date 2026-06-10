import { TicketManagement } from "@/components/tickets/ticket-management"
import { PlatformShell } from "@/components/platform-shell"

export default function HrTicketsPage() {
  return (
    <PlatformShell title="HR Tickets">
      <TicketManagement />
    </PlatformShell>
  )
}
