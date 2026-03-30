import { cn } from '@/lib/utils';
import { MapPin, User as LucideUser, Briefcase, Plane, Calendar, AlertCircle, Coffee, Home, Sun } from 'lucide-react';
import React from 'react';
import { format } from 'date-fns';

interface Whereabout {
    id: number;
    user_id: number;
    date: string;
    status: string;
    reason?: string;
    location?: string;
}

interface User {
    id: number;
    name: string;
    office: string;
    section_id?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
    'ON DUTY': 'bg-emerald-500 text-white border-emerald-600',
    'ON TRAVEL': 'bg-blue-500 text-white border-blue-600',
    'ON LEAVE': 'bg-red-500 text-white border-red-600',
    ABSENT: 'bg-amber-500 text-white border-amber-600',
    'HALF DAY': 'bg-yellow-400 text-gray-900 border-yellow-500',
    WFH: 'bg-purple-500 text-white border-purple-600',
};

const STATUS_ICONS: Record<string, React.ComponentType<any>> = {
    'ON DUTY': Briefcase,
    'ON TRAVEL': Plane,
    'ON LEAVE': Calendar,
    ABSENT: AlertCircle,
    'HALF DAY': Coffee,
    WFH: Home,
    'DAY OFF': Sun,
};

interface WhereaboutsTooltipProps {
    entry: Whereabout | null;
    day: Date;
    user: User;
    isEditable: boolean;
}

export function WhereaboutsTooltip({ 
    entry, 
    day, 
    user, 
    isEditable 
}: WhereaboutsTooltipProps) {
    if (!entry) {
        return (
            <div className="w-64 sm:w-72 max-w-[90vw] rounded-lg border border-gray-300 bg-white p-3 shadow-2xl dark:border-neutral-600 dark:bg-neutral-800">
                <div className="text-sm">
                    <div className="font-semibold text-gray-900 dark:text-white">
                        {format(day, 'MMM d, yyyy')}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 mt-1">
                        No status set
                    </div>
                    {isEditable && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Click to set status
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-72 sm:w-80 max-w-[85vw] rounded-lg border border-gray-300 bg-white p-3 sm:p-4 shadow-2xl dark:border-neutral-600 dark:bg-neutral-800">
            <div className="space-y-2 sm:space-y-3">
                {/* Header with status */}
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded text-xs font-bold',
                        STATUS_COLORS[entry.status]
                    )}>
                        {STATUS_ICONS[entry.status] && React.createElement(STATUS_ICONS[entry.status], { className: 'h-3 w-3' })}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                            {entry.status}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(day, 'EEE, MMM d')}
                        </div>
                    </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <LucideUser className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{user.name}</span>
                </div>

                {/* Location */}
                {entry.location && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{entry.location}</span>
                    </div>
                )}

                {/* Reason */}
                {entry.reason && (
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium mb-1 text-xs sm:text-sm">Reason:</div>
                        <div className="text-xs bg-gray-50 dark:bg-neutral-700 p-2 rounded break-words max-h-20 overflow-y-auto">
                            {entry.reason}
                        </div>
                    </div>
                )}

                {/* Edit permission indicator */}
                {isEditable && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-neutral-600 pt-2">
                        Click to edit
                    </div>
                )}
            </div>
        </div>
    );
}
