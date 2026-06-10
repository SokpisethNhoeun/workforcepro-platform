import { ExpenseManagement } from "@/components/expenses/expense-management"
import { PlatformShell } from "@/components/platform-shell"

export default function ExpensesPage() {
  return (
    <PlatformShell title="Expenses">
      <ExpenseManagement />
    </PlatformShell>
  )
}
