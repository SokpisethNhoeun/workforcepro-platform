"use client"

import * as React from "react"
import {
  BadgeDollarSignIcon,
  BellIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckSquareIcon,
  Clock3Icon,
  FileTextIcon,
  GaugeIcon,
  ScrollTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersRoundIcon,
} from "lucide-react"

import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavProjects, type NavProjectItem } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const teams = [
  { name: "WorkforcePro", logo: <ShieldCheckIcon />, plan: "Enterprise HR" },
  { name: "Demo Company", logo: <Building2Icon />, plan: "Cambodia" },
]

const navMain: NavMainItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <GaugeIcon />,
    isActive: true,
    permission: "dashboard.view",
  },
  {
    title: "People",
    url: "/employees",
    icon: <UsersRoundIcon />,
    items: [
      { title: "Employees", url: "/employees", permission: "employees.view" },
      { title: "Departments", url: "/departments", permission: "departments.view" },
      { title: "Recruitment", url: "/recruitment", permission: "recruitment.view" },
      { title: "Onboarding", url: "/onboarding", permission: "onboarding.view" },
      { title: "Performance", url: "/performance", permission: "performance.view" },
    ],
  },
  {
    title: "Time",
    url: "/attendance",
    icon: <Clock3Icon />,
    items: [
      { title: "Attendance", url: "/attendance", permission: "attendance.view" },
      { title: "Shifts", url: "/shifts", permission: "shifts.view" },
      { title: "Leave Requests", url: "/leave-requests", permission: "leave.view" },
      { title: "Calendar", url: "/calendar", permission: "calendar.view" },
    ],
  },
  {
    title: "Work",
    url: "/tasks",
    icon: <CheckSquareIcon />,
    items: [
      { title: "Tasks", url: "/tasks", permission: "tasks.view" },
      { title: "Approvals", url: "/approvals", permission: "approvals.view" },
      { title: "Announcements", url: "/announcements", permission: "announcements.view" },
      { title: "HR Tickets", url: "/hr-tickets", permission: "tickets.view" },
    ],
  },
  {
    title: "Finance",
    url: "/payroll",
    icon: <BadgeDollarSignIcon />,
    items: [
      { title: "Payroll", url: "/payroll", permission: "payroll.view" },
      { title: "Expenses", url: "/expenses", permission: "expenses.view" },
      { title: "Assets", url: "/assets", permission: "assets.view" },
      { title: "Reports", url: "/reports", permission: "reports.view" },
    ],
  },
]

const projects: NavProjectItem[] = [
  { name: "Documents", url: "/documents", icon: <FileTextIcon />, permission: "documents.view" },
  { name: "Calendar", url: "/calendar", icon: <CalendarDaysIcon />, permission: "calendar.view" },
  { name: "Notifications", url: "/notifications", icon: <BellIcon />, permission: "notifications.view" },
  { name: "Audit Logs", url: "/audit-logs", icon: <ScrollTextIcon />, permission: "audit.view" },
  { name: "Settings", url: "/settings", icon: <Settings2Icon />, permission: "settings.manage" },
  { name: "Profile", url: "/profile", icon: <UserCheckIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
