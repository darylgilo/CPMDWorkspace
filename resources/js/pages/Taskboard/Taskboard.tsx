import CustomPagination from '@/components/CustomPagination';
import FormDialog, { type FormField } from '@/components/FormDialog';
import SearchBar from '@/components/SearchBar';
import SimpleStatistic from '@/components/SimpleStatistic';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePopupAlert } from '@/components/ui/popup-alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Clock,
    Edit3,
    Flag,
    MoreVertical,
    Play,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';

interface TaskUser {
    id: number;
    name: string;
    avatar?: string | null;
    profile_picture_url?: string | null;
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    end_date: string | null;
    status:
        | 'not_started'
        | 'in_progress'
        | 'in_review'
        | 'completed'
        | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    progress: number;
    created_by: number;
    assignees: number[] | null;
    created_at: string;
    creator?: TaskUser;
}

interface Analytics {
    total: number;
    notStarted: number;
    inProgress: number;
    inReview: number;
    completed: number;
    cancelled: number;
}

interface PageProps {
    auth: { user: { id: number; role: string; name: string } };
    tasks: {
        data: Task[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    analytics: Analytics;
    users: TaskUser[];
    search: string;
    perPage: number;
    statusFilter: string;
    priorityFilter: string;
    [key: string]: unknown;
}

const statusConfig: Record<
    string,
    { label: string; bg: string; text: string }
> = {
    not_started: { label: 'Not Started', bg: '#f87171', text: '#fff' },
    in_progress: { label: 'In Progress', bg: '#3b82f6', text: '#fff' },
    in_review: { label: 'In Review', bg: '#f97316', text: '#fff' },
    completed: { label: 'Completed', bg: '#22c55e', text: '#fff' },
    cancelled: { label: 'Cancelled', bg: '#9ca3af', text: '#fff' },
};

const priorityAccent: Record<string, string> = {
    low: 'transparent',
    medium: '#3b82f6',
    high: '#f97316',
    urgent: '#ef4444',
};

const priorityPlayColor: Record<string, string> = {
    low: '#22c55e',
    medium: '#3b82f6',
    high: '#f97316',
    urgent: '#ef4444',
};

/* ───── Circular progress SVG ───── */
function ProgressRing({
    progress,
    size = 34,
}: {
    progress: number;
    size?: number;
}) {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;
    const color =
        progress === 100
            ? '#22c55e'
            : progress >= 75
              ? '#3b82f6'
              : progress >= 25
                ? '#f97316'
                : '#d1d5db';

    return (
        <div className="flex items-center gap-1.5">
            <svg
                width={size}
                height={size}
                style={{ transform: 'rotate(-90deg)' }}
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset .35s ease' }}
                />
            </svg>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {progress}%
            </span>
        </div>
    );
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
    const visible = list.slice(0, 6);
    const overflow = list.length - visible.length;

    const colors = ['#163832', '#1a4d3e', '#235347', '#2a6358', '#0f766e'];
    const getUserData = (id: number) => users.find((u) => u.id === id);

    return (
        <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
                {visible.map((uid, i) => {
                    const userData = getUserData(uid);
                    const name = userData?.name ?? `#${uid}`;
                    const avatar =
                        userData?.avatar || userData?.profile_picture_url;
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

/* ───── Column header with sort ───── */
function ColHeader({
    label,
    field,
    sortField,
    sortDir,
    onSort,
    className = '',
}: {
    label: string;
    field: string;
    sortField: string;
    sortDir: 'asc' | 'desc';
    onSort: (f: string) => void;
    className?: string;
}) {
    const active = sortField === field;
    return (
        <th
            className={`cursor-pointer px-6 py-4 text-left text-[11px] font-bold tracking-wider whitespace-nowrap text-gray-500 uppercase select-none dark:text-gray-400 ${className}`}
            onClick={() => onSort(field)}
        >
            <span className="flex items-center gap-1">
                {label}
                {active ? (
                    sortDir === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                    ) : (
                        <ChevronDown className="h-3 w-3" />
                    )
                ) : (
                    <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                )}
            </span>
        </th>
    );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */

const defaultForm: Record<string, string> = {
    title: '',
    description: '',
    end_date: '',
    status: 'not_started',
    priority: 'medium',
    progress: '0',
    assignees: '',
};

export default function Taskboard() {
    const { showSuccess, showError, showDeleted } = usePopupAlert();
    const { props } = usePage<PageProps>();
    const {
        tasks,
        analytics,
        users = [],
        search = '',
        perPage: perPageProp = 10,
        auth,
    } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(tasks?.current_page || 1);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [formData, setFormData] =
        useState<Record<string, string>>(defaultForm);

    const userOptions = useMemo(
        () => users.map((u) => ({ value: u.id.toString(), label: u.name })),
        [users],
    );

    const taskFormFields: FormField[] = [
        {
            name: 'title',
            label: 'Task Title',
            type: 'text',
            required: true,
            placeholder: 'Enter task title',
        },
        {
            name: 'description',
            label: 'Description',
            type: 'text',
            required: false,
            placeholder: 'Brief description',
        },
        { name: 'end_date', label: 'End Date', type: 'date', required: false },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
                { value: 'not_started', label: 'Not Started' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'in_review', label: 'In Review' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
            ],
            placeholder: 'Select status',
        },
        {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            required: true,
            options: [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
            ],
            placeholder: 'Select priority',
        },
        {
            name: 'progress',
            label: 'Progress (0-100)',
            type: 'number',
            required: true,
            min: '0',
        },
        {
            name: 'assignees',
            label: 'Assignees',
            type: 'custom',
            required: false,
            customRender: (v, onChange) => {
                const selected = v ? v.split(',') : [];
                return (
                    <div className="space-y-2">
                        <label className="text-sm leading-none font-medium text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-100">
                            Assignees
                        </label>
                        <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-3 dark:border-neutral-700">
                            <div className="max-h-[160px] space-y-2 overflow-y-auto">
                                {users.map((u) => (
                                    <label
                                        key={u.id}
                                        className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(
                                                u.id.toString(),
                                            )}
                                            onChange={(e) => {
                                                const idStr = u.id.toString();
                                                const next = e.target.checked
                                                    ? [...selected, idStr]
                                                    : selected.filter(
                                                          (id) => id !== idStr,
                                                      );
                                                onChange?.(next.join(','));
                                            }}
                                            className="rounded border-gray-300 text-[#163832] dark:border-neutral-700 dark:bg-neutral-900"
                                        />
                                        <span>{u.name}</span>
                                    </label>
                                ))}
                                {users.length === 0 && (
                                    <span className="text-xs text-gray-400">
                                        No users available.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
    ];

    const resetForm = () => setFormData({ ...defaultForm });

    // Alt + T shortcut to open Add Task dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                resetForm();
                setIsAddOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleAdd = () => {
        resetForm();
        setIsAddOpen(true);
    };
    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description ?? '',
            end_date: task.end_date ? task.end_date.split('T')[0] : '',
            status: task.status,
            priority: task.priority,
            progress: task.progress.toString(),
            assignees: task.assignees?.length ? task.assignees.join(',') : '',
        });
        setIsEditOpen(true);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
        setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    const handleSelectChange = (name: string, value: string) =>
        setFormData((p) => ({ ...p, [name]: value }));

    const handleDelete = (id: number) => {
        if (!window.confirm('Delete this task?')) return;
        router.delete(`/tasks/${id}`, {
            onSuccess: () =>
                showDeleted('Task Deleted', 'Task has been removed.'),
            onError: () => showError('Delete Failed', 'Unable to delete task.'),
        });
    };

    const payload = () => ({
        title: formData.title,
        description: formData.description || null,
        end_date: formData.end_date || null,
        status: formData.status,
        priority: formData.priority,
        progress: parseInt(formData.progress) || 0,
        assignees: formData.assignees
            ? formData.assignees
                  .split(',')
                  .map((a) => parseInt(a))
                  .filter((a) => !isNaN(a))
            : [],
    });

    const handleSubmitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/tasks', payload(), {
            onSuccess: () => {
                showSuccess('Task Added', 'Task created.');
                setIsAddOpen(false);
                resetForm();
            },
            onError: () => showError('Add Failed', 'Unable to add task.'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        setIsSubmitting(true);
        router.put(`/tasks/${selectedTask.id}`, payload(), {
            onSuccess: () => {
                showSuccess('Updated', 'Task updated.');
                setIsEditOpen(false);
                resetForm();
                setSelectedTask(null);
            },
            onError: () => showError('Update Failed', 'Unable to update task.'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/taskboard',
            {
                tab: 'taskboard',
                search: searchValue,
                perPage,
                page,
                sort: sortField,
                direction: sortDir,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSort = (field: string) => {
        const dir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(dir);
        setCurrentPage(1);
        router.get(
            '/taskboard',
            {
                tab: 'taskboard',
                search: searchValue,
                perPage,
                sort: field,
                direction: dir,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const sortedTasks = useMemo(() => {
        if (!tasks?.data) return [];
        return [...tasks.data].sort((a, b) => {
            const av = a[sortField as keyof Task];
            const bv = b[sortField as keyof Task];
            if (typeof av === 'string' && typeof bv === 'string')
                return sortDir === 'asc'
                    ? av.localeCompare(bv)
                    : bv.localeCompare(av);
            if (typeof av === 'number' && typeof bv === 'number')
                return sortDir === 'asc' ? av - bv : bv - av;
            return 0;
        });
    }, [tasks, sortField, sortDir]);

    const formatDate = (d: string | null) =>
        d
            ? new Date(d).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
              })
            : null;

    if (!tasks)
        return (
            <div className="flex items-center justify-center p-8 text-gray-500">
                Loading tasks…
            </div>
        );

    return (
        <>
            {/* ─── Analytics ─── */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <SimpleStatistic
                    label="Total Tasks"
                    value={analytics?.total || 0}
                    icon={ClipboardList}
                    backgroundColor="#163832"
                />
                <SimpleStatistic
                    label="In Progress"
                    value={analytics?.inProgress || 0}
                    icon={Clock}
                    backgroundColor="#1a4d3e"
                />
                <SimpleStatistic
                    label="Completed"
                    value={analytics?.completed || 0}
                    icon={CheckCircle2}
                    backgroundColor="#235347"
                />
                <SimpleStatistic
                    label="Cancelled"
                    value={analytics?.cancelled || 0}
                    icon={XCircle}
                    backgroundColor="#2a6358"
                />
            </div>

            {/* ─── Table card ─── */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                {/* Controls bar */}
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between dark:border-neutral-700">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>Show</span>
                            <Select
                                value={perPage.toString()}
                                onValueChange={(v) => {
                                    const n = parseInt(v);
                                    setPerPage(n);
                                    router.get(
                                        '/taskboard',
                                        {
                                            tab: 'taskboard',
                                            search: searchValue,
                                            perPage: n,
                                        },
                                        { preserveState: true, replace: true },
                                    );
                                }}
                            >
                                <SelectTrigger className="h-8 w-[72px] border-gray-300 text-xs dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    {[10, 25, 50, 100].map((n) => (
                                        <SelectItem
                                            key={n}
                                            value={n.toString()}
                                        >
                                            {n}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span>entries</span>
                        </div>
                    </div>
                    <SearchBar
                        search={searchValue}
                        onSearchChange={setSearchValue}
                        placeholder="Search tasks…"
                        className="w-full md:max-w-xs"
                        searchRoute="/taskboard"
                        additionalParams={{ tab: 'taskboard', perPage }}
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse">
                        {/* thead */}
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-neutral-700">
                                <th className="w-1 py-4" />
                                <ColHeader
                                    label="Task"
                                    field="title"
                                    sortField={sortField}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <ColHeader
                                    label="End Date"
                                    field="end_date"
                                    sortField={sortField}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <ColHeader
                                    label="Status"
                                    field="status"
                                    sortField={sortField}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <ColHeader
                                    label="Priority"
                                    field="priority"
                                    sortField={sortField}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <ColHeader
                                    label="Progress"
                                    field="progress"
                                    sortField={sortField}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <th className="px-6 py-4 text-left text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Assignees
                                </th>
                                <th className="w-12 py-4" />
                            </tr>
                        </thead>

                        <tbody>
                            {/* ── Add New Task inline row ── */}
                            <tr className="group border-b border-dashed border-gray-300 dark:border-neutral-700">
                                <td className="w-1" />
                                <td colSpan={6} className="px-6 py-4">
                                    <button
                                        onClick={handleAdd}
                                        className="flex items-center gap-2 text-sm font-medium text-[#163832] transition-opacity hover:opacity-70 dark:text-[#4ade80]"
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#163832] dark:border-[#4ade80]">
                                            <Plus className="h-3 w-3" />
                                        </span>
                                        Add New Task
                                    </button>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className="text-xs whitespace-nowrap text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
                                        Press Alt + T
                                    </span>
                                </td>
                            </tr>

                            {/* ── Data rows ── */}
                            {sortedTasks.length > 0 ? (
                                sortedTasks.map((task) => {
                                    const accent =
                                        priorityAccent[task.priority] ??
                                        'transparent';
                                    const sc = statusConfig[task.status];
                                    const date = formatDate(task.end_date);
                                    const playColor =
                                        priorityPlayColor[task.priority] ??
                                        '#9ca3af';

                                    return (
                                        <tr
                                            key={task.id}
                                            className="group relative border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                                        >
                                            {/* priority accent bar */}
                                            <td className="w-1 p-0">
                                                <div
                                                    className="h-full min-h-[56px] w-1 rounded-r"
                                                    style={{
                                                        background: accent,
                                                    }}
                                                />
                                            </td>

                                            {/* Task name */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </td>

                                            {/* End date */}
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {date ?? (
                                                    <span className="text-gray-400 italic">
                                                        Set end date
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status badge */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold tracking-wide"
                                                    style={{
                                                        background: sc?.bg,
                                                        color: sc?.text,
                                                    }}
                                                >
                                                    {sc?.label ?? task.status}
                                                </span>
                                            </td>

                                            {/* Priority — flag icon */}
                                            <td className="px-6 py-4">
                                                <div
                                                    className="flex h-7 w-7 items-center justify-center rounded-full border border-current"
                                                    style={{ color: playColor }}
                                                    title={task.priority}
                                                >
                                                    <Flag
                                                        className="h-3 w-3"
                                                        fill="currentColor"
                                                    />
                                                </div>
                                            </td>

                                            {/* Progress ring */}
                                            <td className="px-6 py-4">
                                                <ProgressRing
                                                    progress={task.progress}
                                                />
                                            </td>

                                            {/* Assignees */}
                                            <td className="px-6 py-4">
                                                <AvatarStack
                                                    assignees={task.assignees}
                                                    users={users}
                                                    onAdd={
                                                        auth.user.role ===
                                                            'admin' ||
                                                        auth.user.role ===
                                                            'superadmin' ||
                                                        task.created_by ===
                                                            auth.user.id ||
                                                        (task.assignees &&
                                                            task.assignees.includes(
                                                                auth.user.id,
                                                            ))
                                                            ? () =>
                                                                  handleEdit(
                                                                      task,
                                                                  )
                                                            : undefined
                                                    }
                                                />
                                            </td>

                                            {/* Three-dot menu */}
                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                {(auth.user.role === 'admin' ||
                                                    auth.user.role ===
                                                        'superadmin' ||
                                                    task.created_by ===
                                                        auth.user.id ||
                                                    (task.assignees &&
                                                        task.assignees.includes(
                                                            auth.user.id,
                                                        ))) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <button className="rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-700 dark:hover:text-gray-200">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        task,
                                                                    )
                                                                }
                                                                className="cursor-pointer gap-2"
                                                            >
                                                                <Edit3 className="h-4 w-4" />{' '}
                                                                Edit
                                                            </DropdownMenuItem>
                                                            {(task.created_by ===
                                                                auth.user.id ||
                                                                auth.user
                                                                    .role ===
                                                                    'superadmin' ||
                                                                (auth.user
                                                                    .role ===
                                                                    'admin' &&
                                                                    task.assignees &&
                                                                    task.assignees.includes(
                                                                        auth
                                                                            .user
                                                                            .id,
                                                                    ))) && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                task.id,
                                                                            )
                                                                        }
                                                                        className="cursor-pointer gap-2 text-red-600 dark:text-red-400"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />{' '}
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-16 text-center text-sm text-gray-400"
                                    >
                                        No tasks yet. Click{' '}
                                        <strong>+ Add New Task</strong> above to
                                        get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {tasks?.total > 0 && (
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-neutral-700">
                        <CustomPagination
                            currentPage={currentPage}
                            totalItems={tasks.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* ─── Dialogs ─── */}
            <FormDialog
                isOpen={isAddOpen}
                onOpenChange={(open) => {
                    setIsAddOpen(open);
                    if (!open) resetForm();
                }}
                title="Add New Task"
                description="Create a new task and assign it to a team member."
                fields={taskFormFields}
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                onSubmit={handleSubmitAdd}
                isLoading={isSubmitting}
                submitButtonText="Add Task"
            />
            <FormDialog
                isOpen={isEditOpen}
                onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) {
                        resetForm();
                        setSelectedTask(null);
                    }
                }}
                title="Edit Task"
                description="Update the task details."
                fields={taskFormFields}
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                onSubmit={handleSubmitEdit}
                isLoading={isSubmitting}
                submitButtonText="Update Task"
                isEdit
            />
        </>
    );
}
