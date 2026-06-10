import { RequirePermission } from "@/components/auth/require-permission"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission="assets.view">{children}</RequirePermission>
}
