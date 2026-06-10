import { RequirePermission } from "@/components/auth/require-permission"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission="shifts.view">{children}</RequirePermission>
}
