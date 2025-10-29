"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  BotMessageSquareIcon,
  Command,
  Contact2Icon,
  FolderArchive,
  FolderSymlink,
  HomeIcon,
  Send,
  Settings2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavMain2 } from "@/components/nav-main2"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';

import { type NavItem } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"



const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: HomeIcon,
      isActive: true,
    },
{
      title: "Whereabouts",
      url: "#",
      icon: Contact2Icon,
      isActive: true,
    },
    {
      title: "Employee Directory",
      url: "/directory",
      icon: Contact2Icon,
      isActive: true,
    },

    {
      title: "Noticeboard",
      url: "/noticeboard",
      icon: Bot,
      items: [
        {
          title: "Announcement",
          url: "/noticeboard/announcements",
        },
        {
          title: "Notice of Meeting",
          url: "/noticeboard/meeting",
        },
        {
          title: "Notice of Event",
          url: "/noticeboard/event",
        },
        {
          title: "Travel Information",
          url: "/noticeboard/travel",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Writeups",
          url: "#",
        },
        {
          title: "Travel Report",
          url: "#",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: FolderArchive,
      items: [
        {
          title: "Pesticide Inventory",
          url: "#",
        },
      ],
    },
    {
      title: "AI Chatbot",
      url: "/chatbot",
      icon: BotMessageSquareIcon,
    },
  ],

  navMain2: [
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Employee Management",
          url: "/employees",
        },
        {
          title: "User Management",
          url: "/superadmin/usermanagement",
        },
      ],
    },
  ],



  navSecondary: [
    {
      title: "Forms and Request",
      url: "#",
      icon: FolderSymlink,
    },
    {
      title: "Help Desk",
      url: "#",
      icon: Send,
    },
  ],

  /*
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],*/
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pageProps = usePage().props as any
  const { auth } = pageProps

  const filteredNavMain2 = React.useMemo(() => {
    return data.navMain2
      .map((item) => {
        const subItems = item.items?.filter((sub) => {
          if (auth?.user?.role === 'superadmin') return true
          return sub.title !== 'User Management'
        })
        return { ...item, items: subItems }
      })
      .filter((item) => (item.items && item.items.length > 0) || !!item.url)
  }, [auth?.user?.role])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavMain2 items={filteredNavMain2} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="block md:hidden bg-sidebar-accent rounded-md">
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

