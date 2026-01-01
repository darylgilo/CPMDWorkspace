import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    Calendar,
    Grid3X3,
    Megaphone,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Import child components
import CategoriesPage from './categories';
import AnnouncementPage from './announcement';
import EventPage from './event';
import MeetingPage from './meeting';
import ReminderPage from './reminder';

interface Notice {
    category: string;
    date?: string;
    [key: string]: unknown;
}

interface PageProps {
    activeTab?: string;
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Noticeboard', href: '/noticeboard' },
];

const navItems: Array<Omit<NavItem, 'href'> & { href: string }> = [
    {
        title: 'All',
        href: '#notice',
        icon: Grid3X3,
    },
    {
        title: 'Reminders',
        href: '#reminders',
        icon: AlertCircle,
    },
    {
        title: 'Meetings',
        href: '#meetings',
        icon: Calendar,
    },
    {
        title: 'Announcements',
        href: '#announcements',
        icon: Megaphone,
    },
    {
        title: 'Events',
        href: '#events',
        icon: Bell,
    },
];

export default function NoticeboardIndex() {
    const { props } = usePage<PageProps>();
    const { activeTab: activeTabProp = 'notice' } = props;
    const [activeTab, setActiveTab] = useState(activeTabProp);

    // Get notices from props
    const notices = useMemo(() => props.notices || [], [props.notices]);

    // Calculate today's meetings count
    const todayMeetingsCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return (notices as Notice[]).filter((notice: Notice) => {
            if (notice.category !== 'Notice of Meeting' || !notice.date) {
                return false;
            }
            const meetingDate = new Date(notice.date);
            return meetingDate >= today && meetingDate < tomorrow;
        }).length;
    }, [notices]);

    // Calculate today's reminders count
    const todayRemindersCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return (notices as Notice[]).filter((notice: Notice) => {
            if (notice.category !== 'Reminder/Deadline' || !notice.date) {
                return false;
            }
            const reminderDate = new Date(notice.date);
            return reminderDate >= today && reminderDate < tomorrow;
        }).length;
    }, [notices]);

    // Calculate today's events count
    const todayEventsCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return (notices as Notice[]).filter((notice: Notice) => {
            if (notice.category !== 'Notice of Event' || !notice.date) {
                return false;
            }
            const eventDate = new Date(notice.date);
            return eventDate >= today && eventDate < tomorrow;
        }).length;
    }, [notices]);

    // Calculate today's announcements count
    const todayAnnouncementsCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return (notices as Notice[]).filter((notice: Notice) => {
            if (notice.category !== 'Announcement' || !notice.date) {
                return false;
            }
            const announcementDate = new Date(notice.date);
            return announcementDate >= today && announcementDate < tomorrow;
        }).length;
    }, [notices]);

    // Sync state with prop changes when navigating between tabs
    useEffect(() => {
        setActiveTab(activeTabProp);
    }, [activeTabProp]);

    const handleTabChange = (tab: string) => {
        // For now, just update local state to test if clicking works
        setActiveTab(tab);
        // Use Inertia router to navigate with query parameters
        router.get(
            '/noticeboard',
            { tab },
            { preserveState: true, replace: true },
        );
    };

    // Handle browser back/forward buttons and initial hash navigation
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (
            hash &&
            (hash === 'notice' || hash === 'announcements' || hash === 'meetings' || hash === 'events' || hash === 'reminders')
        ) {
            // If there's a hash in the URL, navigate to that tab using query params
            router.get(
                '/noticeboard',
                { tab: hash },
                { preserveState: true, replace: true },
            );
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Noticeboard" />
            <div className="space-y-6 px-4 py-6">
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
                                        {item.title === 'Reminders' && todayRemindersCount > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                                                {todayRemindersCount}
                                            </span>
                                        )}
                                        {item.title === 'Meetings' && todayMeetingsCount > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                                                {todayMeetingsCount}
                                            </span>
                                        )}
                                        {item.title === 'Announcements' && todayAnnouncementsCount > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                                                {todayAnnouncementsCount}
                                            </span>
                                        )}
                                        {item.title === 'Events' && todayEventsCount > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                                                {todayEventsCount}
                                            </span>
                                        )}
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
                            {activeTab === 'notice' && (
                                <CategoriesPage />
                            )}
                            {activeTab === 'announcements' && (
                                <AnnouncementPage />
                            )}
                            {activeTab === 'meetings' && <MeetingPage />}
                            {activeTab === 'events' && <EventPage />}
                            {activeTab === 'reminders' && <ReminderPage />}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
