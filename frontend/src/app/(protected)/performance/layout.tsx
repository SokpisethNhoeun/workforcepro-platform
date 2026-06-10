import { RequirePermission } from "@/components/auth/require-permission"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission="performance.view">{children}</RequirePermission>
}
