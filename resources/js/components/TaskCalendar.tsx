import { ChevronLeft, ChevronRight, Calendar, ListChecks, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

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
    status: 'not_started' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    progress: number;
    created_by: number;
    assignees: number[] | null;
    created_at: string;
    creator?: TaskUser;
}

interface TaskCalendarProps {
    tasks: Task[];
    users?: Array<{
        id: number;
        name: string;
        avatar?: string | null;
    }>;
    onTaskClick?: (task: Task) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, users = [], onTaskClick }) => {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const getWeekDays = (startDate: Date) => {
        const days = [];
        const startOfWeek = new Date(startDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const formatDay = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short' 
        });
    };

    const getTasksForDate = (date: Date) => {
        return tasks.filter(task => {
            if (!task.end_date) return false;
            const taskEndDate = new Date(task.end_date);
            
            // Calculate start date
            let taskStartDate: Date;
            if (task.progress > 0 && task.created_at) {
                taskStartDate = new Date(task.created_at);
            } else {
                taskStartDate = new Date(taskEndDate);
            }
            
            // Check if date falls within the task duration
            return date >= taskStartDate && date <= taskEndDate;
        });
    };

    const isWeekend = (date: Date) => {
        return date.getDay() === 0 || date.getDay() === 6;
    };

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentWeekStart(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setDate(prev.getDate() - 7);
            } else {
                newDate.setDate(prev.getDate() + 7);
            }
            return newDate;
        });
    };

    const weekDays = getWeekDays(currentWeekStart);

    // Filter tasks based on selected year and date range
    const filteredTasks = tasks.filter(task => {
        if (!task.end_date) return false;
        
        const taskEndDate = new Date(task.end_date);
        const taskYear = taskEndDate.getFullYear();
        
        // Check if task year matches selected year
        if (taskYear !== selectedYear) return false;
        
        // Calculate start date
        let taskStartDate: Date;
        if (task.progress > 0 && task.created_at) {
            taskStartDate = new Date(task.created_at);
        } else {
            taskStartDate = new Date(taskEndDate);
        }
        
        // Check if task overlaps with the current week
        const weekStart = weekDays[0];
        const weekEnd = weekDays[6];
        
        return taskStartDate <= weekEnd && taskEndDate >= weekStart;
    });

    // Calculate statistics based on filtered tasks
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = filteredTasks.filter(t => {
        if (!t.end_date || t.status === 'completed') return false;
        return new Date(t.end_date) < new Date();
    }).length;

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 border-b border-gray-100 dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Task Timeline</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => {
                                const year = Number(e.target.value);
                                if (!isNaN(year)) {
                                    setSelectedYear(year);
                                    // Update currentWeekStart to the same week in the new year
                                    const newDate = new Date(currentWeekStart);
                                    newDate.setFullYear(year);
                                    setCurrentWeekStart(newDate);
                                }
                            }}
                            onWheel={(e) => {
                                e.preventDefault();
                                const delta = e.deltaY > 0 ? -1 : 1;
                                const newYear = selectedYear + delta;
                                setSelectedYear(newYear);
                                // Update currentWeekStart to the same week in the new year
                                const newDate = new Date(currentWeekStart);
                                newDate.setFullYear(newYear);
                                setCurrentWeekStart(newDate);
                            }}
                            className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                            min="1900"
                            max="2100"
                        />
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                        <button
                            onClick={() => navigateWeek('prev')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-105"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-neutral-800 rounded-lg min-w-[120px] sm:min-w-[140px] text-center">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {formatDay(weekDays[0])} - {formatDay(weekDays[6])}
                            </span>
                        </div>
                        <button
                            onClick={() => navigateWeek('next')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-105"
                        >
                            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline Header */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 sm:px-6">
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {weekDays.map((date, index) => (
                        <div key={index} className="text-center">
                            <div className={`text-xs font-medium ${
                                isToday(date) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                            </div>
                            <div className={`text-sm sm:text-lg font-bold mt-1 ${
                                isToday(date) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                                {date.getDate()}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden sm:block">
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Content */}
            <div 
                className="p-4 relative"
                style={{
                    minHeight: filteredTasks.length === 0 ? '300px' : `${Math.max(300, filteredTasks.length * 35 + 80)}px`
                }}
            >
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 dark:text-gray-500 text-sm">No tasks scheduled for this week in {selectedYear}</div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredTasks.map((task, taskIndex) => {
                            if (!task.end_date) return null;
                            const taskEndDate = new Date(task.end_date);
                            
                            // Calculate start date - use created_at when progress > 0, otherwise use end_date
                            let taskStartDate: Date;
                            if (task.progress > 0 && task.created_at) {
                                // If task has progress, start from created_at date
                                taskStartDate = new Date(task.created_at);
                            } else {
                                // If no progress, start from end_date (same day)
                                taskStartDate = new Date(taskEndDate);
                            }
                            
                            // Find the start and end indices within the current week
                            const startIndex = weekDays.findIndex(day => 
                                day.toDateString() === taskStartDate.toDateString()
                            );
                            const endIndex = weekDays.findIndex(day => 
                                day.toDateString() === taskEndDate.toDateString()
                            );
                            
                            // Check if task is visible in current week
                            const taskStartsBeforeWeek = taskStartDate < weekDays[0];
                            const taskEndsAfterWeek = taskEndDate > weekDays[6];
                            
                            // Calculate the actual span within the current week
                            let actualStartIndex: number;
                            let actualEndIndex: number;
                            
                            if (taskStartsBeforeWeek && taskEndsAfterWeek) {
                                // Task spans the entire week
                                actualStartIndex = 0;
                                actualEndIndex = 6;
                            } else if (taskStartsBeforeWeek && endIndex !== -1) {
                                // Task starts before week but ends in week
                                actualStartIndex = 0;
                                actualEndIndex = endIndex;
                            } else if (taskEndsAfterWeek && startIndex !== -1) {
                                // Task starts in week but ends after week
                                actualStartIndex = startIndex;
                                actualEndIndex = 6;
                            } else if (startIndex !== -1 && endIndex !== -1) {
                                // Task is completely within the week
                                actualStartIndex = startIndex;
                                actualEndIndex = endIndex;
                            } else {
                                return null; // Task not visible in current week
                            }
                            
                            const span = actualEndIndex - actualStartIndex + 1;

                            const getStatusColor = (status: string) => {
                                const colors = {
                                    not_started: 'bg-[#f87171] text-white',
                                    in_progress: 'bg-[#3b82f6] text-white',
                                    in_review: 'bg-[#f97316] text-white',
                                    completed: 'bg-[#22c55e] text-white',
                                    cancelled: 'bg-[#9ca3af] text-white',
                                };
                                return colors[status as keyof typeof colors] || 'bg-[#f87171] text-white';
                            };

                            const getPriorityColor = (priority: string) => {
                                const colors = {
                                    low: 'border-l-gray-400 dark:border-l-neutral-500',
                                    medium: 'border-l-yellow-400 dark:border-l-yellow-600',
                                    high: 'border-l-orange-400 dark:border-l-orange-600',
                                    urgent: 'border-l-red-400 dark:border-l-red-600',
                                };
                                return colors[priority as keyof typeof colors] || 'border-l-gray-400 dark:border-l-neutral-500';
                            };

                            return (
                                <div key={task.id} className="relative h-7">
                                    {/* Timeline track */}
                                    <div className="grid grid-cols-7 gap-0 h-full">
                                        {/* Task as single merged shape */}
                                        <div
                                            onClick={() => onTaskClick?.(task)}
                                            onMouseEnter={(e) => {
                                                setHoveredTask(task);
                                                setMousePosition({ x: e.clientX, y: e.clientY });
                                            }}
                                            onMouseMove={(e) => {
                                                setMousePosition({ x: e.clientX, y: e.clientY });
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredTask(null);
                                            }}
                                            className={`absolute top-0 bottom-0 flex items-center px-2 text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${getStatusColor(task.status)} ${getPriorityColor(task.priority)}`}
                                            style={{
                                                left: `${(actualStartIndex / 7) * 100}%`,
                                                width: `${((actualEndIndex - actualStartIndex + 1) / 7) * 100}%`,
                                                borderRadius: '0.375rem'
                                            }}
                                        >
                                            <span className="truncate flex-1 text-white">
                                                {task.title}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer with Summary */}
            <div className="px-4 py-3 bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 border-t border-gray-100 dark:border-neutral-700">
                <div className="flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start">
                    <div className="flex items-center gap-2 min-w-fit">
                        <div className="w-3 h-3 bg-[#3b82f6] rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">In Progress ({inProgressTasks})</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-fit">
                        <div className="w-3 h-3 bg-[#22c55e] rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Completed ({completedTasks})</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-fit">
                        <div className="w-3 h-3 bg-[#f97316] rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">In Review ({filteredTasks.filter(t => t.status === 'in_review').length})</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-fit">
                        <div className="w-3 h-3 bg-[#f87171] rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Not Started ({filteredTasks.filter(t => t.status === 'not_started').length})</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-fit">
                        <div className="w-3 h-3 bg-[#9ca3af] rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Cancelled ({filteredTasks.filter(t => t.status === 'cancelled').length})</span>
                    </div>
                </div>
            </div>
            
            {/* Task Details Tooltip */}
            {hoveredTask && (
                <div
                    className={`fixed z-50 text-white p-3 rounded-lg shadow-xl border border-current/20 max-w-xs pointer-events-none ${
                        hoveredTask.status === 'not_started' ? 'bg-[#f87171]' :
                        hoveredTask.status === 'in_progress' ? 'bg-[#3b82f6]' :
                        hoveredTask.status === 'in_review' ? 'bg-[#f97316]' :
                        hoveredTask.status === 'completed' ? 'bg-[#22c55e]' :
                        hoveredTask.status === 'cancelled' ? 'bg-[#9ca3af]' :
                        'bg-gray-500'
                    }`}
                    style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`,
                        transform: 'translateY(-100%)'
                    }}
                >
                    <div className="font-semibold text-sm mb-2">{hoveredTask.title}</div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-white/80">Status:</span>
                            <span className="capitalize">{hoveredTask.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/80">Priority:</span>
                            <span className="capitalize">{hoveredTask.priority}</span>
                        </div>
                        {hoveredTask.progress > 0 && (
                            <div className="flex justify-between">
                                <span className="text-white/80">Progress:</span>
                                <span>{hoveredTask.progress}%</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-white/80">End Date:</span>
                            <span>{hoveredTask.end_date ? new Date(hoveredTask.end_date).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        {hoveredTask.description && (
                            <div className="mt-2 pt-2 border-t border-current/30">
                                <div className="text-white/80 mb-1">Description:</div>
                                <div className="text-xs line-clamp-2">{hoveredTask.description}</div>
                            </div>
                        )}
                        {hoveredTask.assignees && hoveredTask.assignees.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/30">
                                <div className="text-white/80 mb-2">Assignees:</div>
                                <div className="flex flex-wrap gap-1">
                                    {hoveredTask.assignees.map((assigneeId) => {
                                        const assignee = users.find(user => user.id === assigneeId);
                                        if (!assignee) return null;
                                        return (
                                            <div
                                                key={assignee.id}
                                                className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1"
                                                title={assignee.name}
                                            >
                                                {assignee.avatar ? (
                                                    <img
                                                        src={assignee.avatar}
                                                        alt={assignee.name}
                                                        className="w-4 h-4 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-white/40 flex items-center justify-center text-xs font-medium">
                                                        {assignee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-xs">{assignee.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskCalendar;
