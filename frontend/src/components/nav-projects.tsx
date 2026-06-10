"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/auth-context"

export type NavProjectItem = {
  name: string
  url: string
  icon: React.ReactNode
  permission?: string | string[]
}

export function NavProjects({ projects }: { projects: NavProjectItem[] }) {
  const { hasPermission, isLoading } = useAuth()
  if (isLoading) return null

  const visible = projects.filter((p) => !p.permission || hasPermission(p.permission))
  if (visible.length === 0) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>System</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
