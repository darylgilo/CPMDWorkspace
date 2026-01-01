import SearchBar from '@/components/SearchBar';
import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
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

// Helper function to check if a date is in the past
function isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
}

// Helper function to get days until deadline
function getDaysUntilDeadline(date: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'ended'>('all');
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

    // Filter only Notice of Meeting category and apply search
    const meetings = useMemo(() => {
        return mappedNotices
            .filter((n) => n.category === 'Notice of Meeting')
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

    // Apply filter type (all, upcoming, ended)
    const filteredMeetings = useMemo(() => {
        if (filterType === 'all') return meetings;

        return meetings.filter((meeting) => {
            if (!meeting.date) return false;
            const meetingDate = new Date(meeting.date);
            const isEnded = isPastDate(meetingDate);

            if (filterType === 'upcoming') return !isEnded;
            if (filterType === 'ended') return isEnded;
            return true;
        });
    }, [meetings, filterType]);

    // Group meetings by date
    const meetingsByDate = useMemo(() => {
        const grouped = new Map<string, Notice[]>();
        meetings.forEach((meeting: Notice) => {
            if (meeting.date) {
                const dateKey = meeting.date;
                if (!grouped.has(dateKey)) {
                    grouped.set(dateKey, []);
                }
                grouped.get(dateKey)!.push(meeting);
            }
        });
        return grouped;
    }, [meetings]);

    // Get meetings for selected date or all meetings
    const displayedMeetings = useMemo(() => {
        if (selectedDate) {
            const dateKey = formatDate(selectedDate);
            return meetingsByDate.get(dateKey) || [];
        }
        return filteredMeetings;
    }, [selectedDate, filteredMeetings, meetingsByDate]);

    // Count upcoming and ended meetings
    const upcomingCount = useMemo(() => {
        return meetings.filter((m) => m.date && !isPastDate(new Date(m.date)))
            .length;
    }, [meetings]);

    const endedCount = useMemo(() => {
        return meetings.filter((m) => m.date && isPastDate(new Date(m.date)))
            .length;
    }, [meetings]);

    // Helper functions for calendar - wrapped in useMemo to avoid re-creation issues
    const calendarHelpers = useMemo(() => ({
        hasMeetingsOnDay: (date: Date): boolean => {
            const dateKey = formatDate(date);
            return meetingsByDate.has(dateKey);
        },
        getMeetingCount: (date: Date): number => {
            const dateKey = formatDate(date);
            return meetingsByDate.get(dateKey)?.length || 0;
        }
    }), [meetingsByDate]);

    // Pagination
    const totalPages = Math.ceil(displayedMeetings.length / itemsPerPage);
    const paginatedMeetings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return displayedMeetings.slice(startIndex, endIndex);
    }, [displayedMeetings, currentPage]);

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

    const today = new Date();

    return (
        <>
            <Head title="Notice of Meeting" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4">
                {/* Header */}
                <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Notice of Meeting
                            </h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {selectedDate
                                    ? `Showing meetings for ${selectedDate.toLocaleDateString(
                                          'en-US',
                                          {
                                              month: 'long',
                                              day: 'numeric',
                                              year: 'numeric',
                                          },
                                      )}`
                                    : 'View all meetings with scheduled dates'}
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

                    {/* Filter Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                filterType === 'all'
                                    ? 'bg-[#163832] text-white dark:bg-[#235347]'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            All ({meetings.length})
                        </button>
                        <button
                            onClick={() => setFilterType('upcoming')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                filterType === 'upcoming'
                                    ? 'bg-[#163832] text-white dark:bg-[#235347]'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            Upcoming ({upcomingCount})
                        </button>
                        <button
                            onClick={() => setFilterType('ended')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                filterType === 'ended'
                                    ? 'bg-red-600 text-white dark:bg-red-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            Ended ({endedCount})
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Announcements List */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedDate
                                    ? `Meetings (${displayedMeetings.length})`
                                    : `${filterType === 'all' ? 'All' : filterType === 'upcoming' ? 'Upcoming' : 'Ended'} Meetings (${displayedMeetings.length})`}
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
                                            displayedMeetings.length,
                                        )}{' '}
                                        of {displayedMeetings.length}{' '}
                                        meetings
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
                                {paginatedMeetings.length > 0 ? (
                                    paginatedMeetings.map(
                                        (meeting: Notice) => {
                                            const isExpanded =
                                                expandedCards.has(
                                                    meeting.id,
                                                );
                                            const isEnded =
                                                meeting.date &&
                                                isPastDate(new Date(meeting.date));
                                            const daysUntil = meeting.date
                                                ? getDaysUntilDeadline(
                                                      new Date(meeting.date),
                                                  )
                                                : null;

                                            return (
                                                <div
                                                    key={meeting.id}
                                                    className={`group rounded-lg border p-4 transition hover:shadow-md ${
                                                        isEnded
                                                            ? 'border-red-300 bg-red-50 hover:border-red-400 dark:border-red-800 dark:bg-red-950/20'
                                                            : 'border-gray-200 bg-gray-50 hover:border-[#163832] dark:border-neutral-700 dark:bg-neutral-800'
                                                    }`}
                                                >
                                                    <div className="mb-3 flex items-start justify-between">
                                                        <div className="flex flex-1 items-start gap-3">
                                                            <AlertCircle
                                                                className={`h-6 w-6 flex-shrink-0 ${
                                                                    isEnded
                                                                        ? 'text-red-600 dark:text-red-400'
                                                                        : 'text-[#163832] dark:text-[#235347]'
                                                                }`}
                                                                aria-hidden
                                                            />
                                                            <div className="flex-1">
                                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                                    {meeting.title}
                                                                </h3>
                                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <User className="h-3 w-3" />
                                                                        {
                                                                            meeting.username
                                                                        }
                                                                    </span>
                                                                    Posted on{' '}
                                                                    {new Date(
                                                                        meeting.createdAt,
                                                                    ).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p
                                                        className={`mb-3 text-sm text-gray-700 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-2'}`}
                                                    >
                                                        {
                                                            meeting.description
                                                        }
                                                    </p>
                                                    {meeting.description
                                                        .length > 150 && (
                                                        <button
                                                            onClick={() =>
                                                                toggleCardExpansion(
                                                                    meeting.id,
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
                                                    {meeting.files &&
                                                        meeting.files
                                                            .length > 0 && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                                <FileText className="h-4 w-4" />
                                                                <span>
                                                                    {
                                                                        meeting
                                                                            .files
                                                                            .length
                                                                    }{' '}
                                                                    attachment(s)
                                                                </span>
                                                                {meeting.files_download_url && (
                                                                    <a
                                                                        href={
                                                                            meeting.files_download_url
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

                                                    {meeting.file &&
                                                        !meeting.files
                                                            ?.length && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                                <FileText className="h-4 w-4" />
                                                                <a
                                                                    href={
                                                                        meeting
                                                                            .file
                                                                            .url
                                                                    }
                                                                    className="text-[#163832] hover:underline dark:text-[#235347]"
                                                                    download={
                                                                        meeting
                                                                            .file
                                                                            .name
                                                                    }
                                                                >
                                                                    {
                                                                        meeting
                                                                            .file
                                                                            .name
                                                                    }
                                                                </a>
                                                            </div>
                                                        )}

                                                    <div className="mt-3 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                                            {meeting.date && (
                                                                <span className="flex items-center gap-1">
                                                                    <CalendarIcon className="h-3 w-3" />
                                                                    {new Date(
                                                                        meeting.date,
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {meeting.time && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {
                                                                        meeting.time
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        {daysUntil !== null && (
                                                            <div
                                                                className={`ml-2 flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                                                    isEnded
                                                                        ? 'bg-red-600 text-white dark:bg-red-700'
                                                                        : daysUntil <=
                                                                            3
                                                                          ? 'bg-orange-500 text-white dark:bg-orange-600'
                                                                          : 'bg-blue-500 text-white dark:bg-blue-600'
                                                                }`}
                                                            >
                                                                {isEnded
                                                                    ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ended`
                                                                    : daysUntil ===
                                                                        0
                                                                      ? 'Today'
                                                                      : daysUntil ===
                                                                        1
                                                                      ? 'Tomorrow'
                                                                      : `In ${daysUntil} days`}
                                                            </div>
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
                                                ? 'No meetings scheduled for this date.'
                                                : filterType === 'upcoming'
                                                  ? 'No upcoming meetings.'
                                                  : filterType === 'ended'
                                                    ? 'No ended meetings.'
                                                    : 'No meetings available.'}
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
                                    const hasMeetingsOnDay = calendarHelpers.hasMeetingsOnDay(day);
                                    const meetingCount =
                                        calendarHelpers.getMeetingCount(day);
                                    const isEndedDay =
                                        isPastDate(day) && hasMeetingsOnDay;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDate(day)}
                                            className={`relative flex h-12 flex-col items-center justify-center rounded-md p-1 text-sm transition ${isToday ? 'font-bold ring-2 ring-[#163832] dark:ring-[#235347]' : ''} ${isSelected ? 'bg-[#163832] text-white dark:bg-[#235347]' : ''} ${!isSelected && hasMeetingsOnDay ? (isEndedDay ? 'bg-red-50 font-medium text-red-900 dark:bg-red-800/40 dark:text-red-200' : 'bg-blue-50 font-medium text-blue-900 dark:bg-blue-800/40 dark:text-blue-200') : ''} ${!isSelected && !hasMeetingsOnDay ? 'hover:bg-gray-100 dark:hover:bg-neutral-800' : ''} ${!isSelected && hasMeetingsOnDay ? (isEndedDay ? 'hover:bg-red-100 dark:hover:bg-red-800/60' : 'hover:bg-blue-100 dark:hover:bg-blue-800/60') : ''} `}
                                        >
                                            <span>{day.getDate()}</span>
                                            {hasMeetingsOnDay && (
                                                <span
                                                    className={`absolute bottom-0.5 text-[10px] font-bold ${isSelected ? 'text-white' : isEndedDay ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'} `}
                                                >
                                                    {meetingCount}
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
                                    <span>Meeting</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="h-3 w-3 rounded-full bg-red-500 dark:bg-red-300" />
                                    <span>Ended Meeting</span>
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
                                        {meetings.length}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        Total Meetings
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
