"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"

export type NavMainItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  permission?: string | string[]
  items?: {
    title: string
    url: string
    permission?: string | string[]
  }[]
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const { hasPermission, isLoading } = useAuth()
  const pathname = usePathname()

  const allowed = React.useCallback(
    (perm?: string | string[]) => !perm || hasPermission(perm),
    [hasPermission],
  )

  const visible = React.useMemo(() => {
    return items
      .map((item) => {
        if (item.items?.length) {
          const subs = item.items.filter((s) => allowed(s.permission))
          if (subs.length === 0) return null
          return { ...item, items: subs }
        }
        return allowed(item.permission) ? item : null
      })
      .filter((x): x is NavMainItem => x !== null)
  }, [items, allowed])

  const activeGroupTitle = React.useMemo(() => {
    const match = visible.find((item) =>
      item.items?.some((s) => pathname === s.url || pathname.startsWith(`${s.url}/`)),
    )
    return match?.title ?? null
  }, [visible, pathname])

  const [manualOpenTitle, setManualOpenTitle] = React.useState<string | null>(null)
  const openTitle = activeGroupTitle ?? manualOpenTitle

  if (isLoading) return null
  if (visible.length === 0) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((item) =>
          item.items?.length ? (
            <Collapsible
              key={item.title}
              asChild
              open={openTitle === item.title}
              onOpenChange={(next) => setManualOpenTitle(next ? item.title : null)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const isActive =
                        pathname === subItem.url || pathname.startsWith(`${subItem.url}/`)
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
