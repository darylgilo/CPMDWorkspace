import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Bookmark as BookmarkIcon,
    CheckCircle,
    FileText,
    PenTool,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Import child components
import Approved from './Approved';
import Archive from './archive';
import Bookmark from './Bookmark';
import Posted from './Posted';
import Writeup from './writeup';

interface PageProps {
    activeTab?: string;
    documents?: Array<{
        id: number;
        title: string;
        content: string;
        category: string;
        status: 'draft' | 'for review' | 'approved' | 'rejected' | 'posted';
        created_at: string;
        updated_at: string;
        author: {
            id: number;
            name: string;
            email: string;
        };
        histories: Array<{
            id: number;
            action: string;
            user: {
                id: number;
                name: string;
                email: string;
            };
            created_at: string;
        }>;
    }>;
    auth?: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Writing Management', href: '/writing' },
];

const navItems: Array<Omit<NavItem, 'href'> & { href: string }> = [
    {
        title: 'Writeup',
        href: '#writeup',
        icon: PenTool,
    },
    {
        title: 'Bookmark',
        href: '#bookmark',
        icon: BookmarkIcon,
    },
    {
        title: 'Approved',
        href: '#approved',
        icon: CheckCircle,
    },
    {
        title: 'Posted',
        href: '#posted',
        icon: FileText,
    },
    {
        title: 'Archive',
        href: '#archive',
        icon: BookOpen,
    },
];

export default function WritingIndex() {
    const { props } = usePage<PageProps>();
    const { activeTab: activeTabProp = 'writeup' } = props;
    const [activeTab, setActiveTab] = useState(activeTabProp);

    // Sync state with prop changes when navigating between tabs
    useEffect(() => {
        setActiveTab(activeTabProp);
    }, [activeTabProp]);

    const handleTabChange = (tab: string) => {
        // Use Inertia router to navigate with query parameters
        router.get(
            '/writing',
            { tab },
            { preserveState: false, replace: true },
        );
    };

    // Handle browser back/forward buttons and initial hash navigation
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (
            hash &&
            (hash === 'writeup' ||
                hash === 'bookmark' ||
                hash === 'archive' ||
                hash === 'posted' ||
                hash === 'approved')
        ) {
            // If there's a hash in the URL, navigate to that tab using query params
            router.get(
                '/writing',
                { tab: hash },
                { preserveState: false, replace: true },
            );
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Writing Management" />
            <div className="noticeboard-container space-y-6 px-4 py-6">
                {/* Header Navigation */}
                <div className="border-b border-gray-200 dark:border-neutral-700">
                    <nav className="flex space-x-2">
                        {navItems.map((item, index) => {
                            const isActive =
                                activeTab === item.href.substring(1);
                            return (
                                <Button
                                    key={`${item.href}-${index}`}
                                    variant="ghost"
                                    className={cn(
                                        'rounded-none px-4 py-3 font-medium transition-colors',
                                        'border-b-2 border-transparent',
                                        'hover:bg-transparent hover:text-foreground',
                                        'focus-visible:ring-0 focus-visible:ring-offset-0',
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
                                    <div className="flex items-center gap-2">
                                        {item.icon && (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        {item.title}
                                    </div>
                                </Button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="w-full">
                    <section className="w-full">
                        {/* Tab Content */}
                        <div className="tab-content">
                            {activeTab === 'writeup' && <Writeup />}
                            {activeTab === 'bookmark' && <Bookmark />}
                            {activeTab === 'approved' && <Approved />}
                            {activeTab === 'archive' && <Archive />}
                            {activeTab === 'posted' && <Posted />}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
