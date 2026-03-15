import CustomPagination from '@/components/CustomPagination';
import FormDialog, { type FormField } from '@/components/FormDialog';
import SearchBar from '@/components/SearchBar';
import TaskCalendar from '@/components/TaskCalendar';
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
    Clock,
    Edit3,
    Flag,
    ListChecks,
    Loader2,
    MoreVertical,
    Plus,
    Trash2,
} from 'lucide-react';
import React, { ChangeEvent, useMemo, useState } from 'react';

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

interface MyAnalytics {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
}

interface PageProps {
    auth: { user: { id: number; role: string; name: string } };
    myTasks: {
        data: Task[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    myAnalytics: MyAnalytics;
    users: TaskUser[];
    search: string;
    perPage: number;
    [key: string]: unknown;
}

const defaultForm: Record<string, string> = {
    title: '',
    description: '',
    end_date: '',
    status: 'not_started',
    priority: 'medium',
    progress: '0',
    assignees: '',
};

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

/* ── Progress ring ── */
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

function AvatarStack({
    assignees,
    users,
    onAdd,
}: {
    assignees: number[] | null;
    users: TaskUser[];
    onAdd?: () => void;
}) {
    const list = (assignees ?? []).slice(0, 6);
    const overflow = (assignees?.length ?? 0) - list.length;
    const colors = ['#163832', '#1a4d3e', '#235347', '#2a6358'];

    const getUserData = (id: number | string) => users.find((u) => String(u.id) === String(id));

    return (
        <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
                {list.map((uid, i) => {
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
                <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-sidebar-accent dark:text-gray-300">
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
            {!list.length && !onAdd && (
                <span className="text-xs text-gray-400 italic">Unassigned</span>
            )}
        </div>
    );
}

/* ── Sort column header ── */
function ColHeader({
    label,
    field,
    sortField,
    sortDir,
    onSort,
}: {
    label: string;
    field: string;
    sortField: string;
    sortDir: 'asc' | 'desc';
    onSort: (f: string) => void;
}) {
    const active = sortField === field;
    return (
        <th
            className="cursor-pointer py-3 pr-4 pl-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-gray-500 uppercase select-none dark:text-gray-400"
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
                    <ChevronUp className="h-3 w-3 opacity-0" />
                )}
            </span>
        </th>
    );
}

export default function MyTaskboard() {
    const { showSuccess, showError, showDeleted } = usePopupAlert();
    const { props } = usePage<PageProps>();
    const {
        myTasks,
        myAnalytics,
        users = [],
        search = '',
        perPage: perPageProp = 10,
        auth,
    } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(myTasks?.current_page || 1);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [formData, setFormData] =
        useState<Record<string, string>>(defaultForm);

    const resetForm = () => setFormData({ ...defaultForm });

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

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        setIsSubmitting(true);
        router.put(`/tasks/${selectedTask.id}`, payload(), {
            onSuccess: () => {
                showSuccess('Task Updated', 'Changes saved successfully.');
                setIsEditOpen(false);
                resetForm();
                setSelectedTask(null);
            },
            onError: () => showError('Update Failed', 'Unable to update task.'),
            onFinish: () => setIsSubmitting(false),
        });
    };

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
                                {users.length > 0 && (
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border-b border-gray-100 pb-2 mb-2 dark:text-gray-300 dark:hover:text-gray-100 dark:border-neutral-800">
                                        <input
                                            type="checkbox"
                                            checked={users.length > 0 && users.every((u) => selected.some((id) => String(id) === String(u.id)))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    onChange?.(users.map((u) => u.id).join(','));
                                                } else {
                                                    onChange?.('');
                                                }
                                            }}
                                            className="rounded border-gray-300 text-[#163832] dark:border-neutral-700 dark:bg-neutral-900"
                                        />
                                        <span>Select All</span>
                                    </label>
                                )}
                                {users.map((u) => (
                                    <label
                                        key={u.id}
                                        className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.some((id) => String(id) === String(u.id))}
                                            onChange={(e) => {
                                                const idStr = u.id.toString();
                                                const alreadyExists = selected.some((id) => String(id) === idStr);
                                                const next = e.target.checked
                                                    ? (alreadyExists ? selected : [...selected, idStr])
                                                    : selected.filter((id) => String(id) !== idStr);
                                                onChange?.(next.join(','));
                                            }}
                                            className="rounded border-gray-300 text-[#163832] dark:border-neutral-700 dark:bg-neutral-900"
                                        />
                                        <div 
                                            className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center bg-[#163832] text-[10px] font-bold text-white shrink-0"
                                            title={u.name}
                                        >
                                            {u.profile_picture_url || u.avatar ? (
                                                <img 
                                                    src={(u.profile_picture_url || u.avatar) as string} 
                                                    alt={u.name} 
                                                    className="h-full w-full object-cover" 
                                                />
                                            ) : (
                                                <span>{u.name.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/taskboard',
            {
                tab: 'mytaskboard',
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
                tab: 'mytaskboard',
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
        if (!myTasks?.data) return [];
        return [...myTasks.data].sort((a, b) => {
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
    }, [myTasks, sortField, sortDir]);

    const formatDate = (d: string | null) => {
        if (!d)
            return (
                <span className="text-xs text-gray-400 italic">
                    Set end date
                </span>
            );
        const date = new Date(d);
        const overdue = date < new Date();
        return (
            <span
                className={
                    overdue
                        ? 'font-semibold text-red-600 dark:text-red-400'
                        : ''
                }
            >
                {date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                })}
            </span>
        );
    };

    if (!myTasks)
        return (
            <div className="flex items-center justify-center p-8 text-gray-500">
                Loading your tasks…
            </div>
        );

    return (
        <div className="flex flex-col gap-2">
            {/* Task Calendar */}
            <div className="mb-3">
                <TaskCalendar 
                    tasks={myTasks.data} 
                    users={users}
                    onTaskClick={(task) => {
                        // Handle task click - you can open edit dialog or navigate to task details
                        console.log('Task clicked:', task);
                    }}
                />
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                {/* Controls bar */}
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between dark:border-neutral-700">
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
                                        tab: 'mytaskboard',
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
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>entries</span>
                    </div>
                    <SearchBar
                        search={searchValue}
                        onSearchChange={setSearchValue}
                        placeholder="Search my tasks…"
                        className="w-full md:max-w-xs"
                        searchRoute="/taskboard"
                        additionalParams={{ tab: 'mytaskboard', perPage }}
                    />
                </div>

                <div className="overflow-x-auto">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                        <table className="w-full min-w-[900px] border-collapse">
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
                                <th className="px-6 py-4 text-left text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Creator
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedTasks.length > 0 ? (
                                sortedTasks.map((task) => {
                                    const accent =
                                        priorityAccent[task.priority] ??
                                        'transparent';
                                    const sc = statusConfig[task.status];
                                    const playColor =
                                        priorityPlayColor[task.priority] ??
                                        '#9ca3af';

                                    return (
                                        <tr
                                            key={task.id}
                                            className="group border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                                        >
                                            {/* accent bar */}
                                            <td className="w-1 p-0">
                                                <div
                                                    className="h-full min-h-[56px] w-1 rounded-r"
                                                    style={{
                                                        background: accent,
                                                    }}
                                                />
                                            </td>

                                            {/* Task */}
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
                                                {formatDate(task.end_date)}
                                            </td>

                                            {/* Status */}
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

                                            {/* Priority */}
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

                                            {/* Progress */}
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

                                            {/* Creator */}
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {task.creator?.name ??
                                                    'Unknown'}
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
                                        colSpan={9}
                                        className="py-16 text-center text-sm text-gray-400"
                                    >
                                        You have no tasks assigned to you yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3 p-4">
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
                                    <div
                                        key={task.id}
                                        className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 shadow-sm"
                                    >
                                        {/* Priority accent bar */}
                                        <div
                                            className="h-1 w-full rounded-t-lg mb-3"
                                            style={{ background: accent }}
                                        />

                                        {/* Task Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                    {task.title}
                                                </h3>
                                                {task.description && (
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="ml-2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(task)}
                                                        className="cursor-pointer gap-2"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(task.id)}
                                                        className="cursor-pointer gap-2 text-red-600 dark:text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Task Details Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            {/* Status */}
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                                <span
                                                    className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold tracking-wide"
                                                    style={{
                                                        background: sc?.bg,
                                                        color: sc?.text,
                                                    }}
                                                >
                                                    {sc?.label ?? task.status}
                                                </span>
                                            </div>

                                            {/* Priority */}
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Priority</p>
                                                <div
                                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-current"
                                                    style={{ color: playColor }}
                                                    title={task.priority}
                                                >
                                                    <Flag
                                                        className="h-3 w-3"
                                                        fill="currentColor"
                                                    />
                                                </div>
                                            </div>

                                            {/* End Date */}
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                                    {date || 'No date'}
                                                </p>
                                            </div>

                                            {/* Progress */}
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                                                <ProgressRing progress={task.progress} size={24} />
                                            </div>
                                        </div>

                                        {/* Assignees */}
                                        <div className="pt-3 border-t border-gray-100 dark:border-neutral-800">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Assignees</p>
                                            <AvatarStack
                                                assignees={task.assignees}
                                                users={users}
                                                onAdd={() => handleEdit(task)}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                You have no tasks assigned to you yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {myTasks?.total > 0 && (
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-neutral-700">
                        <CustomPagination
                            currentPage={currentPage}
                            totalItems={myTasks.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
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
                description="Update your task details."
                fields={taskFormFields}
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                onSubmit={handleSubmitEdit}
                isLoading={isSubmitting}
                submitButtonText="Update Task"
                isEdit
            />
        </div>
    );
}
