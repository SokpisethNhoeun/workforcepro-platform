import type { AuthUser } from "@/lib/auth/types"

type ProtectedRoute = {
  path: string
  permission?: string
}

const PROTECTED_ROUTES: ProtectedRoute[] = [
  { path: "/dashboard", permission: "dashboard.view" },
  { path: "/employees", permission: "employees.view" },
  { path: "/departments", permission: "departments.view" },
  { path: "/recruitment", permission: "recruitment.view" },
  { path: "/onboarding", permission: "onboarding.view" },
  { path: "/performance", permission: "performance.view" },
  { path: "/attendance", permission: "attendance.view" },
  { path: "/shifts", permission: "shifts.view" },
  { path: "/leave-requests", permission: "leave.view" },
  { path: "/calendar", permission: "calendar.view" },
  { path: "/tasks", permission: "tasks.view" },
  { path: "/approvals", permission: "approvals.view" },
  { path: "/announcements", permission: "announcements.view" },
  { path: "/hr-tickets", permission: "tickets.view" },
  { path: "/payroll", permission: "payroll.view" },
  { path: "/expenses", permission: "expenses.view" },
  { path: "/assets", permission: "assets.view" },
  { path: "/reports", permission: "reports.view" },
  { path: "/documents", permission: "documents.view" },
  { path: "/notifications", permission: "notifications.view" },
  { path: "/audit-logs", permission: "audit.view" },
  { path: "/settings", permission: "settings.manage" },
  { path: "/profile" },
]

function hasPermission(user: AuthUser, permission?: string) {
  return !permission || user.permissions?.includes(permission)
}

export function getDefaultRouteForUser(user: AuthUser) {
  return PROTECTED_ROUTES.find((route) => hasPermission(user, route.permission))?.path ?? "/profile"
}

export function canAccessUserRoute(user: AuthUser, path: string) {
  const cleanPath = path.split("?")[0].split("#")[0]
  const route = PROTECTED_ROUTES.find(
    (item) => cleanPath === item.path || cleanPath.startsWith(`${item.path}/`)
  )

  if (!route) return false
  return hasPermission(user, route.permission)
}
