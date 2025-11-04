import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
import CustomCardPin from '@/components/ui/CustomCardPin';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Bell,
    Calendar,
    FileText,
    Megaphone,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
type Category =
    | 'Announcement'
    | 'Notice of Meeting'
    | 'Notice of Event'
    | 'MEMO';

// Display shape for a notice card in the UI
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
}

// Form payload shape sent to backend
interface FormData {
    title: string;
    category: Category;
    description: string;
    files: File[];
    date?: string;
    time?: string;
}

const categoryOptions: Category[] = [
    'Announcement',
    'Notice of Meeting',
    'Notice of Event',
    'MEMO',
];

const categoryIcon: Record<Category, React.ReactNode> = {
    Announcement: <Megaphone className="h-5 w-5" />,
    'Notice of Meeting': <Calendar className="h-5 w-5" />,
    'Notice of Event': <Bell className="h-5 w-5" />,
    MEMO: <FileText className="h-5 w-5" />,
};

// Generate time options in 30-minute intervals
const generateTimeOptions = (): string[] => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const period = hour < 12 ? 'AM' : 'PM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const displayMinute = minute.toString().padStart(2, '0');
            times.push(`${displayHour}:${displayMinute} ${period}`);
        }
    }
    return times;
};

const timeOptions = generateTimeOptions();

