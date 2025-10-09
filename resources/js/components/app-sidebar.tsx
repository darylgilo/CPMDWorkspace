"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
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
import { Link } from '@inertiajs/react';
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
      url: "#",
      icon: Contact2Icon,
      isActive: true,
    },

    {
      title: "Noticeboard",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Announcements / News",
          url: "#",
        },
        {
          title: "Travel",
          url: "#",
        },
        {
          title: "Meeting",
          url: "#",
        },
        {
          title: "Event",
          url: "#",
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
  ],

  navMain2: [
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Employee Management",
          url: "#",
        },
        {
          title: "User Management",
          url: "#",
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
        <NavMain2 items={data.navMain2} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
       
      </SidebarFooter>
    </Sidebar>
  )
}

