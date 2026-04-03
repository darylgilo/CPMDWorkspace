import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Calendar, Edit3, Lock, Lightbulb, MessageSquare, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { renderTextWithLinks } from '@/lib/text-utils';
import { usePopupAlert } from '@/components/ui/popup-alert';
import AddUpdateDialog from '@/components/AddUpdateDialog';

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
    progress?: number | null;
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

interface TaskUpdatesRowProps {
    task: Task;
    onAddUpdate: (task: Task) => void;
}

export default function TaskUpdatesRow({ task, onAddUpdate }: TaskUpdatesRowProps) {
    const { auth } = usePage().props as any;
    const { showError } = usePopupAlert();
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [selectedUpdate, setSelectedUpdate] = useState<TaskUpdate | null>(null);
    const [showDropdown, setShowDropdown] = useState<number | null>(null);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
    const [expandedUpdates, setExpandedUpdates] = useState<Set<number>>(new Set());

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const toggleUpdateExpansion = (updateId: number) => {
        setExpandedUpdates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(updateId)) {
                newSet.delete(updateId);
            } else {
                newSet.add(updateId);
            }
            return newSet;
        });
    };

    // Find the most recent update (highest ID or latest date)
    const mostRecentUpdate = task.updates && task.updates.length > 0 
        ? [...task.updates].sort((a, b) => {
            const dateA = new Date(b.update_date).getTime();
            const dateB = new Date(a.update_date).getTime();
            if (dateA !== dateB) {
                return dateA - dateB;
            }
            // If dates are the same, sort by created_at (newest first)
            const createdAtA = new Date(b.created_at).getTime();
            const createdAtB = new Date(a.created_at).getTime();
            return createdAtA - createdAtB;
        })[0]
        : null;
    
    const canEdit = auth.user.role === 'admin' || 
                   auth.user.role === 'superadmin' || 
                   task.created_by === auth.user.id || 
                   (task.assignees && task.assignees.includes(auth.user.id));

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
                // Check if this was the most recent update
                if (mostRecentUpdate && updateId === mostRecentUpdate.id) {
                    // Find the next most recent update
                    const remainingUpdates = task.updates ? task.updates.filter(u => u.id !== updateId) : [];
                    const nextMostRecent = remainingUpdates.length > 0 
                        ? [...remainingUpdates].sort((a, b) => {
                            const dateA = new Date(b.update_date).getTime();
                            const dateB = new Date(a.update_date).getTime();
                            if (dateA !== dateB) {
                                return dateA - dateB;
                            }
                            const createdAtA = new Date(b.created_at).getTime();
                            const createdAtB = new Date(a.created_at).getTime();
                            return createdAtA - createdAtB;
                        })[0]
                        : null;

                    // If there's a previous update, update task progress to its progress
                    if (nextMostRecent && nextMostRecent.progress !== null && nextMostRecent.progress !== undefined) {
                        try {
                            const progressResponse = await fetch(`/tasks/${task.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                    'X-Requested-With': 'XMLHttpRequest'
                                },
                                body: JSON.stringify({ 
                                    title: task.title,
                                    description: task.description || '',
                                    end_date: task.end_date,
                                    status: task.status,
                                    priority: task.priority,
                                    progress: nextMostRecent.progress,
                                    assignees: task.assignees || []
                                })
                            });

                            if (!progressResponse.ok) {
                                console.error('Failed to revert task progress');
                            }
                        } catch (error) {
                            console.error('Error reverting task progress:', error);
                        }
                    }
                }

                // Refresh the page to show updated state
                router.reload();
            }
        } catch (error) {
            console.error('Error deleting update:', error);
        }
    };

    const handleEditUpdate = (update: TaskUpdate) => {
        setSelectedUpdate(update);
        setShowUpdateDialog(true);
        setShowDropdown(null);
    };

    const handleSubmitEditUpdate = async (description: string, updateDate: string, progress?: number) => {
        if (!selectedUpdate) return;
        
        // For most recent update, find the previous update's progress to use as minimum
        if (mostRecentUpdate && selectedUpdate.id === mostRecentUpdate.id && progress !== undefined) {
            const remainingUpdates = task.updates ? task.updates.filter(u => u.id !== selectedUpdate.id) : [];
            const previousUpdate = remainingUpdates.length > 0 
                ? [...remainingUpdates].sort((a, b) => {
                    const dateA = new Date(b.update_date).getTime();
                    const dateB = new Date(a.update_date).getTime();
                    if (dateA !== dateB) {
                        return dateA - dateB;
                    }
                    const createdAtA = new Date(b.created_at).getTime();
                    const createdAtB = new Date(a.created_at).getTime();
                    return createdAtA - createdAtB;
                })[0]
                : null;

            const minimumProgress = previousUpdate && previousUpdate.progress !== null && previousUpdate.progress !== undefined 
                ? previousUpdate.progress 
                : 0;

            // Progress validation: cannot be less than previous update's progress
            if (progress < minimumProgress) {
                showError('Progress Cannot Decrease', `Please set a value greater than or equal to ${minimumProgress}% (previous update's progress).`);
                return;
            }
        }
        
        setIsLoadingUpdate(true);
        try {
            // First, update the update itself with progress if it's the most recent update
            const response = await fetch(`/task-updates/${selectedUpdate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ 
                    description, 
                    update_date: updateDate, 
                    // Only include progress if this is the most recent update
                    progress: (mostRecentUpdate && selectedUpdate.id === mostRecentUpdate.id) ? progress : undefined
                })
            });

            // If progress is provided and different from current, update the task
            if (progress !== undefined && progress !== task.progress) {
                const progressResponse = await fetch(`/tasks/${task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ 
                        title: task.title,
                        description: task.description || '',
                        end_date: task.end_date,
                        status: task.status,
                        priority: task.priority,
                        progress: progress,
                        assignees: task.assignees || []
                    })
                });

                if (!progressResponse.ok) {
                    console.error('Failed to update task progress');
                }
            }

            if (response.ok) {
                setShowUpdateDialog(false);
                setSelectedUpdate(null);
                router.reload();
            }
        } catch (error) {
            console.error('Error updating update:', error);
        } finally {
            setIsLoadingUpdate(false);
        }
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown !== null) {
                setShowDropdown(null);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

    return (
        <>
            {/* Mobile View */}
            <tr className="lg:hidden">
                <td colSpan={8} className="px-4 py-3 bg-gray-50 dark:bg-neutral-800/50">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Task Updates ({task.updates?.length || 0})
                            </h4>
                            {canEdit && (task.status === 'in_progress' || task.status === 'in_review') && (
                                <button
                                    onClick={() => onAddUpdate(task)}
                                    className="text-xs text-[#163832] dark:text-[#4ade80] hover:opacity-70 flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-700 rounded-md border border-gray-200 dark:border-neutral-600"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span className="hidden sm:inline">Add Update</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                            )}
                        </div>
                        
                        {task.updates && task.updates.length > 0 ? (
                            <div className="space-y-3">
                                <div className="max-h-[32rem] overflow-y-auto space-y-3 px-1 hide-scrollbar">
                                    {[...task.updates].sort((a, b) => {
    const dateA = new Date(b.update_date).getTime();
    const dateB = new Date(a.update_date).getTime();
    if (dateA !== dateB) {
        return dateA - dateB; // Newest date first
    }
    // If dates are the same, sort by created_at (newest first)
    const createdAtA = new Date(b.created_at).getTime();
    const createdAtB = new Date(a.created_at).getTime();
    return createdAtA - createdAtB;
}).map((update) => (
                                        <div key={update.id} className={`bg-white dark:bg-neutral-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-neutral-600 w-full max-w-full overflow-hidden ${
                                            mostRecentUpdate && update.id === mostRecentUpdate.id 
                                                ? 'border-t-4 border-t-[#163832] dark:border-t-[#4ade80]' 
                                                : ''
                                        }`}>
                                            {/* User Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    {update.user?.avatar || update.user?.profile_picture_url ? (
                                                        <img
                                                            src={update.user.avatar || update.user.profile_picture_url || ''}
                                                            alt={update.user?.name}
                                                            className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-neutral-600 flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-[#163832] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                            {update.user?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                {update.user?.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            {/* Progress Display */}
                                                            {update.progress !== null && update.progress !== undefined && (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded-full">
                                                                    <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-[#163832] dark:bg-[#4ade80] rounded-full transition-all duration-200"
                                                                            style={{ width: `${update.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-xs font-medium ${
                                                                        !mostRecentUpdate || update.id !== mostRecentUpdate.id
                                                                            ? 'text-gray-400' 
                                                                            : 'text-gray-700 dark:text-gray-300'
                                                                    }`}>
                                                                        {update.progress}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {/* Date Display */}
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                                {new Date(update.update_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Menu */}
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    {canEdit && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors">
                                                                    <MoreVertical className="h-3 w-3" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900"
                                                            >
                                                                <DropdownMenuItem
                                                                    onClick={() => handleEditUpdate(update)}
                                                                    className="cursor-pointer gap-2 text-xs"
                                                                >
                                                                    <Edit3 className="h-3 w-3" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteUpdate(update.id)}
                                                                    className="cursor-pointer gap-2 text-xs text-red-600 dark:text-red-400"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Update Description */}
                                            <div className="w-full">
                                                <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                                    <p className="break-words hyphens-auto">
                                                        {expandedUpdates.has(update.id) ? (
                                                            renderTextWithLinks(update.description)
                                                        ) : (
                                                            renderTextWithLinks(truncateContent(update.description))
                                                        )}
                                                    </p>
                                                    {update.description.length > 150 && (
                                                        <button
                                                            onClick={() => toggleUpdateExpansion(update.id)}
                                                            className="ml-1 text-xs font-medium text-[#163832] hover:text-[#163832]/80 hover:underline dark:text-[#235347] dark:hover:text-[#235347]/80"
                                                        >
                                                            {expandedUpdates.has(update.id) ? 'Show less' : 'See more'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {task.updates.length > 5 && (
                                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-neutral-600">
                                        <MessageSquare className="h-3 w-3 inline mr-1" />
                                        {task.updates.length} total updates
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium">No updates yet</p>
                                <p className="text-xs mt-1 text-gray-400">Tap "Add Update" to track progress</p>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
            
            {/* Desktop View */}
            <tr className="hidden lg:table-row">
                <td colSpan={9} className="px-6 py-4 bg-gray-50 dark:bg-neutral-800/50">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Task Updates ({task.updates?.length || 0})
                            </h4>
                            {canEdit && (task.status === 'in_progress' || task.status === 'in_review') && (
                                <button
                                    onClick={() => onAddUpdate(task)}
                                    className="text-xs text-[#163832] dark:text-[#4ade80] hover:opacity-70 flex items-center gap-1"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Update
                                </button>
                            )}
                        </div>
                        
                        {task.updates && task.updates.length > 0 ? (
                            <div className="space-y-2">
                                <div className="max-h-64 overflow-y-auto hide-scrollbar space-y-2">
                                    {[...task.updates].sort((a, b) => {
    const dateA = new Date(b.update_date).getTime();
    const dateB = new Date(a.update_date).getTime();
    if (dateA !== dateB) {
        return dateA - dateB; // Newest date first
    }
    // If dates are the same, sort by created_at (newest first)
    const createdAtA = new Date(b.created_at).getTime();
    const createdAtB = new Date(a.created_at).getTime();
    return createdAtA - createdAtB;
}).map((update) => (
                                        <div key={update.id} className="bg-white dark:bg-neutral-700 rounded-lg p-3 border border-gray-200 dark:border-neutral-600 w-full max-w-full overflow-hidden">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {update.user?.avatar || update.user?.profile_picture_url ? (
                                                        <img
                                                            src={update.user.avatar || update.user.profile_picture_url || ''}
                                                            alt={update.user?.name}
                                                            className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-neutral-600"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-[#163832] text-white flex items-center justify-center text-xs font-bold">
                                                            {update.user?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {update.user?.name}
                                                    </span>
                                                    {/* Latest Update Badge */}
                                                    {mostRecentUpdate && update.id === mostRecentUpdate.id && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#163832] text-white dark:bg-[#4ade80] dark:text-[#163832]">
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Progress Display */}
                                                    {update.progress !== null && update.progress !== undefined && (
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded-full">
                                                            <div className="w-8 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-[#163832] dark:bg-[#4ade80] rounded-full"
                                                                    style={{ width: `${update.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-medium ${
                                                                !mostRecentUpdate || update.id !== mostRecentUpdate.id
                                                                    ? 'text-gray-400' 
                                                                    : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                                {update.progress}%
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(update.update_date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    {canEdit && (
                                                        <div className="relative">
                                                            <button 
                                                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded" 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowDropdown(showDropdown === update.id ? null : update.id);
                                                                }}
                                                            >
                                                                <MoreVertical className="h-3 w-3" />
                                                            </button>
                                                            
                                                            {showDropdown === update.id && (
                                                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg z-[100] min-w-[100px]">
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEditUpdate(update);
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                                    >
                                                                        <Edit3 className="h-3 w-3" />
                                                                        Edit
                                                                    </button>
                                                                    <div className="border-t border-gray-200 dark:border-neutral-700" />
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteUpdate(update.id);
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full max-w-[108ch]">
                                                <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                                    <p className="break-words">
                                                        {expandedUpdates.has(update.id) ? (
                                                            renderTextWithLinks(update.description)
                                                        ) : (
                                                            renderTextWithLinks(truncateContent(update.description))
                                                        )}
                                                    </p>
                                                    {update.description.length > 150 && (
                                                        <button
                                                            onClick={() => toggleUpdateExpansion(update.id)}
                                                            className="ml-1 text-sm font-medium text-[#163832] hover:text-[#163832]/80 hover:underline dark:text-[#235347] dark:hover:text-[#235347]/80"
                                                        >
                                                            {expandedUpdates.has(update.id) ? 'Show less' : 'See more'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {task.updates.length > 3 && (
                                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-neutral-600">
                                        Scroll to see all {task.updates.length} updates
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No updates yet</p>
                                <p className="text-xs mt-1">Click "Add Update" to track progress</p>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
            
            {/* Edit Update Dialog */}
            <AddUpdateDialog
                isOpen={showUpdateDialog}
                onClose={() => {
                    setShowUpdateDialog(false);
                    setSelectedUpdate(null);
                }}
                onSubmit={handleSubmitEditUpdate}
                isLoading={isLoadingUpdate}
                initialDescription={selectedUpdate?.description || ''}
                initialDate={selectedUpdate?.update_date || ''}
                initialProgress={selectedUpdate?.progress || 0}
                currentTaskProgress={task.progress}
                isEdit={true}
                isMostRecentUpdate={selectedUpdate ? mostRecentUpdate?.id === selectedUpdate.id : true}
            />
        </>
    );
}
