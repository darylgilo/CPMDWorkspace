import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { usePopupAlert } from '@/components/ui/popup-alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WhereaboutsTooltip } from '@/components/ui/whereabouts-tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, usePage } from '@inertiajs/react';
import {
    eachDayOfInterval,
    endOfMonth,
    format,
    isWeekend,
    parseISO,
    startOfMonth,
    parse,
} from 'date-fns';
import { ChevronLeft, ChevronRight, GripVertical, MapPin, Briefcase, Home, Plane, Calendar, Coffee, AlertCircle, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Sections interface
interface Section {
    id: number;
    name: string;
    code: string;
    office: string;
    display_order: number;
}

interface User {
    id: number;
    name: string;
    office: string;
    section_id?: number | null;
}


interface Whereabout {
    id: number;
    user_id: number;
    date: string;
    status: string;
    reason?: string;
    location?: string;
    accomplishment?: string;
}

interface AuthUser {
    id: number;
    name: string;
    role: string;
}

interface PageProps {
    auth: {
        user: AuthUser;
    };
    sections?: Section[];
    SECTIONS_BY_OFFICE?: Record<string, string[]>;
    selectedOffice?: string;
    availableOffices?: string[];
    [key: string]: unknown;
}

interface Props {
    users: User[];
    whereabouts: Record<number, Record<string, Whereabout>>;
    currentDate: string;
    filters: {
        date?: string;
        office?: string;
    };
    selectedOffice?: string;
    availableOffices?: string[];
}

const STATUS_COLORS: Record<string, string> = {
    'ON DUTY': 'bg-emerald-500 text-white border-emerald-600',
    'ON TRAVEL': 'bg-blue-500 text-white border-blue-600',
    'ON LEAVE': 'bg-red-500 text-white border-red-600',
    ABSENT: 'bg-amber-500 text-white border-amber-600',
    'HALF DAY': 'bg-yellow-400 text-gray-900 border-yellow-500',
    WFH: 'bg-purple-500 text-white border-purple-600',
};

const STATUS_ICONS: Record<string, any> = {
    'ON DUTY': Briefcase,
    'ON TRAVEL': Plane,
    'ON LEAVE': Calendar,
    ABSENT: AlertCircle,
    'HALF DAY': Coffee,
    WFH: Home,
    'DAY OFF': Sun,
};

const STATUS_OPTIONS = [
    'ON DUTY',
    'ON TRAVEL',
    'ON LEAVE',
    'ABSENT',
    'HALF DAY',
    'WFH',
];

// Sortable Row Component
function SortableRow({
    user,
    days,
    whereabouts,
    handleCellClick,
    canReorder,
    authUser,
    loadingCells,
    selectedCell,
    onTooltipShow,
    onTooltipHide,
}: {
    user: User;
    days: Date[];
    whereabouts: Record<number, Record<string, Whereabout>>;
    handleCellClick: (user: User, day: Date) => void;
    canReorder: boolean;
    authUser: AuthUser;
    loadingCells: Set<string>;
    selectedCell: { user: User; date: Date } | null;
    onTooltipShow: (data: {
        entry: Whereabout | null;
        day: Date;
        user: User;
        isEditable: boolean;
        position: { x: number; y: number };
    }) => void;
    onTooltipHide: () => void;
}) {
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: user.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? ('relative' as const) : undefined,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                isDragging
                    ? 'bg-gray-50 opacity-50 shadow-lg dark:bg-neutral-800'
                    : '',
            )}
        >
            <td className="sticky left-0 z-10 flex items-center gap-2 border-r border-gray-300 bg-gradient-to-r from-white to-gray-50 p-2 text-xs font-medium shadow-sm sm:gap-3 sm:p-3 sm:text-sm dark:border-neutral-600 dark:from-neutral-900 dark:to-neutral-800 dark:text-white">
                {canReorder && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:bg-neutral-700 dark:hover:text-gray-400"
                    >
                        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                )}
                <span className="truncate font-medium">{user.name}</span>
            </td>
            {days.map((day: Date) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const entry = whereabouts[user.id]?.[dateStr];
                const isWknd = isWeekend(day);
                const isEditable =
                    authUser.role === 'admin' ||
                    authUser.role === 'superadmin' ||
                    authUser.id === user.id;

                return (
                    <td
                        key={day.toString()}
                        className={cn(
                            'group relative h-12 border-r border-b border-gray-200 p-0 transition-all duration-200 dark:border-neutral-600',
                            !isWknd && isEditable
                                ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:z-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50'
                                : '',
                            entry
                                ? STATUS_COLORS[entry.status]
                                : isWknd
                                  ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-800/50'
                                  : 'bg-gradient-to-br from-white to-gray-50 hover:bg-gray-100 dark:from-neutral-900 dark:to-neutral-800 dark:hover:bg-neutral-700',
                            format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                ? 'ring-1 ring-blue-300 ring-opacity-50 dark:ring-blue-600'
                                : '',
                            selectedCell?.user.id === user.id && format(selectedCell.date, 'yyyy-MM-dd') === dateStr
                                ? 'ring-2 ring-purple-400 ring-opacity-70 dark:ring-purple-500'
                                : '',
                            loadingCells.has(`${user.id}-${dateStr}`)
                                ? 'animate-pulse opacity-70'
                                : '',
                        )}
                        onClick={() => {
                            if (!isWknd && isEditable) {
                                handleCellClick(user, day);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (!isWknd && isEditable && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleCellClick(user, day);
                            }
                        }}
                        tabIndex={!isWknd && isEditable ? 0 : -1}
                        role="button"
                        aria-label={`
                            ${format(day, 'MMMM d, yyyy')}: 
                            ${entry ? entry.status : 'Not set'}
                            ${entry?.reason ? ` - ${entry.reason}` : ''}
                            ${entry?.location ? ` - Location: ${entry.location}` : ''}
                            ${entry?.accomplishment ? ` - Accomplishment: ${entry.accomplishment}` : ''}
                            ${!isEditable ? ' - No edit permission' : ' - Click to edit'}
                        `}
                        onMouseEnter={(e) => {
                            const cellKey = `${user.id}-${dateStr}`;
                            setHoveredCell(cellKey);
                            const rect = e.currentTarget.getBoundingClientRect();
                            onTooltipShow({
                                entry,
                                day,
                                user,
                                isEditable: isEditable && !isWknd,
                                position: {
                                    x: rect.left + rect.width / 2,
                                    y: rect.top
                                }
                            });
                        }}
                        onMouseLeave={() => {
                            setHoveredCell(null);
                            onTooltipHide();
                        }}
                    >
                        <div className="flex h-full flex-col items-center justify-center gap-0.5">
                            {entry && STATUS_ICONS[entry.status] && (
                                <>
                                    <div className="flex items-center justify-center">
                                        {React.createElement(STATUS_ICONS[entry.status], { className: 'h-3 w-3 sm:h-4 sm:w-4' })}
                                    </div>
                                    <span className="text-[10px] opacity-70">{format(day, 'd')}</span>
                                </>
                            )}
                            {!entry && isWknd && (
                                <>
                                    <div className="flex items-center justify-center">
                                        {React.createElement(Sun, { className: 'h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500' })}
                                    </div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{format(day, 'd')}</span>
                                </>
                            )}
                            {!entry && !isWknd && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{format(day, 'd')}</span>
                            )}
                        </div>
                    </td>
                );
            })}
        </tr>
    );
}

