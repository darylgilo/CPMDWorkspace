import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, usePage } from "@inertiajs/react"
import { useState, useEffect, useMemo } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { navMainState } from "@/lib/sidebar-state"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { url } = usePage()
  
  // Get base path without query parameters
  const basePath = useMemo(() => url.split('?')[0], [url])
  
  // Use global state manager
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => navMainState.getState())

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = navMainState.subscribe((newState) => {
      setOpenItems(newState)
    })
    return unsubscribe
  }, [])

  // Initialize state based on active routes on mount
  useEffect(() => {
    const initialItems = items.map((item) => {
      const isItemActive =
        item.url !== "#" && (basePath === item.url || basePath.startsWith(item.url + "/"))
      const hasActiveChild = (item.items || []).some(
        (sub) => sub.url !== "#" && (basePath === sub.url || basePath.startsWith(sub.url + "/"))
      )
      return {
        title: item.title,
        isOpen: item.isActive || isItemActive || hasActiveChild
      }
    })
    navMainState.initialize(initialItems)
  }, [])

  // Update open state when base path changes (not query params)
  useEffect(() => {
    items.forEach((item) => {
      const isItemActive =
        item.url !== "#" && (basePath === item.url || basePath.startsWith(item.url + "/"))
      const hasActiveChild = (item.items || []).some(
        (sub) => sub.url !== "#" && (basePath === sub.url || basePath.startsWith(sub.url + "/"))
      )
      
      // Only open if this item or its children are now active
      if (isItemActive || hasActiveChild) {
        navMainState.setState(item.title, true)
      }
    })
  }, [basePath])

  // Handle state changes
  const handleOpenChange = (itemTitle: string, open: boolean) => {
    navMainState.setState(itemTitle, open)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isItemActive =
            item.url !== "#" && (basePath === item.url || basePath.startsWith(item.url + "/"))

          const hasActiveChild = (item.items || []).some(
            (sub) => sub.url !== "#" && (basePath === sub.url || basePath.startsWith(sub.url + "/"))
          )

          return (
            <Collapsible
              key={item.title}
              asChild
              open={openItems[item.title] ?? false}
              onOpenChange={(open) => handleOpenChange(item.title, open)}
            >
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isItemActive || hasActiveChild}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive =
                            subItem.url !== "#" && (basePath === subItem.url || basePath.startsWith(subItem.url + "/"))
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
