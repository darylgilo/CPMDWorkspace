import SearchBar from '@/components/SearchBar';
import { renderTextWithLinks } from '@/lib/text-utils';
import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    Plus,
    User,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface TaskUser {
    id: number;
    name: string;
    email: string;
    profile_picture_url?: string;
}

type Category =
    | 'Announcement'
    | 'Notice of Meeting'
    | 'Notice of Event'
    | 'MEMO'
    | 'Reminder/Deadline';

interface Notice {
    id: string;
    title: string;
    category: Category;
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
    files?: Array<{
        name: string;
        url: string;
        type: string;
        size: number;
    }>;
    assignees?: number[] | null;
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

/* ───── Avatar stack ───── */
function AvatarStack({
    assignees,
    users,
    onAdd,
}: {
    assignees: number[] | null;
    users: TaskUser[];
    onAdd?: () => void;
}) {
    const list = assignees ?? [];
    if (list.length === 0 && !onAdd) return null;

    const visible = list.slice(0, 6);
    const overflow = list.length - visible.length;

    const colors = ['#163832', '#1a4d3e', '#235347', '#2a6358', '#0f766e'];
    const getUserData = (id: number | string) => users.find((u) => String(u.id) === String(id));

    return (
        <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
                {visible.map((uid, i) => {
                    const userData = getUserData(uid);
                    const name = userData?.name ?? `#${uid}`;
                    const avatar = userData?.profile_picture_url;
                    const initial = name.charAt(0).toUpperCase();

                    return (
                        <div
                            key={uid}
                            title={name}
                            className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white text-xs font-bold text-white dark:border-neutral-900"
                            style={{ background: colors[i % colors.length] }}
                        >
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{initial}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {overflow > 0 && (
                <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                    +{overflow}
                </span>
            )}
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-700"
                    title="Assign member"
                >
                    <Plus className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

export default function ReminderPage() {
    const pageProps = usePage().props as Record<string, unknown>;
    const serverNotices = useMemo(
        () => (pageProps?.notices as Array<Record<string, unknown>>) ?? [],
        [pageProps?.notices],
    );
    const users = useMemo(
        () => (pageProps?.users as TaskUser[]) ?? [],
        [pageProps?.users],
    );

    // Current date state for calendar navigation
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [search, setSearch] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState<
        'all' | 'upcoming' | 'overdue'
    >('all');
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
                ? (n.files as Array<Record<string, unknown>>).map((f) => ({
                      name: f.name ?? 'file',
                      url: f.url,
                      type: f.mime ?? '',
                      size: Number(f.size ?? 0),
                  }))
                : [];
            return {
                id: String(n.id),
                title: n.title,
                category: n.category as Category,
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
                assignees: n.assignees ?? null,
            } as Notice;
        });
    }, [serverNotices]);

    // Filter only Reminder/Deadline category and apply search
    const reminders = useMemo(() => {
        return mappedNotices
            .filter((n) => n.category === 'Reminder/Deadline')
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

    // Apply filter type (all, upcoming, overdue)
    const filteredReminders = useMemo(() => {
        if (filterType === 'all') return reminders;

        return reminders.filter((reminder) => {
            if (!reminder.date) return false;
            const reminderDate = new Date(reminder.date);
            const daysUntil = getDaysUntilDeadline(reminderDate);
            const isOverdue = isPastDate(reminderDate);
            const isDone = daysUntil < -6;

            if (filterType === 'upcoming') return !isOverdue;
            if (filterType === 'overdue') return isOverdue && !isDone; // Exclude done items from overdue filter
            return true;
        });
    }, [reminders, filterType]);

    // Edit dialog state
    const [editOpen, setEditOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editFiles, setEditFiles] = useState<Array<{name: string; url: string; type: string; size: number}>>([]);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editAssignees, setEditAssignees] = useState<number[]>([]);

    // Open edit dialog and populate with notice data
    function openEditDialog(notice: Notice) {
        setEditingNotice(notice);
        setEditTitle(notice.title);
        setEditDescription(notice.description);
        setEditFiles(notice.files || []);
        setEditDate(notice.date || '');
        setEditTime(notice.time || '');
        setEditAssignees(notice.assignees || []);
        setEditOpen(true);
    }

    // Group reminders by date
    const remindersByDate = useMemo(() => {
        const grouped = new Map<string, Notice[]>();
        filteredReminders.forEach((reminder) => {
            if (reminder.date) {
                const dateKey = reminder.date;
                if (!grouped.has(dateKey)) {
                    grouped.set(dateKey, []);
                }
                grouped.get(dateKey)!.push(reminder);
            }
        });
        return grouped;
    }, [filteredReminders]);

    // Get reminders for selected date or all reminders
    const displayedReminders = useMemo(() => {
        if (selectedDate) {
            const dateKey = formatDate(selectedDate);
            return remindersByDate.get(dateKey) || [];
        }
        return filteredReminders;
    }, [selectedDate, filteredReminders, remindersByDate]);

    // Sort reminders by date (upcoming first)
    const sortedReminders = useMemo(() => {
        return [...displayedReminders].sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [displayedReminders]);

    // Pagination
    const totalPages = Math.ceil(sortedReminders.length / itemsPerPage);
    const paginatedReminders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedReminders.slice(startIndex, endIndex);
    }, [sortedReminders, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedDate, filterType]);

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

    // Check if a date has reminders
    const hasReminders = (date: Date): boolean => {
        const dateKey = formatDate(date);
        return remindersByDate.has(dateKey);
    };

    // Get reminder count for a date
    const getReminderCount = (date: Date): number => {
        const dateKey = formatDate(date);
        return remindersByDate.get(dateKey)?.length || 0;
    };

    // Count upcoming and overdue reminders
    const upcomingCount = useMemo(() => {
        return reminders.filter((r) => r.date && !isPastDate(new Date(r.date)))
            .length;
    }, [reminders]);

    const overdueCount = useMemo(() => {
        return reminders.filter((r) => {
            if (!r.date) return false;
            const daysUntil = getDaysUntilDeadline(new Date(r.date));
            const isOverdue = isPastDate(new Date(r.date));
            const isDone = daysUntil < -6;
            return isOverdue && !isDone; // Exclude done items
        }).length;
    }, [reminders]);

    const today = new Date();

    return (
        <>
            <Head title="Reminders & Deadlines" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4">
                {/* Header */}
                <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Reminders & Deadlines
                            </h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {selectedDate
                                    ? `Showing reminders and deadlines for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                    : 'Track important deadlines and reminders'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {selectedDate && (
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="rounded-md bg-[#163832] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                >
                                    View All
                                </button>
                            )}

                            {/* Search Bar */}
                            <div className="w-full sm:w-80">
                                <SearchBar
                                    search={search}
                                    onSearchChange={setSearch}
                                    placeholder="Search reminders..."
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="mt-4 flex flex-nowrap gap-1 overflow-x-auto sm:flex-wrap sm:overflow-x-visible">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`rounded-md px-2 py-1.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                                filterType === 'all'
                                    ? 'bg-[#163832] text-white dark:bg-[#235347]'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            All ({reminders.length})
                        </button>
                        <button
                            onClick={() => setFilterType('upcoming')}
                            className={`rounded-md px-2 py-1.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                                filterType === 'upcoming'
                                    ? 'bg-[#163832] text-white dark:bg-[#235347]'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            Upcoming ({upcomingCount})
                        </button>
                        <button
                            onClick={() => setFilterType('overdue')}
                            className={`rounded-md px-2 py-1.5 text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                                filterType === 'overdue'
                                    ? 'bg-red-600 text-white dark:bg-red-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            Overdue ({overdueCount})
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Reminders List */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedDate
                                    ? `Reminders (${sortedReminders.length})`
                                    : `${filterType === 'all' ? 'All' : filterType === 'upcoming' ? 'Upcoming' : 'Overdue'} Reminders (${sortedReminders.length})`}
                            </h2>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mb-4 flex justify-center">
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
                                {paginatedReminders.length > 0 ? (
                                    paginatedReminders.map((reminder) => {
                                        const isExpanded = expandedCards.has(
                                            reminder.id,
                                        );
                                        const isOverdue =
                                            reminder.date &&
                                            isPastDate(new Date(reminder.date));
                                        const daysUntil = reminder.date
                                            ? getDaysUntilDeadline(
                                                  new Date(reminder.date),
                                              )
                                            : null;
                                        
                                        // Check if deadline is overdue more than 6 days (should be marked as done)
                                        const isDone = daysUntil !== null && daysUntil < -6;

                                        return (
                                            <div
                                                key={reminder.id}
                                                className={`group flex flex-col rounded-lg bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-neutral-900 ${
                                                    isDone
                                                        ? 'border-l-4 border-l-gray-400 bg-gray-50 dark:bg-gray-800/50 opacity-75'
                                                        : isOverdue
                                                            ? 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20'
                                                            : 'border-l-4 border-l-gray-200 bg-white dark:border-l-neutral-700'
                                                }`}
                                            >
                                                {/* Header with title and overdue badge */}
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                                                            {reminder.title}
                                                        </h3>
                                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                            Posted on {new Date(reminder.createdAt).toLocaleDateString()} {new Date(reminder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </div>
                                                    </div>

                                                    {/* Overdue Badge */}
                                                    {daysUntil !== null && (
                                                        <div
                                                            className={`ml-2 flex-shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                                                                isDone
                                                                    ? 'bg-gray-500 text-white'
                                                                    : isOverdue
                                                                        ? 'bg-red-500 text-white'
                                                                        : daysUntil <= 3
                                                                          ? 'bg-orange-500 text-white'
                                                                          : 'bg-blue-500 text-white'
                                                            }`}
                                                        >
                                                            {isDone
                                                                ? 'Done'
                                                                : isOverdue
                                                                    ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`
                                                                    : daysUntil === 0
                                                                      ? 'Due today'
                                                                      : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} left`}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                <div
                                                    className={`mb-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-2'}`}
                                                >
                                                    {renderTextWithLinks(reminder.description)}
                                                </div>

                                                {/* Date and Time */}
                                                {reminder.date && (
                                                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {new Date(reminder.date).toLocaleDateString()}
                                                        {reminder.time && (
                                                            <>
                                                                <Clock className="h-3 w-3" />
                                                                {reminder.time}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Files */}
                                                {(reminder.file || (reminder.files && reminder.files.length > 0)) && (
                                                    <div className="mb-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                                        <FileText className="h-3 w-3" />
                                                        <span>
                                                            {reminder.file ? '1 file' : `${reminder.files?.length} files`}
                                                        </span>
                                                        {reminder.files_download_url && (
                                                            <a
                                                                href={reminder.files_download_url}
                                                                className="ml-auto font-medium hover:underline"
                                                                download
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Download
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Expand button */}
                                                {reminder.description.length > 150 && (
                                                    <button
                                                        onClick={() => toggleCardExpansion(reminder.id)}
                                                        className="text-xs text-blue-500 hover:underline dark:text-blue-400"
                                                    >
                                                        {isExpanded ? 'Show less' : 'Show more'}
                                                    </button>
                                                )}

                                                {/* Assignees */}
                                                {reminder.assignees && reminder.assignees.length > 0 && (
                                                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <Users className="h-3 w-3" />
                                                        <span>Assigned to:</span>
                                                        <AvatarStack 
                                                            assignees={reminder.assignees} 
                                                            users={users} 
                                                        />
                                                    </div>
                                                )}

                                                {/* Footer */}
                                                <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {reminder.username}
                                                    </span>
                                                    <button
                                                        onClick={() => openEditDialog(reminder)}
                                                        className="px-2 py-1 bg-[#163832] text-white rounded hover:bg-[#163832]/90 transition-colors text-xs dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-neutral-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {selectedDate
                                                ? 'No reminders scheduled for this date.'
                                                : filterType === 'upcoming'
                                                  ? 'No upcoming reminders.'
                                                  : filterType === 'overdue'
                                                    ? 'No overdue reminders.'
                                                    : 'No reminders available.'}
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
                                    const hasEvents = hasReminders(day);
                                    const eventCount = getReminderCount(day);
                                    const isOverdueDay =
                                        isPastDate(day) && hasEvents;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDate(day)}
                                            className={`relative flex h-12 flex-col items-center justify-center rounded-md p-1 text-sm transition ${isToday ? 'font-bold ring-2 ring-[#163832] dark:ring-[#235347]' : ''} ${isSelected ? 'bg-[#163832] text-white dark:bg-[#235347]' : ''} ${!isSelected && hasEvents && isOverdueDay ? 'bg-red-50 font-medium text-red-900 dark:bg-red-800/40 dark:text-red-200' : ''} ${!isSelected && hasEvents && !isOverdueDay ? 'bg-blue-50 font-medium text-blue-900 dark:bg-blue-800/40 dark:text-blue-200' : ''} ${!isSelected && !hasEvents ? 'hover:bg-gray-100 dark:hover:bg-neutral-800' : ''} ${!isSelected && hasEvents && isOverdueDay ? 'hover:bg-red-100 dark:hover:bg-red-800/60' : ''} ${!isSelected && hasEvents && !isOverdueDay ? 'hover:bg-blue-100 dark:hover:bg-blue-800/60' : ''} `}
                                        >
                                            <span>{day.getDate()}</span>
                                            {hasEvents && (
                                                <span
                                                    className={`absolute bottom-0.5 text-[10px] font-bold ${isSelected ? 'text-white' : isOverdueDay ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'} `}
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
                                    <span>Upcoming Deadline</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="h-3 w-3 rounded-full bg-red-500 dark:bg-red-300" />
                                    <span>Overdue</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="h-3 w-3 rounded-full ring-2 ring-[#163832] dark:bg-[#235347]/40 dark:ring-[#235347]" />
                                    <span>Today</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="h-3 w-3 rounded-full bg-[#163832] dark:bg-[#235347]" />
                                    <span>Selected</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 space-y-2">
                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {upcomingCount}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            Upcoming Reminders
                                        </div>
                                    </div>
                                </div>
                                {overdueCount > 0 && (
                                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                {overdueCount}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                Overdue Items
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Reminder Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>View Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium">Title</label>
                                <textarea
                                    value={editTitle}
                                    readOnly
                                    rows={Math.ceil(editTitle.length / 80) || 1}
                                    onFocus={(e) => e.target.blur()}
                                    onMouseDown={(e) => e.preventDefault()}
                                    style={{
                                        userSelect: 'none',
                                        resize: 'none',
                                    }}
                                    className="w-full cursor-default rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <div className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950">
                                    {editingNotice?.date && isPastDate(new Date(editingNotice.date)) ? 'Overdue' : 'Upcoming'}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-sm font-medium">Description</label>
                                <div
                                    className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950 whitespace-pre-wrap"
                                    style={{ minHeight: '120px' }}
                                >
                                    {renderTextWithLinks(editDescription)}
                                </div>
                            </div>

                            {(editDate || editTime) && (
                                <>
                                    {editDate && (
                                        <div>
                                            <label className="text-sm font-medium">Deadline Date</label>
                                            <div className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950">
                                                {editDate}
                                            </div>
                                        </div>
                                    )}
                                    {editTime && (
                                        <div>
                                            <label className="text-sm font-medium">Deadline Time</label>
                                            <div className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950">
                                                {editTime}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="md:col-span-2">
                                <label className="text-sm font-medium">Posted by</label>
                                <div className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950">
                                    {editingNotice?.username}
                                </div>
                            </div>

                            {editAssignees && editAssignees.length > 0 && (
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Assignees</label>
                                    <div className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950">
                                        <AvatarStack 
                                            assignees={editAssignees} 
                                            users={users} 
                                        />
                                    </div>
                                </div>
                            )}

                            {editFiles.length > 0 && (
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Attachments</label>
                                    <div className="mt-1 space-y-2">
                                        {editFiles.map((file, index) => (
                                            <div key={index} className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950">
                                                <FileText className="h-4 w-4" />
                                                <span>{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
