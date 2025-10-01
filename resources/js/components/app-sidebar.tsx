import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, User2Icon, Settings2Icon, UserCircle, NotebookPen, ListCheckIcon, } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import AppLogo from './app-logo';

/**
 * AppSidebar Component
 * 
 * Renders the main application sidebar with role-based navigation items.
 * The sidebar displays different navigation options based on the user's role:
 * - All users see main navigation items (Dashboard, Task, Staff Notice)
 * - Admin users see additional employee management options
 * - Superadmin users see all navigation items including user management and control panel
 */
export function AppSidebar() {
    // Get authenticated user data from page props with proper TypeScript typing
    // This ensures we can access the user's role without TypeScript errors
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const userRole = auth?.user?.role || 'user';

    // Main navigation items - visible to all users
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Task',
            href: '/dashboard',
            icon: ListCheckIcon,
        },
        {
            title: 'Staff Notice',
            href: '/dashboard',
            icon: NotebookPen,
        },
        {
            title: 'Employee Management',
            href: '/admin/employeemanagement',
            icon: UserCircle,
        },
        {
            title: 'BIOCON PAGE',
            href: '/biocon/testpage',
            icon: UserCircle,
        },
    ];

    // biocon-specific navigation items
    const bioconNavItems: NavItem[] = [
      
    ];

    // pfs-specific navigation items
    const pfsNavItems: NavItem[] = [
      
    ];

    // phps-specific navigation items
    const phpsNavItems: NavItem[] = [
      
    ];

    // Admin-specific navigation items
    const adminNavItems: NavItem[] = [
      
    ];

    // Superadmin-specific navigation items
    const superAdminNavItems: NavItem[] = [
        {
            title: 'User Management',
            href: '/superadmin/usermanagement',
            icon: User2Icon,
        },
        {
            title: 'Control Panel',
            href: '/superadmin/systemuser',
            icon: Settings2Icon,
        },
    ];

    // Build role-based navigation by combining appropriate nav items
    let roleBasedNavItems = [...mainNavItems];
    
    // Add biocon navigation items for biocon users
    if (userRole === 'biocon') {
        roleBasedNavItems = [...roleBasedNavItems, ...bioconNavItems];
    }

    // Add pfs navigation items for pfs users
    if (userRole === 'pfs') {
        roleBasedNavItems = [...roleBasedNavItems, ...pfsNavItems];
    }

    // Add phps navigation items for phps users
    if (userRole === 'phps') {
        roleBasedNavItems = [...roleBasedNavItems, ...phpsNavItems];
    }

    // Add admin navigation items for admin users
    if (userRole === 'admin') {
        roleBasedNavItems = [...roleBasedNavItems, ...adminNavItems, ...bioconNavItems, ...pfsNavItems, ...phpsNavItems ];
    }

    // Add both admin and superadmin navigation items for superadmin users
    if (userRole === 'superadmin') {
        roleBasedNavItems = [...roleBasedNavItems, ...adminNavItems, ...superAdminNavItems, ...bioconNavItems, ...pfsNavItems, ...phpsNavItems ];
    }

    // Footer navigation items - external links and documentation
    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* Sidebar Header with App Logo */}
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

            {/* Main Navigation Content */}
            <SidebarContent>
                <NavMain items={roleBasedNavItems} />
            </SidebarContent>

            {/* Sidebar Footer with External Links and User Menu */}
            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                {/* <NavUser />  // commented for future use */}
            </SidebarFooter>
        </Sidebar>
    );
}
