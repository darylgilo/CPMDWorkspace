'use client';

import {
    BookOpen,
    Bot,
    BotMessageSquareIcon,
    Contact2Icon,
    FolderArchive,
    FolderSymlink,
    HomeIcon,
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
            title: 'Home',
            url: '/dashboard',
            icon: HomeIcon,
            isActive: true,
        },
        {
            title: 'Whereabouts',
            url: '/whereabouts',
            icon: Contact2Icon,
            isActive: true,
        },
        {
            title: 'Employee Directory',
            url: '/directory',
            icon: Contact2Icon,
            isActive: true,
        },

        {
            title: 'Noticeboard',
            url: '/noticeboard',
            icon: Bot,
            items: [
                {
                    title: 'Announcement',
                    url: '/noticeboard/announcements',
                },
                {
                    title: 'Notice of Meeting',
                    url: '/noticeboard/meeting',
                },
                {
                    title: 'Notice of Event',
                    url: '/noticeboard/event',
                },
                {
                    title: 'MEMO',
                    url: '/noticeboard/memo',
                },
            ],
        },
        {
            title: 'Documentation',
            url: '#',
            icon: BookOpen,
            items: [
                {
                    title: 'Writeups',
                    url: '#',
                },
                {
                    title: 'Travel Report',
                    url: '#',
                },
            ],
        },
        {
            title: 'Inventory',
            url: '#',
            icon: FolderArchive,
            items: [
                {
                    title: 'Pesticide Management',
                    url: '/pesticidesindex',
                },
            ],
        },
        {
            title: 'AI Chatbot',
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
            title: 'Forms and Request',
            url: '#',
            icon: FolderSymlink,
        },
        {
            title: 'Help Desk',
            url: '#',
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

    const filteredNavMain2 = React.useMemo(() => {
        return data.navMain2
            .map((item) => {
                const subItems = item.items?.filter((sub) => {
                    if (auth?.user?.role === 'superadmin') return true;
                    return sub.title !== 'User Management';
                });
                return { ...item, items: subItems };
            })
            .filter(
                (item) => (item.items && item.items.length > 0) || !!item.url,
            );
    }, [auth?.user?.role]);

    return (
        <Sidebar variant="inset" {...componentProps}>
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
                <div className="block rounded-md bg-sidebar-accent md:hidden">
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
