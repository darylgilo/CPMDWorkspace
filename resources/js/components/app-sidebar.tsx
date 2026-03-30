'use client';

import {
    BotMessageSquareIcon,
    CalendarCheckIcon,
    ClipboardList,
    FolderArchive,
    FolderArchiveIcon,
    FolderSymlink,
    HomeIcon,
    LucideContact,
    LucideNotebookPen,
    MessageSquareTextIcon,
    Send,
    Settings2,
} from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavMain2 } from '@/components/nav-main2';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
    user: {
        name: 'shadcn',
        email: 'm@example.com',
        avatar: '/avatars/shadcn.jpg',
    },

    navMain: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: HomeIcon,
            isActive: true,
        },
        {
            title: 'Taskboard',
            url: '/taskboard',
            icon: ClipboardList,
        },
        {
            title: 'Noticeboard',
            url: '/noticeboard',
            icon: MessageSquareTextIcon,
            isActive: true,
        },
        {
            title: 'Whereabouts',
            url: '/whereabouts',
            icon: CalendarCheckIcon,
            isActive: true,
        },
        {
            title: 'Employee Directory',
            url: '/directory',
            icon: LucideContact,
            isActive: true,
        },

        {
            title: 'Writing Suite',
            url: '/writing',
            icon: LucideNotebookPen,
        },
        {
            title: 'Management',
            url: '#',
            icon: FolderArchiveIcon,
            items: [
                {
                    title: 'Budget Management',
                    url: '/budgetmanagement',
                },
            ],
        },
        {
            title: 'Inventory',
            url: '#',
            icon: FolderArchive,
            items: [
                {
                    title: 'Pesticide Stock',
                    url: '/pesticidesindex',
                },
            ],
        },
        {
            title: 'AI Research Assistant',
            url: '/chatbot',
            icon: BotMessageSquareIcon,
        },
    ],

    navMain2: [
        {
            title: 'Settings',
            url: '#',
            icon: Settings2,
            items: [
                {
                    title: 'Employee Management',
                    url: '/employees',
                },
                {
                    title: 'User Management',
                    url: '/superadmin/usermanagement',
                },
            ],
        },
    ],

    navSecondary: [
        {
            title: 'Request and Forms',
            url: '/forms',
            icon: FolderSymlink,
        },
        {
            title: 'Help Desk',
            url: '/helpdesk',
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
};

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    office?: string;
    [key: string]: unknown;
}

interface Auth {
    user?: User;
    [key: string]: unknown;
}

interface PageProps {
    auth?: Auth;
    [key: string]: unknown;
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar(componentProps: AppSidebarProps) {
    const { props: pageProps } = usePage<PageProps>();
    const auth = pageProps.auth || {};

    const filteredNavMain = React.useMemo(() => {
        return data.navMain.filter((item) => {
            // Filter items that require CPMD office AND (CPMD, admin, or superadmin role)
            if (item.title === 'Management' || item.title === 'Inventory' || item.title === 'AI Research Assistant') {
                return auth?.user?.office === 'CPMD' && (auth?.user?.role === 'CPMD' || auth?.user?.role === 'admin' || auth?.user?.role === 'superadmin');
            }
            return true;
        }).map((item) => {
            // For Management and Inventory, also filter their sub-items
            if (item.items && (item.title === 'Management' || item.title === 'Inventory')) {
                return item; // These are already filtered above
            }
            return item;
        });
    }, [auth?.user?.role, auth?.user?.office]);

    const filteredNavMain2 = React.useMemo(() => {
        return data.navMain2
            .map((item) => {
                const subItems = item.items?.filter((sub) => {
                    // User Management: only superadmin can see
                    if (sub.title === 'User Management') {
                        return auth?.user?.role === 'superadmin';
                    }
                    // Employee Management: admin, superadmin, and HR can see
                    if (sub.title === 'Employee Management') {
                        return auth?.user?.role === 'admin' || auth?.user?.role === 'superadmin' || auth?.user?.role === 'HR';
                    }
                    return true;
                });
                return { ...item, items: subItems };
            })
            .filter(
                (item) => (item.items && item.items.length > 0) || !!item.url,
            );
    }, [auth?.user?.role]);

    const filteredNavSecondary = React.useMemo(() => {
        return data.navSecondary
            .map((item) => {
                if (item.title === 'Help Desk' && auth?.user?.role !== 'superadmin') {
                    return null;
                }
                return item;
            })
            .filter(Boolean) as typeof data.navSecondary;
    }, [auth?.user?.role]);

    return (
        <Sidebar variant="inset" {...componentProps}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href="/dashboard"
                                prefetch
                                className="hover:bg-transparent hover:no-underline"
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="hide-scrollbar">
                <NavMain items={filteredNavMain} />
                <NavMain2 items={filteredNavMain2} />
                <NavSecondary items={filteredNavSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <div className="block rounded-md bg-sidebar-accent md:hidden">
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
