import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Clock, MoreVertical, Plus, Calendar, Users, ChevronLeft, ChevronRight, Edit3, Trash2, MessageSquare, History } from 'lucide-react';
import React, { useState } from 'react';
import AddUpdateDialog from '@/components/AddUpdateDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskUser {
    id: number;
    name: string;
    avatar?: string | null;
    profile_picture_url?: string | null;
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
    status: 'not_started' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    progress: number;
    created_by: number;
    assignees: number[] | null;
    created_at: string;
    creator?: TaskUser;
    updates?: TaskUpdate[];
}

interface KanbanBoardProps {
    tasks: Task[];
    users: TaskUser[];
    onTaskEdit: (task: Task) => void;
    onTaskDelete: (id: number) => void;
    onTasksUpdate?: (tasks: Task[]) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    not_started: { label: 'Not Started', color: '#6b7280' },
    in_progress: { label: 'In Progress', color: '#3b82f6' },
    in_review: { label: 'In Review', color: '#f97316' },
    completed: { label: 'Completed', color: '#22c55e' },
    cancelled: { label: 'Cancelled', color: '#9ca3af' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Low', color: '#22c55e' },
    medium: { label: 'Medium', color: '#3b82f6' },
    high: { label: 'High', color: '#f97316' },
    urgent: { label: 'Urgent', color: '#ef4444' },
};

function TaskCard({ task, users, onEdit, onDelete }: { task: Task; users: TaskUser[]; onEdit: (task: Task) => void; onDelete: (id: number) => void }) {
    const priority = priorityConfig[task.priority] || priorityConfig.medium;
    const { auth } = usePage().props as any;
    const canEdit = auth.user.role === 'admin' || auth.user.role === 'superadmin' || task.created_by === auth.user.id || (task.assignees && task.assignees.includes(auth.user.id));
    const canDelete = auth.user.role === 'admin' || auth.user.role === 'superadmin' || task.created_by === auth.user.id || (task.assignees && task.assignees.includes(auth.user.id));
    const [showDropdown, setShowDropdown] = useState(false);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showUpdateDropdown, setShowUpdateDropdown] = useState<number | null>(null);
    const [selectedUpdate, setSelectedUpdate] = useState<TaskUpdate | null>(null);
    const [updates, setUpdates] = useState<TaskUpdate[]>(task.updates || []);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
    
    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown) {
                setShowDropdown(false);
            }
            if (showUpdateDropdown !== null) {
                setShowUpdateDropdown(null);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown, showUpdateDropdown]);

    const handleAddUpdate = async (description: string, updateDate: string) => {
        setIsLoadingUpdate(true);
        try {
            const response = await fetch(`/tasks/${task.id}/updates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ description, update_date: updateDate })
            });

            if (response.ok) {
                const data = await response.json();
                setUpdates(prev => [data.update, ...prev]);
                setShowUpdateDialog(false);
            } else {
                console.error('Failed to add update');
            }
        } catch (error) {
            console.error('Error adding update:', error);
        } finally {
            setIsLoadingUpdate(false);
        }
    };

    const handleEditUpdate = async (update: TaskUpdate) => {
        setSelectedUpdate(update);
        setShowUpdateDialog(true);
        setShowUpdateDropdown(null);
    };

    const handleSubmitEditUpdate = async (description: string, updateDate: string) => {
        if (!selectedUpdate) return;
        
        try {
            const response = await fetch(`/task-updates/${selectedUpdate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ description, update_date: updateDate })
            });

            if (response.ok) {
                setShowUpdateDialog(false);
                setSelectedUpdate(null);
                router.reload();
            }
        } catch (error) {
            console.error('Error updating update:', error);
        }
    };

    const handleDeleteUpdate = async (updateId: number) => {
        if (!confirm('Delete this update?')) return;
        
        try {
            const response = await fetch(`/task-updates/${updateId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                setUpdates(prev => prev.filter(u => u.id !== updateId));
            } else {
                console.error('Failed to delete update');
            }
        } catch (error) {
            console.error('Error deleting update:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-move">
            {/* Title */}
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                {task.title}
            </h4>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                    {task.description}
                </p>
            )}

            {/* Priority and Progress Row */}
            <div className="flex items-center justify-between mb-2">
                {/* Priority Badge */}
                <span 
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: priority.color + '20', color: priority.color }}
                >
                    {priority.label}
                </span>
                
                {/* Progress */}
                <div className="flex items-center gap-1">
                    <div className="w-12 bg-gray-200 dark:bg-neutral-700 rounded-full h-1">
                        <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{task.progress}%</span>
                </div>
            </div>

            {/* Updates Section */}
            {(updates.length > 0 || canEdit) && (
                <div className="mb-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <History className="h-3 w-3" />
                            Updates ({updates.length})
                        </div>
                        {canEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUpdateDialog(true);
                                }}
                                className="text-xs text-[#163832] dark:text-[#4ade80] hover:opacity-70"
                            >
                                + Add
                            </button>
                        )}
                    </div>
                    
                    {/* Recent Updates */}
                    {updates.length > 0 && (
                        <div className="space-y-1">
                            {[...updates].sort((a, b) => {
                                const dateA = new Date(b.update_date).getTime();
                                const dateB = new Date(a.update_date).getTime();
                                if (dateA !== dateB) {
                                    return dateA - dateB; // Newest date first
                                }
                                // If dates are the same, sort by created_at (newest first)
                                const createdAtA = new Date(b.created_at).getTime();
                                const createdAtB = new Date(a.created_at).getTime();
                                return createdAtA - createdAtB;
                            }).slice(0, 1).map((update) => (
                                <div key={update.id} className="text-xs p-1.5 bg-gray-50 dark:bg-neutral-700 rounded">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {update.user?.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {formatDate(update.update_date)}
                                            </span>
                                            {canEdit && (
                                                <div className="relative">
                                                    <button 
                                                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowUpdateDropdown(showUpdateDropdown === update.id ? null : update.id);
                                                        }}
                                                    >
                                                        <MoreVertical className="h-2 w-2" />
                                                    </button>
                                                    
                                                    {showUpdateDropdown === update.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg z-[100] min-w-[80px]">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditUpdate(update);
                                                                }}
                                                                className="flex items-center gap-1 w-full px-2 py-1 text-xs text-left hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                            >
                                                                <Edit3 className="h-2 w-2" />
                                                                Edit
                                                            </button>
                                                            <div className="border-t border-gray-200 dark:border-neutral-700" />
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteUpdate(update.id);
                                                                }}
                                                                className="flex items-center gap-1 w-full px-2 py-1 text-xs text-left text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                            >
                                                                <Trash2 className="h-2 w-2" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {update.description}
                                    </p>
                                </div>
                            ))}
                            {updates.length > 1 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                                    +{updates.length - 1} more update{updates.length - 1 > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Row: Assignees and Actions */}
            <div className="flex items-center justify-between">
                {/* Assignees */}
                <div className="flex items-center">
                    {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex -space-x-1">
                            {task.assignees.slice(0, 2).map((assigneeId) => {
                                const assignee = users.find(user => user.id === assigneeId);
                                if (!assignee) return null;
                                return (
                                    <div
                                        key={assignee.id}
                                        className="w-5 h-5 rounded-full border-2 border-white dark:border-neutral-800 object-cover"
                                        title={assignee.name}
                                    >
                                        {assignee.avatar || assignee.profile_picture_url ? (
                                            <img
                                                src={assignee.avatar || assignee.profile_picture_url || ''}
                                                alt={assignee.name}
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {assignee.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {task.assignees.length > 2 && (
                                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                                    +{task.assignees.length - 2}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Users className="h-3 w-3" />
                            Unassigned
                        </div>
                    )}
                </div>

                {/* Actions */}
                {(canEdit || canDelete) && (
                    <div className="relative">
                        <button 
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(!showDropdown);
                            }}
                        >
                            <MoreVertical className="h-3 w-3" />
                        </button>
                        
                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg z-[100] min-w-[100px]">
                                {canEdit && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(task);
                                            setShowDropdown(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                        Edit
                                    </button>
                                )}
                                {canEdit && canDelete && (
                                    <div className="border-t border-gray-200 dark:border-neutral-700" />
                                )}
                                {canDelete && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(task.id);
                                            setShowDropdown(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Update Dialog */}
            <AddUpdateDialog
                isOpen={showUpdateDialog}
                onClose={() => {
                    setShowUpdateDialog(false);
                    setSelectedUpdate(null);
                }}
                onSubmit={selectedUpdate ? handleSubmitEditUpdate : handleAddUpdate}
                isLoading={isLoadingUpdate}
                initialDescription={selectedUpdate?.description || ''}
                initialDate={selectedUpdate?.update_date || ''}
                isEdit={!!selectedUpdate}
            />
        </div>
    );
}

export default function KanbanBoard({ tasks, users, onTaskEdit, onTaskDelete, onTasksUpdate }: KanbanBoardProps) {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [columnPages, setColumnPages] = useState<Record<string, number>>({});

    // Group tasks by status
    const columns = Object.keys(statusConfig).map(status => ({
        id: status,
        title: statusConfig[status].label,
        color: statusConfig[status].color,
        tasks: tasks.filter(task => task.status === status),
    }));

    // Initialize pagination for columns
    React.useEffect(() => {
        const initialPages: Record<string, number> = {};
        columns.forEach(col => {
            if (columnPages[col.id] === undefined) {
                initialPages[col.id] = 1;
            }
        });
        setColumnPages(prev => ({ ...prev, ...initialPages }));
    }, [columns]);

    // Pagination functions
    const getTasksForPage = (tasks: Task[], page: number) => {
        const startIndex = (page - 1) * 5;
        return tasks.slice(startIndex, startIndex + 5);
    };

    const getTotalPages = (taskCount: number) => Math.ceil(taskCount / 5);

    const changePage = (columnId: string, newPage: number) => {
        setColumnPages(prev => ({ ...prev, [columnId]: newPage }));
    };

    // Calculate dynamic height based on actual number of cards in each column
    const getColumnHeight = (taskCount: number) => {
        const displayCards = Math.min(taskCount, 5);
        const cardHeight = 180; // Increased height for better accommodation
        const gapHeight = 16; // Increased gap between cards
        const paddingHeight = 40; // Increased padding
        const moreTasksHeight = taskCount > 5 ? 40 : 0; // Height for "more tasks" indicator
        
        return displayCards > 0 
            ? (displayCards * cardHeight) + ((displayCards - 1) * gapHeight) + paddingHeight + moreTasksHeight
            : 250; // Increased minimum height
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        
        if (draggedTask && draggedTask.status !== newStatus) {
            console.log(`Moving task "${draggedTask.title}" from "${draggedTask.status}" to "${newStatus}"`);
            
            // Update task status via API
            fetch(`/tasks/${draggedTask.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ status: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Task status updated successfully', data);
                setDraggedTask(null);
                
                // Update local state with returned data
                if (data.allTasks && onTasksUpdate) {
                    onTasksUpdate(data.allTasks);
                } else {
                    // Fallback: update the specific task locally
                    const updatedTasks = tasks.map(task => 
                        task.id === draggedTask.id 
                            ? { ...task, status: newStatus as Task['status'] }
                            : task
                    );
                    onTasksUpdate?.(updatedTasks);
                }
            })
            .catch(error => {
                console.error('Failed to update task status:', error);
                setDraggedTask(null);
            });
        } else {
            setDraggedTask(null);
        }
    };

    return (
        <div className="flex gap-3 overflow-x-auto overflow-y-visible pb-4 min-h-0">
            {columns.map((column) => (
                <div
                    key={column.id}
                    className={`flex-shrink-0 w-72 transition-colors ${
                        dragOverColumn === column.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg' 
                            : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: column.color }}
                            />
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {column.title}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {column.tasks.length}
                            </span>
                        </div>
                    </div>

                    {/* Column Content */}
                    <div 
                        className="p-2 rounded-lg bg-gray-50 dark:bg-neutral-800"
                        style={{ minHeight: `${getColumnHeight(column.tasks.length)}px` }}
                    >
                        <div className="space-y-2">
                            {getTasksForPage(column.tasks, columnPages[column.id] || 1).map((task) => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={() => handleDragStart(task)}
                                    className="cursor-move"
                                >
                                    <TaskCard
                                        task={task}
                                        users={users}
                                        onEdit={onTaskEdit}
                                        onDelete={onTaskDelete}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {column.tasks.length > 5 && (
                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-neutral-600">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {columnPages[column.id] || 1} / {getTotalPages(column.tasks.length)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => changePage(column.id, Math.max(1, (columnPages[column.id] || 1) - 1))}
                                        disabled={(columnPages[column.id] || 1) === 1}
                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => changePage(column.id, Math.min(getTotalPages(column.tasks.length), (columnPages[column.id] || 1) + 1))}
                                        disabled={(columnPages[column.id] || 1) === getTotalPages(column.tasks.length)}
                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