// Convert 12-hour format (e.g., "2:30 PM") to 24-hour format (e.g., "14:30")
function convertTo24Hour(time12h: string): string {
    if (!time12h) return '';
    const [time, period] = time12h.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    let hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Convert 24-hour format (e.g., "14:30") to 12-hour format (e.g., "2:30 PM")
function convertTo12Hour(time24h: string): string {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

interface ServerNotice {
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
    category: Category;
    [key: string]: unknown;
}

interface PageProps {
    notices?: ServerNotice[];
    [key: string]: unknown;
}

export default function Noticeboard() {
    const { props } = usePage<PageProps>();
    const serverNotices = useMemo(() => props.notices ?? [], [props.notices]);

    // Local form state for creating a notice
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<Category>('Announcement');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [date, setDate] = useState('');
    const [time, setTime] = useState(''); // Stores 12-hour format for display
    const [open, setOpen] = useState(false);

    // Edit dialog state
    const [editOpen, setEditOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editCategory, setEditCategory] = useState<Category>('Announcement');
    const [editDescription, setEditDescription] = useState('');
    const [editFiles, setEditFiles] = useState<File[]>([]);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState(''); // Stores 12-hour format for display
    const editFileInputRef = useRef<HTMLInputElement | null>(null);

    const [filterCategory, setFilterCategory] = useState<'All' | Category>(
        'All',
    );
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [pinnedNotices, setPinnedNotices] = useState<Set<string>>(() => {
        // Load pinned notices from localStorage on initial render
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pinnedNotices');
            return saved ? new Set(JSON.parse(saved)) : new Set<string>();
        }
        return new Set<string>();
    });

    // Save pinned notices to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'pinnedNotices',
                JSON.stringify(Array.from(pinnedNotices)),
            );
        }
    }, [pinnedNotices]);

    const togglePin = (noticeId: string) => {
        setPinnedNotices((prev) => {
            const newPins = new Set(prev);
            if (newPins.has(noticeId)) {
                newPins.delete(noticeId);
            } else {
                newPins.add(noticeId);
            }
            return newPins;
        });
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        return () => {
            // cleanup any object URLs created in this component (none after backend refactor)
        };
    }, []);

    // Open edit dialog and populate with notice data (starts in read-only mode)
    function openEditDialog(notice: Notice) {
        setEditingNotice(notice);
        setEditTitle(notice.title);
        setEditCategory(notice.category);
        setEditDescription(notice.description);
        setEditFiles([]);
        setEditDate(notice.date || '');
        setEditTime(notice.time ? convertTo12Hour(notice.time) : '');
        if (editFileInputRef.current) editFileInputRef.current.value = '';
        setIsEditMode(false); // Start in read-only mode
        setEditOpen(true);
    }

    // Map backend props into a typed, UI-friendly array of notices
    const mappedNotices: Notice[] = useMemo(() => {
        return (serverNotices as Array<Record<string, unknown>>).map((n) => {
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
            } as Notice;
        });
    }, [serverNotices]);

    const filteredNotices = useMemo(() => {
        return mappedNotices
            .filter((n) =>
                filterCategory === 'All' ? true : n.category === filterCategory,
            )
            .filter((n) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                    n.title.toLowerCase().includes(q) ||
                    n.username.toLowerCase().includes(q) ||
                    n.description.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => {
                // Sort pinned notices first, then by date
                const aIsPinned = pinnedNotices.has(a.id);
                const bIsPinned = pinnedNotices.has(b.id);

                if (aIsPinned && !bIsPinned) return -1;
                if (!aIsPinned && bIsPinned) return 1;

                // If both are pinned or both are not pinned, sort by date
                return a.createdAt < b.createdAt ? 1 : -1;
            });
    }, [mappedNotices, filterCategory, search, pinnedNotices]);

    // Pagination calculations
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNotices = filteredNotices.slice(startIndex, endIndex);

    // Reset to page 1 when filters change or adjust current page when items per page changes
    useEffect(() => {
        const newTotalPages = Math.ceil(filteredNotices.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (currentPage === 0 && newTotalPages > 0) {
            setCurrentPage(1);
        }
    }, [
        filterCategory,
        search,
        itemsPerPage,
        filteredNotices.length,
        currentPage,
    ]);

    // Programmatically download a file/blob given a URL and an optional filename
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function downloadFile(url: string, filename?: string) {
        const isZip = url.includes('.zip') || url.includes('download-all');
        const downloadName =
            filename || (isZip ? 'notice-attachments.zip' : 'download');

        // For zip files, use a different approach
        if (isZip) {
            try {
                // Create a hidden iframe to handle the download
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);

                // Set the iframe's src to trigger the download
                iframe.src = url;

                // Clean up after a delay
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 5000);

                return;
            } catch (e) {
                console.error(
                    'Iframe download failed, trying direct download...',
                    e,
                );
            }
        }

        // For non-zip files or if iframe method fails
        try {
            // Create a temporary anchor element
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;

            // Add a timestamp to prevent caching
            const timestamp = new Date().getTime();
            const separator = url.includes('?') ? '&' : '?';
            a.href = `${url}${separator}_=${timestamp}`;

            // Append to body, trigger click, and remove
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error('Download error:', e);
            // Final fallback - open in new tab
            window.open(url, '_blank');
        }
    }

    // Reset the create-notice form
    function resetForm() {
        setTitle('');
        setCategory('Announcement');
        setDescription('');
        setFiles([]);
        setDate('');
        setTime('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // Capture multi-file input selection
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files ? Array.from(e.target.files) : [];
        setFiles(list);
    }

    // Inertia form for POST /noticeboard
    const form = useForm<FormData>({
        title: '',
        category: 'Announcement' as Category,
        description: '',
        files: [] as File[],
        date: '',
        time: '',
    });

    // Inertia form for updating a notice
    const editForm = useForm<FormData>({
        title: '',
        category: 'Announcement' as Category,
        description: '',
        files: [] as File[],
        date: '',
        time: '',
    });

    // Submit create-notice request with FormData (supports multi-file)
    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (form.processing) return; // prevent double submit while in-flight

        // Transform form data synchronously before submission
        form.transform(() => ({
            title,
            category,
            description,
            files,
            date,
            time: convertTo24Hour(time), // Convert to 24-hour format for backend
        }));

        // Submit the form
        form.post('/noticeboard', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
                setOpen(false);
            },
            onError: (errors: Record<string, string>) => {
                console.error('Error submitting notice:', errors);
            },
        });
    }

    // Handle edit file input change
    function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files ? Array.from(e.target.files) : [];
        setEditFiles(list);
    }

    // Reset edit form
    function resetEditForm() {
        setEditTitle('');
        setEditCategory('Announcement');
        setEditDescription('');
        setEditFiles([]);
        setEditDate('');
        setEditTime('');
        setIsEditMode(false);
        if (editFileInputRef.current) editFileInputRef.current.value = '';
    }

    // Submit update request
    function onEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingNotice || editForm.processing) return;

        // Transform form data synchronously before submission
        editForm.transform(() => ({
            title: editTitle,
            category: editCategory,
            description: editDescription,
            files: editFiles,
            date: editDate,
            time: convertTo24Hour(editTime), // Convert to 24-hour format for backend
        }));

        // Submit the update (using POST with _method=PUT or PATCH)
        editForm.post(`/noticeboard/${editingNotice.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                resetEditForm();
                setEditOpen(false);
                setEditingNotice(null);
            },
            onError: (errors: Record<string, string>) => {
                console.error('Error updating notice:', errors);
            },
        });
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Noticeboard', href: '/noticeboard' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Noticeboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4">
                {/* Header actions */}
                <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between md:p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Filters and Create button on the left */}
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button
                                    disabled={form.processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-2 text-sm text-white transition hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                >
                                    Create Notice
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create a Notice</DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={onSubmit}
                                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                                >
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) =>
                                                setTitle(e.target.value)
                                            }
                                            placeholder="Enter title"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">
                                            Category
                                        </label>
                                        <Select
                                            value={category}
                                            onValueChange={(value) =>
                                                setCategory(value as Category)
                                            }
                                        >
                                            <SelectTrigger className="w-full border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                                {categoryOptions.map((opt) => (
                                                    <SelectItem
                                                        key={opt}
                                                        value={opt}
                                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                                    >
                                                        {opt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-medium">
                                            Description
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            placeholder="Write the notice details..."
                                            rows={4}
                                            className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) =>
                                                setDate(e.target.value)
                                            }
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">
                                            Time
                                        </label>
                                        <Select
                                            value={time || 'none'}
                                            onValueChange={(value) =>
                                                setTime(
                                                    value === 'none'
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                                <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                                <SelectItem
                                                    value="none"
                                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                                >
                                                    Select time
                                                </SelectItem>
                                                {timeOptions.map(
                                                    (timeOption) => (
                                                        <SelectItem
                                                            key={timeOption}
                                                            value={timeOption}
                                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                                        >
                                                            {timeOption}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-medium">
                                            Attach Files
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleFileChange}
                                            multiple
                                            className="w-full text-sm file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-50 dark:file:border-neutral-700 dark:file:bg-neutral-950 dark:hover:file:bg-neutral-900"
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                        />
                                        {files.length > 0 && (
                                            <div className="text-xs text-gray-600 dark:text-gray-300">
                                                Selected ({files.length}):{' '}
                                                {files
                                                    .map((f) => f.name)
                                                    .join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-3 md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="inline-flex h-[38px] min-w-[120px] items-center justify-center rounded-md bg-[#163832] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163832]/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                        >
                                            {form.processing
                                                ? 'Submitting...'
                                                : 'Submit Notice'}
                                        </button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Select
                            value={filterCategory}
                            onValueChange={(value) =>
                                setFilterCategory(value as 'All' | Category)
                            }
                        >
                            <SelectTrigger className="w-[180px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="All"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    All Categories
                                </SelectItem>
                                {categoryOptions.map((opt) => (
                                    <SelectItem
                                        key={opt}
                                        value={opt}
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) =>
                                setItemsPerPage(parseInt(value))
                            }
                        >
                            <SelectTrigger className="w-[150px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue placeholder="Items per page" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="12"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    12 per page
                                </SelectItem>
                                <SelectItem
                                    value="24"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    24 per page
                                </SelectItem>
                                <SelectItem
                                    value="48"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    48 per page
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <button
                            type="button"
                            onClick={() => {
                                setFilterCategory('All');
                                setSearch('');
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] p-2 text-white transition hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            title="Reset filters"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Search on the right */}
                    <div className="w-full md:w-auto">
                        <SearchBar
                            search={search}
                            onSearchChange={setSearch}
                            placeholder="Search by title or description..."
                            className="w-full md:max-w-md"
                        />
                    </div>
                </div>

                {/* View/Edit Notice Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {isEditMode ? 'Edit Notice' : 'View Notice'}
                            </DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={onEditSubmit}
                            className="grid grid-cols-1 gap-4 md:grid-cols-2"
                        >
                            <div
                                className={`flex flex-col gap-2 ${!isEditMode ? 'md:col-span-2' : ''}`}
                            >
                                <label className="text-sm font-medium">
                                    Title
                                </label>
                                {!isEditMode ? (
                                    <textarea
                                        value={editTitle}
                                        readOnly
                                        rows={
                                            Math.ceil(editTitle.length / 80) ||
                                            1
                                        }
                                        onFocus={(e) => e.target.blur()}
                                        onMouseDown={(e) => e.preventDefault()}
                                        style={{
                                            userSelect: 'none',
                                            resize: 'none',
                                        }}
                                        className="w-full cursor-default rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-950"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) =>
                                            setEditTitle(e.target.value)
                                        }
                                        placeholder="Enter title"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                                        required
                                    />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Category
                                </label>
                                <Select
                                    value={editCategory}
                                    onValueChange={(value) =>
                                        setEditCategory(value as Category)
                                    }
                                    disabled={!isEditMode}
                                >
                                    <SelectTrigger
                                        className={`w-full border-gray-300 dark:border-neutral-700 dark:bg-neutral-950 ${!isEditMode ? 'cursor-default bg-gray-50 dark:bg-neutral-800' : ''}`}
                                    >
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                        {categoryOptions.map((opt) => (
                                            <SelectItem
                                                key={opt}
                                                value={opt}
                                                className="cursor-pointer hover:bg-[#1a4d3e]"
                                            >
                                                {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-sm font-medium">
                                    Description
                                </label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) =>
                                        setEditDescription(e.target.value)
                                    }
                                    placeholder="Write the notice details..."
                                    rows={15}
                                    readOnly={!isEditMode}
                                    onFocus={(e) =>
                                        !isEditMode && e.target.blur()
                                    }
                                    onMouseDown={(e) =>
                                        !isEditMode && e.preventDefault()
                                    }
                                    style={
                                        !isEditMode
                                            ? { userSelect: 'none' }
                                            : undefined
                                    }
                                    className={`w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 ${!isEditMode ? 'cursor-default bg-gray-50 dark:bg-neutral-800' : ''}`}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) =>
                                        setEditDate(e.target.value)
                                    }
                                    readOnly={!isEditMode}
                                    disabled={!isEditMode}
                                    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 ${!isEditMode ? 'cursor-default bg-gray-50 dark:bg-neutral-800' : ''}`}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Time
                                </label>
                                <Select
                                    value={editTime || 'none'}
                                    onValueChange={(value) =>
                                        setEditTime(
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                    disabled={!isEditMode}
                                >
                                    <SelectTrigger
                                        className={`w-full border-gray-300 dark:border-neutral-700 dark:bg-neutral-950 ${!isEditMode ? 'cursor-default bg-gray-50 dark:bg-neutral-800' : ''}`}
                                    >
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                        <SelectItem
                                            value="none"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            Select time
                                        </SelectItem>
                                        {timeOptions.map((timeOption) => (
                                            <SelectItem
                                                key={timeOption}
                                                value={timeOption}
                                                className="cursor-pointer hover:bg-[#1a4d3e]"
                                            >
                                                {timeOption}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Show existing files if any */}
                            {editingNotice && (
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-sm font-medium">
                                        Current Attachments
                                    </label>
                                    {editingNotice.files &&
                                    editingNotice.files.length > 0 ? (
                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                            {editingNotice.files.map(
                                                (f, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="truncate"
                                                    >
                                                        • {f.name}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : editingNotice.file ? (
                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                            • {editingNotice.file.name}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 italic">
                                            No attachments
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Only show file upload in edit mode */}
                            {isEditMode && (
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-sm font-medium">
                                        Replace/Add Files
                                    </label>
                                    <input
                                        ref={editFileInputRef}
                                        type="file"
                                        onChange={handleEditFileChange}
                                        multiple
                                        className="w-full text-sm file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-50 dark:file:border-neutral-700 dark:file:bg-neutral-950 dark:hover:file:bg-neutral-900"
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    />
                                    {editFiles.length > 0 && (
                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                            New files ({editFiles.length}):{' '}
                                            {editFiles
                                                .map((f) => f.name)
                                                .join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                className="flex items-center justify-end md:col-span-2"
                                style={{ gap: '6px' }}
                            >
                                {!isEditMode && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditOpen(false);
                                            resetEditForm();
                                        }}
                                        className="inline-flex h-[38px] min-w-[80px] items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {isEditMode && editingNotice && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (
                                                confirm(
                                                    'Are you sure you want to delete this notice?',
                                                )
                                            ) {
                                                router.delete(
                                                    `/noticeboard/${editingNotice.id}`,
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setEditOpen(false);
                                                            resetEditForm();
                                                        },
                                                    },
                                                );
                                            }
                                        }}
                                        className="inline-flex h-[38px] min-w-[38px] items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 active:scale-[0.98]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                                {!isEditMode ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsEditMode(true);
                                        }}
                                        className="inline-flex h-[38px] min-w-[100px] items-center justify-center rounded-md bg-[#163832] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163832]/90 active:scale-[0.98] dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                    >
                                        Edit Notice
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="inline-flex h-[38px] min-w-[120px] items-center justify-center rounded-md bg-[#163832] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163832]/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                    >
                                        {editForm.processing
                                            ? 'Updating...'
                                            : 'Update Notice'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedNotices.map((n) => {
                        const category = {
                            id: n.category.toLowerCase(),
                            name: n.category,
                            icon: categoryIcon[n.category] || null,
                        };

                        return (
                            <CustomCardPin
                                key={n.id}
                                id={n.id}
                                title={n.title}
                                description={n.description}
                                category={category}
                                username={n.username}
                                createdAt={n.createdAt}
                                date={n.date}
                                time={n.time}
                                files={n.files || (n.file ? [n.file] : [])}
                                files_download_url={n.files_download_url}
                                isPinned={pinnedNotices.has(n.id)}
                                onPinClick={togglePin}
                                onViewClick={() => openEditDialog(n)}
                            />
                        );
                    })}

                    {filteredNotices.length === 0 && (
                        <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-gray-500 dark:border-neutral-700">
                            No notices yet. Create one above.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-4">
                    <CustomPagination
                        currentPage={currentPage}
                        totalItems={filteredNotices.length}
                        perPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
