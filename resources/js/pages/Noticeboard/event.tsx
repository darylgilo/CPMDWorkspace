import SearchBar from '@/components/SearchBar';
import { Head, usePage } from '@inertiajs/react';
import {
    Bell,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Notice {
    id: string;
    title: string;
    description: string;
    username: string;
    createdAt: string;
    date?: string | null;
    time?: string | null;
    files_download_url?: string | null;
    file?: {
        name: string;
        url: string;
        type: string;
        size: number;
    } | null;
    files?: Array<{ name: string; url: string; type: string; size: number }>;
    category: string;
}

// Helper function to get days in a month
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

// Helper function to get the first day of the month (0 = Sunday, 6 = Saturday)
function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

export default function AnnouncementPage() {
    interface PageProps {
        notices?: Array<{
            id: number | string;
            title: string;
            description: string;
            username: string;
            created_at: string;
            date?: string | null;
            time?: string | null;
            files_download_url?: string | null;
            files?: Array<{
                name?: string;
                url: string;
                mime?: string;
                size?: number | string;
            }>;
            file_url?: string;
            file_name?: string;
            file_mime?: string;
            file_size?: number | string;
            category: string;
            [key: string]: unknown;
        }>;
        [key: string]: unknown;
    }

    const { props } = usePage<PageProps>();
    const serverNotices = useMemo(() => props.notices ?? [], [props.notices]);

    // Current date state for calendar navigation
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [search, setSearch] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const toggleCardExpansion = (id: string) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Map backend props into typed notices
    const mappedNotices: Notice[] = useMemo(() => {
        return serverNotices.map((n) => {
            const filesArr = Array.isArray(n.files)
                ? n.files.map((f) => ({
                      name: f.name ?? 'file',
                      url: f.url,
                      type: f.mime ?? '',
                      size: Number(f.size ?? 0),
                  }))
                : [];
            return {
                id: String(n.id),
                title: n.title,
                description: n.description,
                username: n.username,
                createdAt: n.created_at,
                date: n.date ?? null,
                time: n.time ?? null,
                files_download_url: n.files_download_url ?? null,
                file: n.file_url
                    ? {
                          name: n.file_name ?? 'file',
                          url: n.file_url,
                          type: n.file_mime ?? '',
                          size: Number(n.file_size ?? 0),
                      }
                    : null,
                files: filesArr,
                category: n.category,
            } as Notice;
        });
    }, [serverNotices]);

    // Filter only Notice of Event category and apply search
    const announcements = useMemo(() => {
        return mappedNotices
            .filter((n) => n.category === 'Notice of Event')
            .filter((n) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                    n.title.toLowerCase().includes(q) ||
                    n.username.toLowerCase().includes(q) ||
                    n.description.toLowerCase().includes(q)
                );
            });
    }, [mappedNotices, search]);

    // Group announcements by date
    const announcementsByDate = useMemo(() => {
        const grouped = new Map<string, Notice[]>();
        announcements.forEach((announcement) => {
            if (announcement.date) {
                const dateKey = announcement.date;
                if (!grouped.has(dateKey)) {
                    grouped.set(dateKey, []);
                }
                grouped.get(dateKey)!.push(announcement);
            }
        });
        return grouped;
    }, [announcements]);

    // Get announcements for selected date or all announcements
    const displayedAnnouncements = useMemo(() => {
        if (selectedDate) {
            const dateKey = formatDate(selectedDate);
            return announcementsByDate.get(dateKey) || [];
        }
        return announcements;
    }, [selectedDate, announcements, announcementsByDate]);

    // Pagination
    const totalPages = Math.ceil(displayedAnnouncements.length / itemsPerPage);
    const paginatedAnnouncements = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return displayedAnnouncements.slice(startIndex, endIndex);
    }, [displayedAnnouncements, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedDate]);

    // Calendar navigation
    const goToPreviousMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
        );
    };

    const goToNextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
        );
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
    };

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentDate]);

    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Check if a date has travels
    const hasAnnouncements = (date: Date): boolean => {
        const dateKey = formatDate(date);
        return announcementsByDate.has(dateKey);
    };

    // Get announcement count for a date
    const getAnnouncementCount = (date: Date): number => {
        const dateKey = formatDate(date);
        return announcementsByDate.get(dateKey)?.length || 0;
    };

    const today = new Date();

    return (
        <>
            <Head title="Notice of Events" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4">
                {/* Header */}
                <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Notice of Events
                            </h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {selectedDate
                                    ? `Showing events for ${selectedDate.toLocaleDateString(
                                          'en-US',
                                          {
                                              month: 'long',
                                              day: 'numeric',
                                              year: 'numeric',
                                          },
                                      )}`
                                    : 'View all events with scheduled dates'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedDate && (
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="rounded-md bg-[#163832] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                >
                                    View All
                                </button>
                            )}

                            {/* Search Bar */}
                            <div className="w-full md:w-80">
                                <SearchBar
                                    search={search}
                                    onSearchChange={setSearch}
                                    placeholder="Search by title or user..."
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Announcements List */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedDate
                                    ? `Events (${displayedAnnouncements.length})`
                                    : `All Events (${announcements.length})`}
                            </h2>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing{' '}
                                        {(currentPage - 1) * itemsPerPage + 1}{' '}
                                        to{' '}
                                        {Math.min(
                                            currentPage * itemsPerPage,
                                            displayedAnnouncements.length,
                                        )}{' '}
                                        of {displayedAnnouncements.length}{' '}
                                        events
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setCurrentPage(currentPage - 1)
                                            }
                                            disabled={currentPage === 1}
                                            className="rounded-md p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setCurrentPage(currentPage + 1)
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            className="rounded-md p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
                                            aria-label="Next page"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {paginatedAnnouncements.length > 0 ? (
                                    paginatedAnnouncements.map(
                                        (announcement) => {
                                            const isExpanded =
                                                expandedCards.has(
                                                    announcement.id,
                                                );
                                            return (
                                                <div
                                                    key={announcement.id}
                                                    className="group rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-[#163832] hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                                                >
                                                    <div className="mb-3 flex items-start justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Bell
                                                                className="h-6 w-6"
                                                                aria-hidden
                                                            />
                                                            <div>
                                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                                    {
                                                                        announcement.title
                                                                    }
                                                                </h3>
                                                                <div className="mt-1 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <User className="h-3 w-3" />
                                                                        {
                                                                            announcement.username
                                                                        }
                                                                    </span>
                                                                    Posted on{' '}
                                                                    {new Date(
                                                                        announcement.createdAt,
                                                                    ).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p
                                                        className={`mb-3 text-sm text-gray-700 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-2'}`}
                                                    >
                                                        {
                                                            announcement.description
                                                        }
                                                    </p>
                                                    {announcement.description
                                                        .length > 150 && (
                                                        <button
                                                            onClick={() =>
                                                                toggleCardExpansion(
                                                                    announcement.id,
                                                                )
                                                            }
                                                            className="text-xs text-[#163832] hover:underline dark:text-[#235347]"
                                                        >
                                                            {isExpanded
                                                                ? 'Show less'
                                                                : 'Read more'}
                                                        </button>
                                                    )}

                                                    {/* Attachments */}
                                                    {announcement.files &&
                                                        announcement.files
                                                            .length > 0 && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                                <FileText className="h-4 w-4" />
                                                                <span>
                                                                    {
                                                                        announcement
                                                                            .files
                                                                            .length
                                                                    }{' '}
                                                                    attachment(s)
                                                                </span>
                                                                {announcement.files_download_url && (
                                                                    <a
                                                                        href={
                                                                            announcement.files_download_url
                                                                        }
                                                                        className="text-[#163832] hover:underline dark:text-[#235347]"
                                                                        download
                                                                    >
                                                                        Download
                                                                        All
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                    {announcement.file &&
                                                        !announcement.files
                                                            ?.length && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                                <FileText className="h-4 w-4" />
                                                                <a
                                                                    href={
                                                                        announcement
                                                                            .file
                                                                            .url
                                                                    }
                                                                    className="text-[#163832] hover:underline dark:text-[#235347]"
                                                                    download={
                                                                        announcement
                                                                            .file
                                                                            .name
                                                                    }
                                                                >
                                                                    {
                                                                        announcement
                                                                            .file
                                                                            .name
                                                                    }
                                                                </a>
                                                            </div>
                                                        )}

                                                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                                        {announcement.date && (
                                                            <span className="flex items-center gap-1">
                                                                <CalendarIcon className="h-3 w-3" />
                                                                {new Date(
                                                                    announcement.date,
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        {announcement.time && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {
                                                                    announcement.time
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-neutral-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {selectedDate
                                                ? 'No events scheduled for this date.'
                                                : 'No events available.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Calendar Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-4 rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {monthNames[currentDate.getMonth()]}{' '}
                                    {currentDate.getFullYear()}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={goToPreviousMonth}
                                        className="rounded-md p-1 transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                                        aria-label="Previous month"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={goToToday}
                                        className="rounded-md px-2 py-1 text-xs font-medium transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={goToNextMonth}
                                        className="rounded-md p-1 transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                                        aria-label="Next month"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {/* Day names */}
                                {dayNames.map((day) => (
                                    <div
                                        key={day}
                                        className="p-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400"
                                    >
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar days */}
                                {calendarDays.map((day, index) => {
                                    if (!day) {
                                        return (
                                            <div
                                                key={`empty-${index}`}
                                                className="p-2"
                                            />
                                        );
                                    }

                                    const isToday = isSameDay(day, today);
                                    const isSelected =
                                        selectedDate &&
                                        isSameDay(day, selectedDate);
                                    const hasEvents = hasAnnouncements(day);
                                    const eventCount =
                                        getAnnouncementCount(day);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDate(day)}
                                            className={`relative flex h-12 flex-col items-center justify-center rounded-md p-1 text-sm transition ${isToday ? 'font-bold ring-2 ring-[#163832] dark:ring-[#235347]' : ''} ${isSelected ? 'bg-[#163832] text-white dark:bg-[#235347]' : ''} ${!isSelected && hasEvents ? 'bg-blue-50 font-medium text-blue-900 dark:bg-blue-800/40 dark:text-blue-200' : ''} ${!isSelected && !hasEvents ? 'hover:bg-gray-100 dark:hover:bg-neutral-800' : ''} ${!isSelected && hasEvents ? 'hover:bg-blue-100 dark:hover:bg-blue-800/60' : ''} `}
                                        >
                                            <span>{day.getDate()}</span>
                                            {hasEvents && (
                                                <span
                                                    className={`absolute bottom-0.5 text-[10px] font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'} `}
                                                >
                                                    {eventCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-neutral-700">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="h-3 w-3 rounded-full bg-blue-500 dark:bg-blue-300" />
                                    <span>Event</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="h-3 w-3 rounded-full ring-2 ring-[#163832] dark:ring-[#235347]" />
                                    <span>Today</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="h-3 w-3 rounded-full bg-[#163832] dark:bg-[#235347]" />
                                    <span>Selected</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {announcements.length}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        Total Events
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
