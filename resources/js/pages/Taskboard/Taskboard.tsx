import CustomPagination from '@/components/CustomPagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import FormDialog, { type FormField } from '@/components/FormDialog';
import KanbanBoard from '@/components/KanbanBoard';
import SearchBar from '@/components/SearchBar';
import SimpleStatistic from '@/components/SimpleStatistic';
import AddUpdateDialog from '@/components/AddUpdateDialog';
import TaskUpdatesRow from '@/components/TaskUpdatesRow';
import { type PaginatedData } from '@/types/ppmp';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    Eye,
    Flag,
    LayoutGrid,
    Lightbulb,
    List,
    MessageSquare,
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
    office?: string;
    status?: string;
    email_verified_at?: string | null;
}

interface TaskUpdate {
    id: number;
    description: string;
    update_date: string;
    created_at: string;
    user: TaskUser;
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
    updates?: TaskUpdate[];
    office?: string | null;
    section_id?: number | null;
    section?: {
        id: number;
        name: string;
        code: string;
        office: string;
    } | null;
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
    auth: { user: { id: number; role: string; name: string; office: string } };
    tasks: PaginatedData<Task>;
    allTasks: Task[];
    analytics: Analytics;
    users: TaskUser[];
    search: string;
    perPage: number;
    statusFilter: string;
    priorityFilter: string;
    sections: Array<{
        id: number;
        name: string;
        code: string;
        office: string;
    }>;
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
    const getUserData = (id: number | string) => users.find((u) => String(u.id) === String(id));

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
    section_id: '',
};

