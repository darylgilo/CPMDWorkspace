import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ClipboardList, LayoutGrid } from 'lucide-react';

interface RequestformTabsProps {
    activeTab: 'forms' | 'requests';
}

export default function RequestformTabs({ activeTab }: RequestformTabsProps) {
    const tabs = [
        {
            id: 'forms',
            title: 'Forms',
            href: '/forms',
            icon: LayoutGrid,
        },
        {
            id: 'requests',
            title: 'My Requests',
            href: '/requests',
            icon: ClipboardList,
        },
    ];

    return (
        <div className="border-b border-gray-200 dark:border-neutral-700 mb-6">
            <nav className="flex space-x-1 sm:space-x-4">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={cn(
                                'flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors border-b-2 bg-transparent',
                                isActive
                                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.title}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
