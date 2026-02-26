import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ClipboardList, ListChecks, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import child components
import AllTaskTimeline from './AllTaskTimeline';
import MyTaskboard from './MyTaskboard';
import Taskboard from './Taskboard';

interface PageProps {
    activeTab?: string;
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Taskboard', href: '/taskboard' },
];

const navItems: Array<Omit<NavItem, 'href'> & { href: string }> = [
    {
        title: 'All Task',
        href: '#taskboard',
        icon: ClipboardList,
    },
    {
        title: 'My Tasks',
        href: '#mytaskboard',
        icon: ListChecks,
    },
    {
        title: 'All Task Timeline',
        href: '#alltasktimeline',
        icon: Clock,
    },
];

export default function TaskboardIndex() {
    const { props } = usePage<PageProps>();
    const { activeTab: activeTabProp = 'taskboard' } = props;
    const [activeTab, setActiveTab] = useState(activeTabProp);

    useEffect(() => {
        setActiveTab(activeTabProp);
    }, [activeTabProp]);

    const handleTabChange = (tab: string) => {
        router.get(
            '/taskboard',
            { tab },
            { preserveState: true, replace: true },
        );
    };

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (hash && (hash === 'taskboard' || hash === 'mytaskboard' || hash === 'alltasktimeline')) {
            router.get(
                '/taskboard',
                { tab: hash },
                { preserveState: true, replace: true },
            );
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Taskboard" />
            <div className="space-y-6 px-4 py-6">
                {/* Header Navigation */}
                <div className="border-b border-gray-200 dark:border-neutral-700">
                    <nav className="overflow-x-auto hide-scrollbar">
                        <div className="flex space-x-1 min-w-max sm:space-x-2">
                            {navItems.map((item, index) => {
                                const isActive =
                                    activeTab === item.href.substring(1);
                                return (
                                    <Button
                                        key={`${item.href}-${index}`}
                                        variant="ghost"
                                        className={cn(
                                            'rounded-none px-2 py-3 font-medium transition-colors flex-shrink-0',
                                            'border-b-2 border-transparent',
                                            'hover:bg-transparent hover:text-foreground',
                                            'focus-visible:ring-0 focus-visible:ring-offset-0',
                                            'text-sm sm:text-base sm:px-4',
                                            {
                                                'border-primary text-foreground':
                                                    isActive,
                                                'text-muted-foreground hover:border-b-accent':
                                                    !isActive,
                                            },
                                        )}
                                        onClick={() =>
                                            handleTabChange(item.href.substring(1))
                                        }
                                    >
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            {item.icon && (
                                                <item.icon className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                                            )}
                                            <span className="hidden sm:inline truncate whitespace-nowrap">
                                                {item.title}
                                            </span>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="w-full">
                    <section className="w-full">
                        <div className="tab-content">
                            {activeTab === 'taskboard' && <Taskboard />}
                            {activeTab === 'mytaskboard' && <MyTaskboard />}
                            {activeTab === 'alltasktimeline' && <AllTaskTimeline />}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
