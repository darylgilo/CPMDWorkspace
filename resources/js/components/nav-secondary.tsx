import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavSecondary({
    items,
    ...props
}: {
    items: {
        title: string;
        url: string;
        icon: LucideIcon;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const { url } = usePage();
    const basePath = React.useMemo(() => url.split('?')[0], [url]);

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        let isItemActive =
                            item.url !== '#' &&
                            (basePath === item.url ||
                                basePath.startsWith(item.url + '/'));

                        // Special case for Request and Forms to include /requests but exclude Form Builder URLs
                        if (item.title === 'Request and Forms' && basePath === '/requests') {
                            isItemActive = true;
                        }
                        
                        // Exclude Form Builder URLs from Request and Forms (only admin routes)
                        if (item.title === 'Request and Forms' && (basePath.startsWith('/forms/create') || basePath.startsWith('/forms/') && basePath !== '/forms' && !basePath.match(/^\/forms\/\d+$/))) {
                            isItemActive = false;
                        }
                        
                        // Special case for Help Desk to include /form-management and Form Builder URLs (admin routes only)
                        if (item.title === 'Help Desk' && (basePath === '/form-management' || basePath.startsWith('/forms/create') || (basePath.startsWith('/forms/') && basePath !== '/forms' && !basePath.match(/^\/forms\/\d+$/)))) {
                            isItemActive = true;
                        }
                        
                        // Form submission URLs (/forms/{id}) should belong to Request and Forms
                        if (item.title === 'Request and Forms' && basePath.match(/^\/forms\/\d+$/)) {
                            isItemActive = true;
                        }

                        const hasActiveChild = (item.items || []).some(
                            (sub) =>
                                sub.url !== '#' &&
                                (basePath === sub.url ||
                                    basePath.startsWith(sub.url + '/')),
                        );

                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={isItemActive || hasActiveChild}
                            >
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        size="sm"
                                        isActive={isItemActive || hasActiveChild}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    {item.items?.length ? (
                                        <>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuAction className="data-[state=open]:rotate-90">
                                                    <ChevronRight className="h-4 w-4" />
                                                    <span className="sr-only">Toggle</span>
                                                </SidebarMenuAction>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items.map((subItem) => {
                                                        const isSubActive =
                                                            subItem.url !== '#' &&
                                                            (basePath === subItem.url ||
                                                                basePath.startsWith(subItem.url + '/'));
                                                        return (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild isActive={isSubActive}>
                                                                    <Link href={subItem.url}>
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </>
                                    ) : null}
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