export default function Whereabouts({
    users,
    whereabouts,
    currentDate,
    selectedOffice = 'CPMD',
    availableOffices = [],
}: Props) {
    const { showSuccess, showError, showInfo } = usePopupAlert();
    const { auth, sections, SECTIONS_BY_OFFICE: fallbackSections } = usePage<PageProps>().props;

    // Helper function to get section name by ID
    const getSectionName = (sectionId: number | null | undefined): string => {
        if (!sectionId || !sections) return 'Unassigned';
        const section = sections.find(s => s.id === sectionId);
        return section?.name || 'Unassigned';
    };

    // Create dynamic section filters based on selected office
    const getSectionFilters = (office: string) => {
        const officeSections = fallbackSections?.[office] || [];
        const filters = [{ label: 'All Sections', value: 'all' }];
        
        // Add office of the chief group if it exists
        const chiefSections = officeSections.filter((section: string) => 
            section.includes('Office of the Chief') || 
            section.includes('OC-') ||
            section.toLowerCase().includes('chief')
        );
        if (chiefSections.length > 0) {
            filters.push({ label: 'Office of the Chief', value: 'office_of_the_chief_group' });
        }
        
        // Add individual sections
        officeSections.forEach((section: string) => {
            if (!section.includes('Office of the Chief') && !section.includes('OC-')) {
                filters.push({ label: section, value: section });
            }
        });
        
        return filters;
    };
    const [date] = useState(parseISO(currentDate));
    const [selectedCell, setSelectedCell] = useState<{
        user: User;
        date: Date;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({
        status: 'ON DUTY',
        reason: '',
        location: '',
        accomplishment: '',
    });
    const [selectedSection, setSelectedSection] = useState('all');
    const [useDateRange, setUseDateRange] = useState(false);
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');
    
    // Global tooltip state
    const [globalTooltip, setGlobalTooltip] = useState<{
        entry: Whereabout | null;
        day: Date;
        user: User;
        isEditable: boolean;
        position: { x: number; y: number };
    } | null>(null);

    // Local state for users to handle optimistic UI updates during drag
    const [localUsers, setLocalUsers] = useState(users);

    // Update local users when props change
    useEffect(() => {
        setLocalUsers(users);
    }, [users]);

    const days = eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date),
    });

    // Group users by section
    const usersByOffice = localUsers.reduce(
        (acc, user) => {
            const section = getSectionName(user.section_id);
            if (!acc[section]) acc[section] = [];
            acc[section].push(user);
            return acc;
        },
        {} as Record<string, User[]>,
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && over) {
            setLocalUsers((items) => {
                // Find the section that contains both active and over items
                const activeUser = items.find((u) => u.id === active.id);
                const overUser = items.find((u) => u.id === over.id);

                if (!activeUser || !overUser) return items;

                // Get the section for these users
                const section = getSectionName(activeUser.section_id);

                // Only reorder if both items are in the same section
                if (getSectionName(overUser.section_id) !== section) {
                    return items;
                }

                // Get all users in this section
                const sectionUsers = items.filter(
                    (u) => getSectionName(u.section_id) === section,
                );

                // Find indices within the section
                const oldIndex = sectionUsers.findIndex(
                    (u) => u.id === active.id,
                );
                const newIndex = sectionUsers.findIndex(
                    (u) => u.id === over.id,
                );

                // Reorder within the section
                const reorderedSection = arrayMove(
                    sectionUsers,
                    oldIndex,
                    newIndex,
                );

                // Merge back: keep other sections in their original order
                // We need to maintain the overall structure
                const result: User[] = [];

                // Reconstruct the array maintaining section groupings
                const allSections = Array.from(
                    new Set(items.map((u) => getSectionName(u.section_id))),
                );

                allSections.forEach((sec) => {
                    if (sec === section) {
                        result.push(...reorderedSection);
                    } else {
                        result.push(
                            ...items.filter(
                                (u) => getSectionName(u.section_id) === sec,
                            ),
                        );
                    }
                });

                // Calculate GLOBAL display order for ALL users to maintain section groupings
                // This ensures that when the page refreshes, the order is preserved
                const orderData = result.map((user, globalIndex) => ({
                    id: user.id,
                    order: globalIndex,
                }));

                console.log('Sending reorder data:', {
                    totalUsers: orderData.length,
                    orderData: orderData,
                    result: result.map((u) => ({
                        id: u.id,
                        name: u.name,
                        section: getSectionName(u.section_id),
                    })),
                });

                // Call backend to save order
                setTimeout(() => {
                    router.post(
                        '/whereabouts/reorder',
                        {
                            items: orderData,
                        },
                        {
                            preserveScroll: true,
                            preserveState: true,
                            onSuccess: (response) => {
                                console.log(
                                    'Order saved successfully',
                                    response,
                                );
                            },
                            onError: (errors) => {
                                console.error('Failed to save order', errors);
                            },
                        },
                    );
                }, 0);

                return result;
            });
        }
    };

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(
            date.getFullYear(),
            date.getMonth() + offset,
            1,
        );
        router.visit(`/whereabouts?date=${format(newDate, 'yyyy-MM-dd')}`);
    };

    const handleCellClick = (user: User, day: Date) => {
        const canEdit =
            auth.user.role === 'admin' ||
            auth.user.role === 'superadmin' ||
            auth.user.id === user.id;

        if (!canEdit) return;

        const dateStr = format(day, 'yyyy-MM-dd');
        const cellKey = `${user.id}-${dateStr}`;
        
        // Add loading state for visual feedback
        setLoadingCells(prev => new Set(prev).add(cellKey));
        
        // Remove loading state after a short delay
        setTimeout(() => {
            setLoadingCells(prev => {
                const newSet = new Set(prev);
                newSet.delete(cellKey);
                return newSet;
            });
        }, 300);

        // Single select mode (original behavior)
        const existing = whereabouts[user.id]?.[dateStr];

        setFormData({
            status: existing?.status || 'ON DUTY',
            reason: existing?.reason || '',
            location: existing?.location || '',
            accomplishment: existing?.accomplishment || '',
        });
        setSelectedCell({ user, date: day });
    };

    const handleSubmit = () => {
        if (!selectedCell) return;
        setIsSubmitting(true);

        if (useDateRange && dateRangeStart && dateRangeEnd) {
            // Handle date range submission
            const startDate = parse(dateRangeStart, 'yyyy-MM-dd', new Date());
            const endDate = parse(dateRangeEnd, 'yyyy-MM-dd', new Date());
            
            if (startDate > endDate) {
                showError('Invalid Date Range', 'Start date must be before end date.');
                setIsSubmitting(false);
                return;
            }

            const datesToProcess = eachDayOfInterval({ start: startDate, end: endDate })
                .filter(day => !isWeekend(day)) // Filter out weekends
                .map(day => format(day, 'yyyy-MM-dd'));

            router.post(
                '/whereabouts/bulk',
                {
                    user_id: selectedCell.user.id,
                    dates: datesToProcess,
                    ...formData,
                },
                {
                    onSuccess: () => {
                        showSuccess(
                            'Whereabouts Updated',
                            `Successfully updated whereabouts for ${datesToProcess.length} date(s).`,
                        );
                        setSelectedCell(null);
                        setUseDateRange(false);
                        setDateRangeStart('');
                        setDateRangeEnd('');
                    },
                    onError: (errors) => {
                        showError(
                            'Update Failed',
                            'Unable to update whereabouts. Please try again.',
                        );
                    },
                    onFinish: () => setIsSubmitting(false),
                },
            );
        } else {
            // Handle single date submission
            router.post(
                '/whereabouts',
                {
                    user_id: selectedCell.user.id,
                    date: format(selectedCell.date, 'yyyy-MM-dd'),
                    ...formData,
                },
                {
                    onSuccess: () => {
                        showSuccess(
                            'Whereabouts Updated',
                            'Employee whereabouts has been successfully updated.',
                        );
                        setSelectedCell(null);
                    },
                    onError: (errors) => {
                        showError(
                            'Update Failed',
                            'Unable to update whereabouts. Please try again.',
                        );
                    },
                    onFinish: () => setIsSubmitting(false),
                },
            );
        }
    };

    const handleReset = () => {
        if (!selectedCell) return;

        const dateStr = format(selectedCell.date, 'yyyy-MM-dd');
        const existing = whereabouts[selectedCell.user.id]?.[dateStr];

        // Only delete if there's an existing entry
        if (!existing) {
            setSelectedCell(null);
            return;
        }
        setIsSubmitting(true);

        router.delete(`/whereabouts/${existing.id}`, {
            onSuccess: () => {
                showSuccess(
                    'Whereabouts Reset',
                    'Employee whereabouts has been successfully reset.',
                );
                setSelectedCell(null);
            },
            onError: (errors) => {
                showError(
                    'Reset Failed',
                    'Unable to reset whereabouts. Please try again.',
                );
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const canReorder =
        auth.user.role === 'admin' || auth.user.role === 'superadmin';

    const matchesFilter = (sectionName: string, filterValue: string) => {
        if (filterValue === 'all') return true;
        if (filterValue === 'office_of_the_chief_group') {
            return [
                'Office of the Chief',
                'OC-Admin Support Unit',
                'OC-Special Project Unit',
                'OC-ICT Unit',
            ].includes(sectionName);
        }
        return sectionName === filterValue;
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Whereabouts', href: '/whereabouts' }]}
        >
            <Head title="Whereabouts" />

            <div className="flex h-full flex-col gap-4 p-2 sm:p-4">
                <div className="mb-4 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Select
                                value={String(date.getMonth())}
                                onValueChange={(val) => {
                                    const newDate = new Date(
                                        date.getFullYear(),
                                        parseInt(val),
                                        1,
                                    );
                                    router.visit(
                                        `/whereabouts?date=${format(newDate, 'yyyy-MM-dd')}`,
                                    );
                                }}
                            >
                                <SelectTrigger className="w-full border-gray-300 sm:w-[140px] dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem value="0">January</SelectItem>
                                    <SelectItem value="1">February</SelectItem>
                                    <SelectItem value="2">March</SelectItem>
                                    <SelectItem value="3">April</SelectItem>
                                    <SelectItem value="4">May</SelectItem>
                                    <SelectItem value="5">June</SelectItem>
                                    <SelectItem value="6">July</SelectItem>
                                    <SelectItem value="7">August</SelectItem>
                                    <SelectItem value="8">September</SelectItem>
                                    <SelectItem value="9">October</SelectItem>
                                    <SelectItem value="10">November</SelectItem>
                                    <SelectItem value="11">December</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={String(date.getFullYear())}
                                onValueChange={(val) => {
                                    const newDate = new Date(
                                        parseInt(val),
                                        date.getMonth(),
                                        1,
                                    );
                                    router.visit(
                                        `/whereabouts?date=${format(newDate, 'yyyy-MM-dd')}`,
                                    );
                                }}
                            >
                                <SelectTrigger className="w-full border-gray-300 sm:w-[100px] dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    {Array.from({ length: 10 }, (_, i) => {
                                        const year = new Date().getFullYear() - 5 + i;
                                        return (
                                            <SelectItem key={year} value={String(year)}>
                                                {year}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            {/* Office Selection Dropdown - Hidden */}
                            {/* <Select
                                value={selectedOffice}
                                onValueChange={(val) => {
                                    router.visit(
                                        `/whereabouts?date=${format(date, 'yyyy-MM-dd')}&office=${val}`,
                                    );
                                }}
                            >
                                <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue placeholder="Select Office" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    {availableOffices.map((office) => (
                                        <SelectItem
                                            key={office}
                                            value={office}
                                        >
                                            {office}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}

                            <Select
                                value={selectedSection}
                                onValueChange={setSelectedSection}
                            >
                                <SelectTrigger className="w-full border-gray-300 sm:w-[200px] dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    {getSectionFilters(selectedOffice).map((filter) => (
                                        <SelectItem
                                            key={filter.value}
                                            value={filter.value}
                                        >
                                            {filter.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {Object.entries(STATUS_COLORS).map(
                                ([status, colorClass]) => {
                                    const IconComponent = STATUS_ICONS[status];
                                    return (
                                        <div
                                            key={status}
                                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm transition-all hover:shadow-md dark:border-neutral-600 dark:bg-neutral-800"
                                        >
                                            <div
                                                className={cn(
                                                    'flex h-3 w-3 items-center justify-center rounded text-xs font-bold shadow-sm',
                                                    colorClass,
                                                )}
                                            >
                                                {IconComponent && React.createElement(IconComponent, { className: 'h-2 w-2' })}
                                            </div>
                                            <span className="text-xs font-medium">
                                                {status}
                                            </span>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="hidden lg:block overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-20 min-w-[140px] border-r-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 p-3 text-left text-xs font-semibold shadow-sm sm:min-w-[200px] sm:p-4 sm:text-sm dark:border-neutral-600 dark:from-neutral-800 dark:to-neutral-900 dark:text-white">
                                        {selectedOffice} - WHEREABOUTS
                                    </th>
                                    {days.map((day: Date) => (
                                        <th
                                            key={day.toString()}
                                            className={cn(
                                                'min-w-[35px] border-r border-b border-gray-200 p-1 text-center text-xs font-medium transition-all sm:min-w-[45px] sm:p-2 sm:text-sm dark:border-neutral-600',
                                                isWeekend(day)
                                                    ? 'bg-gradient-to-b from-gray-50 to-gray-100 text-gray-600 dark:from-gray-800/50 dark:to-gray-800 dark:text-gray-400'
                                                    : 'bg-gradient-to-b from-white to-gray-50 text-gray-900 dark:from-neutral-900 dark:to-neutral-800 dark:text-white',
                                                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                                    ? 'bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 shadow-sm'
                                                    : '',
                                            )}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-0.5">
                                                <div className={cn(
                                                    'text-xs font-bold sm:text-sm',
                                                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : ''
                                                )}>
                                                    {format(day, 'd')}
                                                </div>
                                                <div className={cn(
                                                    'text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs dark:text-gray-400',
                                                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : ''
                                                )}>
                                                    {format(day, 'EEE')}
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(usersByOffice)
                                    .filter(([office]) =>
                                        matchesFilter(office, selectedSection),
                                    )
                                    .map(([office, officeUsers]) => (
                                        <SortableContext
                                            key={office}
                                            items={officeUsers.map((u) => u.id)}
                                            strategy={
                                                verticalListSortingStrategy
                                            }
                                        >
                                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-900">
                                                <td
                                                    colSpan={days.length + 1}
                                                    className="sticky left-0 z-10 border-r border-b border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 p-2 text-xs font-bold uppercase tracking-wide text-gray-700 shadow-sm sm:p-3 sm:text-sm dark:border-neutral-600 dark:from-neutral-700 dark:to-neutral-800 dark:text-gray-300"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1 w-4 rounded-full bg-blue-500"></div>
                                                        {office}
                                                    </div>
                                                </td>
                                            </tr>
                                            {officeUsers.map((user) => (
                                                <SortableRow
                                                    key={user.id}
                                                    user={user}
                                                    days={days}
                                                    whereabouts={whereabouts}
                                                    handleCellClick={handleCellClick}
                                                    canReorder={canReorder}
                                                    authUser={auth.user}
                                                    loadingCells={loadingCells}
                                                    selectedCell={selectedCell}
                                                    onTooltipShow={setGlobalTooltip}
                                                    onTooltipHide={() => setGlobalTooltip(null)}
                                                />
                                            ))}
                                        </SortableContext>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </DndContext>

                {/* Mobile Card View - Mobile Only */}
                <div className="mt-6 lg:hidden">
                    <div className="space-y-4">
                        {Object.entries(usersByOffice)
                            .filter(([office]) =>
                                matchesFilter(office, selectedSection),
                            )
                            .map(([office, officeUsers]) => (
                                <div key={office} className="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                                    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:border-neutral-600 dark:from-neutral-800 dark:to-neutral-900">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-6 rounded-full bg-blue-500"></div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{office}</h3>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                                        {officeUsers.map((user) => (
                                            <div key={user.id} className="p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {canReorder && (
                                                            <button
                                                                className="cursor-grab rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:bg-neutral-700 dark:hover:text-gray-400"
                                                            >
                                                                <GripVertical className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                                                    </div>
                                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-neutral-700 dark:text-gray-400">{getSectionName(user.section_id)}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                                                    {days.map((day: Date) => {
                                                        const dateStr = format(day, 'yyyy-MM-dd');
                                                        const entry = whereabouts[user.id]?.[dateStr];
                                                        const isWknd = isWeekend(day);
                                                        const isEditable =
                                                            auth.user.role === 'admin' ||
                                                            auth.user.role === 'superadmin' ||
                                                            auth.user.id === user.id;
                                                        const IconComponent = entry ? STATUS_ICONS[entry.status] : null;

                                                        return (
                                                            <button
                                                                key={day.toString()}
                                                                onClick={() => {
                                                                    if (!isWknd && isEditable) {
                                                                        handleCellClick(user, day);
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (!isWknd && isEditable && (e.key === 'Enter' || e.key === ' ')) {
                                                                        e.preventDefault();
                                                                        handleCellClick(user, day);
                                                                    }
                                                                }}
                                                                tabIndex={!isWknd && isEditable ? 0 : -1}
                                                                className={cn(
                                                                    'relative flex h-10 w-full items-center justify-center rounded-lg border text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50',
                                                                    !isWknd && isEditable
                                                                        ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:z-10 border-gray-300'
                                                                        : 'cursor-default border-gray-200',
                                                                    entry
                                                                        ? STATUS_COLORS[entry.status]
                                                                        : isWknd
                                                                          ? 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 dark:from-gray-800/30 dark:to-gray-800/50 dark:text-gray-400'
                                                                          : 'bg-gradient-to-br from-white to-gray-50 text-gray-600 hover:bg-gray-100 dark:from-neutral-900 dark:to-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700',
                                                                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                                                        ? 'ring-2 ring-blue-400 ring-opacity-60 dark:ring-blue-500'
                                                                        : '',
                                                                    selectedCell?.user.id === user.id && format(selectedCell.date, 'yyyy-MM-dd') === dateStr
                                                                        ? 'ring-2 ring-purple-400 ring-opacity-70 dark:ring-purple-500'
                                                                        : '',
                                                                )}
                                                                aria-label={`
                                                                    ${format(day, 'MMMM d, yyyy')}: 
                                                                    ${entry ? entry.status : 'Not set'}
                                                                    ${entry?.reason ? ` - ${entry.reason}` : ''}
                                                                    ${entry?.location ? ` - Location: ${entry.location}` : ''}
                                                                    ${entry?.accomplishment ? ` - Accomplishment: ${entry.accomplishment}` : ''}
                                                                    ${!isEditable ? ' - No edit permission' : ' - Click to edit'}
                                                                `}
                                                                title={
                                                                    entry
                                                                        ? `${format(day, 'MMM d')}: ${entry.status}${entry.reason ? ` - ${entry.reason}` : ''}${entry.location ? ` 📍 ${entry.location}` : ''}${entry.accomplishment ? ` ✅ ${entry.accomplishment.substring(0, 50)}${entry.accomplishment.length > 50 ? '...' : ''}` : ''}`
                                                                        : `${format(day, 'MMM d')}: Not set`
                                                                }
                                                            >
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    {IconComponent && (
                                                                        <div className="flex items-center justify-center">
                                                                            {React.createElement(IconComponent, { className: 'h-3 w-3' })}
                                                                        </div>
                                                                    )}
                                                                    {!IconComponent && isWknd && (
                                                                        <div className="flex items-center justify-center">
                                                                            {React.createElement(Sun, { className: 'h-3 w-3 text-gray-400 dark:text-gray-500' })}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-[10px] font-medium">
                                                                        {format(day, 'd')}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {user.office && (
                                                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{user.office}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            <Dialog
                open={!!selectedCell}
                onOpenChange={(open) => !open && setSelectedCell(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Whereabouts</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) =>
                                    setFormData({ ...formData, status: val })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useDateRange"
                                    checked={useDateRange}
                                    onChange={(e) => setUseDateRange(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="useDateRange" className="text-sm font-medium cursor-pointer">
                                    Apply to date range
                                </Label>
                            </div>
                        </div>

                        {useDateRange && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={dateRangeStart}
                                        onChange={(e) => setDateRangeStart(e.target.value)}
                                        min={format(date, 'yyyy-MM-dd')}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={dateRangeEnd}
                                        onChange={(e) => setDateRangeEnd(e.target.value)}
                                        min={dateRangeStart || format(date, 'yyyy-MM-dd')}
                                    />
                                </div>
                            </div>
                        )}

                        {(formData.status === 'ABSENT') && (
                            <div className="grid gap-2">
                                <Label>Reason (Optional)</Label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reason: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Sick Leave, Official Business"
                                    className="min-h-[80px] max-h-[200px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y dark:border-neutral-600 dark:bg-neutral-950 dark:placeholder:text-gray-400"
                                    rows={2}
                                />
                            </div>
                        )}

                        {(formData.status === 'ON TRAVEL') && (
                            <div className="grid gap-2">
                                <Label>Location (Optional)</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Manila, Home"
                                />
                            </div>
                        )}

                        {(formData.status === 'WFH') && (
                            <div className="grid gap-2">
                                <Label>Accomplishment (Optional)</Label>
                                <textarea
                                    value={formData.accomplishment}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            accomplishment: e.target.value,
                                        })
                                    }
                                    placeholder="Describe your accomplishments for the day..."
                                    className="min-h-[120px] max-h-[300px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y dark:border-neutral-600 dark:bg-neutral-950 dark:placeholder:text-gray-400"
                                    rows={5}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedCell(null)}
                            >
                                Cancel
                            </Button>
                            {selectedCell &&
                                whereabouts[selectedCell.user.id]?.[
                                    format(selectedCell.date, 'yyyy-MM-dd')
                                ] && (
                                <LoadingButton
                                    variant="destructive"
                                    onClick={handleReset}
                                    loading={isSubmitting}
                                    loadingText="Resetting..."
                                >
                                    Reset
                                </LoadingButton>
                            )}
                            <LoadingButton
                                className="bg-[#163832] text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                onClick={handleSubmit}
                                loading={isSubmitting}
                                loadingText="Saving..."
                            >
                                {useDateRange ? 'Save Range' : 'Save'}
                            </LoadingButton>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Global Tooltip */}
            {globalTooltip && (
                <div 
                    className="fixed z-[9999] transition-all duration-200 ease-out opacity-100 scale-100 pointer-events-none"
                    style={{
                        left: `${Math.min(Math.max(globalTooltip.position.x, 50), window.innerWidth - 50)}px`,
                        top: `${globalTooltip.position.y < window.innerHeight / 2 
                            ? globalTooltip.position.y + 8 
                            : globalTooltip.position.y - 8}px`,
                        transform: globalTooltip.position.y < window.innerHeight / 2 
                            ? 'translate(-50%, 0)' 
                            : 'translate(-50%, -100%)'
                    }}
                >
                    <WhereaboutsTooltip 
                        entry={globalTooltip.entry} 
                        day={globalTooltip.day} 
                        user={globalTooltip.user} 
                        isEditable={globalTooltip.isEditable}
                    />
                    <div 
                        className={cn(
                            "absolute left-1/2 transform -translate-x-1/2",
                            globalTooltip.position.y < window.innerHeight / 2 
                                ? "top-full -mt-1 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 dark:border-t-neutral-600"
                                : "bottom-full mb-1 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-200 dark:border-b-neutral-600"
                        )}
                    ></div>
                </div>
            )}
        </AppLayout>
    );
}
