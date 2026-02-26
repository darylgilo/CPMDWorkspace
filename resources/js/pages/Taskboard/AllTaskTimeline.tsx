import { usePage } from '@inertiajs/react';
import React from 'react';
import TaskCalendar from '@/components/TaskCalendar';

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

interface PageProps {
    allTasks?: Task[];
    users?: Array<{
        id: number;
        name: string;
        avatar?: string | null;
    }>;
    [key: string]: unknown;
}

const AllTaskTimeline: React.FC = () => {
    const { props } = usePage<PageProps>();
    const { allTasks = [], users = [] } = props;

    const handleTaskClick = (task: Task) => {
        // Handle task click - could open modal, navigate to task details, etc.
        console.log('Task clicked:', task);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        All Task Timeline
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View and manage all tasks in a timeline format
                    </p>
                </div>
            </div>

            <TaskCalendar 
                tasks={allTasks} 
                users={users}
                onTaskClick={handleTaskClick}
            />
        </div>
    );
};

export default AllTaskTimeline;