export default function Taskboard() {
    const { showSuccess, showError, showDeleted } = usePopupAlert();
    const { props } = usePage<PageProps>();
    const {
        tasks,
        allTasks,
        analytics,
        users = [],
        search = '',
        perPage: perPageProp = 10,
        statusFilter: status = 'all',
        section = '',
        sections = [],
        auth,
    } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sectionFilter, setSectionFilter] = useState<string>(typeof section === 'string' ? section : 'all');
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(tasks?.current_page || 1);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [currentAllTasks, setCurrentAllTasks] = useState<Task[]>(allTasks || []);
    const [formData, setFormData] =
        useState<Record<string, string>>(defaultForm);
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<Task | null>(null);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [mobileUpdatesModal, setMobileUpdatesModal] = useState<{ isOpen: boolean; task: Task | null }>({ isOpen: false, task: null });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleTasksUpdate = (updatedTasks: Task[]) => {
        setCurrentAllTasks(updatedTasks);
    };

    const toggleRowExpansion = (taskId: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const openMobileUpdatesModal = (task: Task) => {
        setMobileUpdatesModal({ isOpen: true, task });
    };

    const closeMobileUpdatesModal = () => {
        setMobileUpdatesModal({ isOpen: false, task: null });
    };

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
            name: 'office',
            label: 'Office',
            type: 'custom',
            required: false,
            customRender: (value, onChange) => {
                return (
                    <div className="space-y-2">
                        <label className="text-sm leading-none font-medium text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-100">
                            Office
                        </label>
                        <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100">
                            {auth.user?.office || 'Not specified'}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Office is automatically set based on your profile
                        </p>
                    </div>
                );
            },
        },
        {
            name: 'section_id',
            label: 'Section',
            type: 'select',
            required: false,
            options: sections?.filter(s => s.office === auth.user?.office).map(s => ({ value: s.id.toString(), label: s.name })) || [],
            placeholder: 'Select section',
        },
        {
            name: 'progress',
            label: 'Progress',
            type: 'custom',
            required: false,
            customRender: (value, onChange) => {
                const progress = parseInt(value) || 0;
                
                return (
                    <div className="space-y-3">
                        <label className="text-sm leading-none font-medium text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-100">
                            Progress: {progress}%
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                (Updates only via task updates)
                            </span>
                        </label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                disabled
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed dark:bg-gray-700 opacity-50"
                                style={{
                                    background: `linear-gradient(to right, #163832 0%, #163832 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                Progress can only be updated when adding task updates
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            name: 'assignees',
            label: 'Assignees',
            type: 'custom',
            required: false,
            customRender: (v, onChange) => {
                const selected = v ? v.split(',') : [];

                // Filter users based on search
                // Note: Users are already filtered on backend to show only:
                // - Same office users (or users with section_id)
                // - Active users only
                // - Email verified users only
                const filteredUsers = users.filter(user => 
                    user.name.toLowerCase().includes(assigneeSearch.toLowerCase())
                );

                return (
                    <div className="space-y-2">
                        <label className="text-sm leading-none font-medium text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-100">
                            Assign to
                        </label>
                        <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-3 dark:border-neutral-700">
                            <div className="mb-2">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={assigneeSearch}
                                    onChange={(e) => setAssigneeSearch(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div className="max-h-[160px] space-y-2 overflow-y-auto">
                                {filteredUsers.length > 0 && (
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border-b border-gray-100 pb-2 mb-2 dark:text-gray-300 dark:hover:text-gray-100 dark:border-neutral-800">
                                        <input
                                            type="checkbox"
                                            checked={filteredUsers.length > 0 && filteredUsers.every((u) => selected.some((id) => String(id) === String(u.id)))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    onChange?.(filteredUsers.map((u) => u.id).join(','));
                                                } else {
                                                    onChange?.('');
                                                }
                                            }}
                                            className="rounded border-gray-300 text-[#163832] dark:border-neutral-700 dark:bg-neutral-900"
                                        />
                                        <span>Select All ({filteredUsers.length})</span>
                                    </label>
                                )}
                                {filteredUsers.map((u) => (
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
                                {filteredUsers.length === 0 && (
                                    <span className="text-xs text-gray-400">
                                        No users found matching "{assigneeSearch}"
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

    // Remove automatic status filtering - let 'all' show all tasks

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
            section_id: task.section_id?.toString() ?? '',
        });
        setIsEditOpen(true);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
        setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    const handleSelectChange = (name: string, value: string) =>
        setFormData((p) => ({ ...p, [name]: value }));

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        
        setShowDeleteConfirm(false);
        router.delete(`/tasks/${deleteId}`, {
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
        office: auth.user?.office || null,
        section_id: formData.section_id ? parseInt(formData.section_id) : null,
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

    const handleAddUpdate = (task: Task) => {
        // Only allow updates if task is in progress or in review
        if (task.status !== 'in_progress' && task.status !== 'in_review') {
            showError('Update Not Allowed', 'Updates can only be added to tasks that are in progress or in review.');
            return;
        }

        // Check if user is the creator or assigned to the task
        const currentUserId = auth.user?.id;
        const isCreator = task.created_by === currentUserId;
        const isAssignee = task.assignees?.includes(currentUserId || 0);
        
        if (!isCreator && !isAssignee) {
            showError('Access Denied', 'Only the task creator and assigned users can add updates.');
            return;
        }

        setSelectedTaskForUpdate(task);
        setShowUpdateDialog(true);
    };

    const handleSubmitUpdate = async (description: string, updateDate: string, progress?: number) => {
        if (!selectedTaskForUpdate) return;
        
        // Progress validation: cannot be less than current task progress
        if (progress !== undefined && progress < selectedTaskForUpdate.progress) {
            showError('Progress Cannot Decrease', 'Please set a value greater than or equal to current progress.');
            return;
        }
        
        setIsLoadingUpdate(true);
        try {
            // First, add the update with progress
            const response = await fetch(`/tasks/${selectedTaskForUpdate.id}/updates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ description, update_date: updateDate, progress })
            });

            // If progress is provided and different from current, update the task
            if (progress !== undefined && progress !== selectedTaskForUpdate.progress) {
                const progressResponse = await fetch(`/tasks/${selectedTaskForUpdate.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ 
                        title: selectedTaskForUpdate.title,
                        description: selectedTaskForUpdate.description || '',
                        end_date: selectedTaskForUpdate.end_date,
                        status: selectedTaskForUpdate.status,
                        priority: selectedTaskForUpdate.priority,
                        progress: progress,
                        assignees: selectedTaskForUpdate.assignees || []
                    })
                });

                if (!progressResponse.ok) {
                    console.error('Failed to update task progress');
                    showError('Progress Update Failed', 'Task update was added but progress could not be updated.');
                } else {
                    showSuccess('Progress Updated', 'Task progress has been updated successfully.');
                }
            }

            if (response.ok) {
                const data = await response.json();
                showSuccess('Update Added', 'Task update added successfully.');
                setShowUpdateDialog(false);
                
                // Refresh the page to show the new update and updated progress
                router.reload();
            } else {
                showError('Update Failed', 'Unable to add task update.');
            }
        } catch (error) {
            showError('Update Failed', 'Unable to add task update.');
        } finally {
            setIsLoadingUpdate(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/taskboard',
            {
                tab: 'taskboard',
                search: searchValue,
                status: statusFilter,
                section: sectionFilter,
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
                status: statusFilter,
                section: sectionFilter,
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
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4 md:gap-4">
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
                <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 dark:border-neutral-700">
                    {/* Mobile View Toggle - Centered, full width */}
                    <div className="flex justify-center md:hidden">
                        <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg shadow-sm">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-200 dark:ring-neutral-600'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-700'
                                }`}
                            >
                                <List className="h-4 w-4" />
                                <span>Table</span>
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    viewMode === 'kanban'
                                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-200 dark:ring-neutral-600'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-700'
                                }`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span>Kanban</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters Row - Different layout for mobile vs desktop */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-3">
                        {/* Mobile Layout - Two rows */}
                        <div className="flex flex-col gap-3 w-full md:hidden">
                            {/* First Row - Status & Section */}
                            <div className="flex gap-3 w-full">
                                {/* Status Filter */}
                                <div className="flex-1">
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value: string) => {
                                            setStatusFilter(value);
                                            const params = {
                                                tab: 'taskboard' as const,
                                                search: searchValue,
                                                status: value,
                                                section: sectionFilter,
                                                perPage,
                                            };
                                            router.get('/taskboard', params, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="in_review">In Review</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="not_started">Not Started</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Section Filter */}
                                <div className="flex-1">
                                    <Select
                                        value={sectionFilter}
                                        onValueChange={(value: string) => {
                                            setSectionFilter(value);
                                            const params: Record<string, string | number> = {
                                                tab: 'taskboard',
                                                search: searchValue,
                                                status: statusFilter,
                                                section: value,
                                                perPage,
                                            };
                                            router.get('/taskboard', params, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100">
                                            <SelectValue placeholder="Section" />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {(() => {
                                                try {
                                                    if (!sections || !auth.user?.office) return null;
                                                    return sections
                                                        .filter(s => s && s.office === auth.user.office)
                                                        .map((section) => (
                                                            <SelectItem key={section.id} value={section.id.toString()}>
                                                                {section.name || 'Unknown Section'}
                                                            </SelectItem>
                                                        ));
                                                } catch (error) {
                                                    console.error('Error rendering sections:', error);
                                                    return null;
                                                }
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Second Row - Per Page & Search */}
                            <div className="flex gap-3 w-full">
                                {/* Per Page Filter */}
                                <div className="w-32">
                                    <Select
                                        value={perPage.toString()}
                                        onValueChange={(v: string) => {
                                            const n = parseInt(v);
                                            setPerPage(n);
                                            const params: Record<string, string | number> = {
                                                tab: 'taskboard',
                                                search: searchValue,
                                                status: statusFilter,
                                                section: sectionFilter,
                                                perPage: n,
                                            };
                                            router.get('/taskboard', params, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100">
                                            <SelectValue placeholder="Entries" />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                            {[10, 25, 50, 100].map((n) => (
                                                <SelectItem
                                                    key={n}
                                                    value={n.toString()}
                                                >
                                                    {n} entries
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Search Bar */}
                                <div className="flex-1">
                                    <SearchBar
                                        search={searchValue}
                                        onSearchChange={setSearchValue}
                                        placeholder="Search tasks…"
                                        className="w-full"
                                        searchRoute="/taskboard"
                                        additionalParams={{ tab: 'taskboard', status: statusFilter, section: sectionFilter, perPage: perPage } as Record<string, string | number>}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Layout - Single row with view toggle */}
                        <div className="hidden md:flex md:flex-row md:items-center md:gap-3 md:w-full">
                            {/* View Toggle - Now in the same row */}
                            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg shadow-sm">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-200 dark:ring-neutral-600'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-700'
                                    }`}
                                >
                                    <List className="h-4 w-4" />
                                    <span>Table</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                        viewMode === 'kanban'
                                            ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-200 dark:ring-neutral-600'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-700'
                                    }`}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    <span>Kanban</span>
                                </button>
                            </div>

                            {/* Left Filters */}
                            <div className="flex flex-row items-center gap-3 flex-1">
                                {/* Status Filter */}
                                <div className="md:w-auto">
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value: string) => {
                                            setStatusFilter(value);
                                            const params = {
                                                tab: 'taskboard' as const,
                                                search: searchValue,
                                                status: value,
                                                section: sectionFilter,
                                                perPage,
                                            };
                                            router.get('/taskboard', params, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="in_review">In Review</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="not_started">Not Started</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Section Filter */}
                                <div className="md:w-auto">
                                    <Select
                                        value={sectionFilter}
                                        onValueChange={(value: string) => {
                                            setSectionFilter(value);
                                            const params: Record<string, string | number> = {
                                                tab: 'taskboard',
                                                search: searchValue,
                                                status: statusFilter,
                                                section: value,
                                                perPage,
                                            };
                                            router.get('/taskboard', params, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100">
                                            <SelectValue placeholder="Section" />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {(() => {
                                                try {
                                                    if (!sections || !auth.user?.office) return null;
                                                    return sections
                                                        .filter(s => s && s.office === auth.user.office)
                                                        .map((section) => (
                                                            <SelectItem key={section.id} value={section.id.toString()}>
                                                                {section.name || 'Unknown Section'}
                                                            </SelectItem>
                                                        ));
                                                } catch (error) {
                                                    console.error('Error rendering sections:', error);
                                                    return null;
                                                }
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Per Page Filter */}
                                <div className="md:w-auto">
                                    <Select
                                        value={perPage.toString()}
                                        onValueChange={(v: string) => {
                                            const n = parseInt(v);
                                            setPerPage(n);
                                            const params: Record<string, string | number> = {
                                                tab: 'taskboard',
                                                search: searchValue,
                                                status: statusFilter,
                                                section: sectionFilter,
                                                perPage: n,
                                            };
                                            router.get('/taskboard', params, { preserveState: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100">
                                            <SelectValue placeholder="Entries" />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                            {[10, 25, 50, 100].map((n) => (
                                                <SelectItem
                                                    key={n}
                                                    value={n.toString()}
                                                >
                                                    {n} entries
                                                </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Search Bar - On the right */}
                            <div className="md:w-auto md:max-w-xs">
                                <SearchBar
                                    search={searchValue}
                                    onSearchChange={setSearchValue}
                                    placeholder="Search tasks…"
                                    className="w-full"
                                    searchRoute="/taskboard"
                                    additionalParams={{ tab: 'taskboard', status: statusFilter, section: sectionFilter, perPage: perPage } as Record<string, string | number>}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'table' ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse">
                            {/* thead */}
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-neutral-700">
                                    <th className="w-1 py-4" />
                                    <th className="px-6 py-4 text-left text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400 cursor-pointer select-none"
                                        onClick={() => handleSort('title')}>
                                        <span className="flex items-center gap-1">
                                            Task
                                            {sortField === 'title' ? (
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
                                    <th className="px-6 py-4 text-left text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400 cursor-pointer select-none"
                                        onClick={() => handleSort('end_date')}>
                                        <span className="flex items-center gap-1">
                                            End Date
                                            {sortField === 'end_date' ? (
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
                                    <th className="px-6 py-4 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400 cursor-pointer select-none"
                                        onClick={() => handleSort('status')}>
                                        <span className="flex items-center justify-center gap-1">
                                            Status
                                            {sortField === 'status' ? (
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
                                    <th className="px-6 py-4 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400 cursor-pointer select-none"
                                        onClick={() => handleSort('priority')}>
                                        <span className="flex items-center justify-center gap-1">
                                            Priority
                                            {sortField === 'priority' ? (
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
                                    <th className="px-6 py-4 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400 cursor-pointer select-none"
                                        onClick={() => handleSort('progress')}>
                                        <span className="flex items-center justify-center gap-1">
                                            Progress
                                            {sortField === 'progress' ? (
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
                                    <th className="px-6 py-4 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Assignees
                                    </th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Section
                                    </th>
                                    <th className="w-12 py-4" />
                                </tr>
                            </thead>

                            <tbody>
                                {/* ── Add New Task inline row ── */}
                                <tr className="group border-b border-dashed border-gray-300 dark:border-neutral-700">
                                    <td className="w-1" />
                                    <td colSpan={7} className="px-6 py-4">
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
                                            <>
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

                                                {/* Task */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleRowExpansion(task.id)}
                                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                                                        >
                                                            {expandedRows.has(task.id) ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {task.title}
                                                            </p>
                                                            {task.description && (
                                                                <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                                                                    {task.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* End date */}
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-left">
                                                    {formatDate(task.end_date)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 text-center">
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
                                                <td className="px-6 py-4 text-center">
                                                    <div
                                                        className="flex h-7 w-7 items-center justify-center rounded-full border border-current mx-auto"
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
                                                <td className="px-6 py-4 text-left">
                                                    <ProgressRing
                                                        progress={task.progress}
                                                    />
                                                </td>

                                                {/* Assignees */}
                                                <td className="px-6 py-4 text-center">
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

                                                {/* Section */}
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 text-left">
                                                    {task.section?.name || (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Not specified
                                                        </span>
                                                    )}
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
                                                                    <Edit3 className="h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {(task.status === 'in_progress' || task.status === 'in_review') && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleAddUpdate(
                                                                                task,
                                                                            )
                                                                        }
                                                                        className="cursor-pointer gap-2"
                                                                    >
                                                                        <MessageSquare className="h-4 w-4" />
                                                                        Add Update
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            task.id,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer gap-2 text-red-600 dark:text-red-400"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </td>
                                            </tr>
                                            {/* Expandable row for updates */}
                                            {expandedRows.has(task.id) && (
                                                <TaskUpdatesRow task={task} onAddUpdate={handleAddUpdate} />
                                            )}
                                            </>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center">
                                            <div className="text-gray-400">
                                                No tasks found. Click
                                                <strong>+ Add New Task</strong> above to
                                                get started.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3 p-4">
                            {/* Add New Task Mobile Button */}
                            <button
                                onClick={handleAdd}
                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-[#163832] transition-opacity hover:opacity-70 dark:border-neutral-600 dark:text-[#4ade80]"
                            >
                                <Plus className="h-4 w-4" />
                                Add New Task
                            </button>

                            {/* Task Cards */}
                            {sortedTasks.length > 0 ? (
                                sortedTasks.map((task) => {
                                    const accent = priorityAccent[task.priority] ?? 'transparent';
                                    const sc = statusConfig[task.status];
                                    const date = formatDate(task.end_date);
                                    const playColor = priorityPlayColor[task.priority] ?? '#9ca3af';

                                    return (
                                        <>
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
                                                {(auth.user.role === 'admin' ||
                                                    auth.user.role === 'superadmin' ||
                                                    task.created_by === auth.user.id ||
                                                    (task.assignees && task.assignees.includes(auth.user.id))) && (
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
                                                            {(task.status === 'in_progress' || task.status === 'in_review') && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleAddUpdate(task)}
                                                                    className="cursor-pointer gap-2"
                                                                >
                                                                    <MessageSquare className="h-4 w-4" />
                                                                    Add Update
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => openMobileUpdatesModal(task)}
                                                                className="cursor-pointer gap-2 lg:hidden"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                View Update
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
                                                )}
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
                                                        <Flag className="h-3 w-3" fill="currentColor" />
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
                                                    onAdd={
                                                        auth.user.role === 'admin' ||
                                                        auth.user.role === 'superadmin' ||
                                                        task.created_by === auth.user.id ||
                                                        (task.assignees && task.assignees.includes(auth.user.id))
                                                            ? () => handleEdit(task)
                                                            : undefined
                                                    }
                                                />
                                            </div>
                                        </div>
                                                                                    </>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No tasks found. Click <strong>+ Add New Task</strong> above to get started.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-4">
                        <KanbanBoard
                            tasks={viewMode === 'kanban' ? currentAllTasks : sortedTasks}
                            users={users}
                            onTaskEdit={handleEdit}
                            onTaskDelete={handleDelete}
                            onTasksUpdate={handleTasksUpdate}
                        />
                    </div>
                )}

                {/* Pagination */}
                {viewMode === 'table' && (tasks?.total ?? 0) > 0 && (
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-neutral-700">
                        <CustomPagination
                            currentPage={currentPage}
                            totalItems={tasks?.total ?? 0}
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
            
            {/* Update Dialog */}
            <AddUpdateDialog
                isOpen={showUpdateDialog}
                onClose={() => {
                    setShowUpdateDialog(false);
                    setSelectedTaskForUpdate(null);
                }}
                onSubmit={handleSubmitUpdate}
                isLoading={isLoadingUpdate}
                initialProgress={selectedTaskForUpdate?.progress || 0}
                isMostRecentUpdate={true}
            />
            
            {/* Mobile Updates Modal */}
            <Dialog open={mobileUpdatesModal.isOpen} onOpenChange={closeMobileUpdatesModal}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {mobileUpdatesModal.task?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {mobileUpdatesModal.task && (
                        <div className="flex justify-center">
                            <TaskUpdatesRow task={mobileUpdatesModal.task} onAddUpdate={handleAddUpdate} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </>
    );
}
