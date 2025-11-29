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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
} from 'date-fns';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
    id: number;
    name: string;
    office: string;
    cpmd: string;
}

interface Whereabout {
    id: number;
    user_id: number;
    date: string;
    status: string;
    reason?: string;
    location?: string;
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
    [key: string]: unknown;
}

interface Props {
    users: User[];
    whereabouts: Record<number, Record<string, Whereabout>>;
    currentDate: string;
    filters: {
        date?: string;
    };
}

const STATUS_COLORS: Record<string, string> = {
    'ON DUTY': 'bg-green-500 text-white',
    'ON TRAVEL': 'bg-blue-500 text-white',
    'ON LEAVE': 'bg-red-500 text-white',
    ABSENT: 'bg-orange-500 text-white',
    'HALF DAY': 'bg-yellow-500 text-black',
    WFH: 'bg-purple-500 text-white',
};

const STATUS_OPTIONS = [
    'ON DUTY',
    'ON TRAVEL',
    'ON LEAVE',
    'ABSENT',
    'HALF DAY',
    'WFH',
];

const SECTION_FILTERS = [
    { label: 'All Sections', value: 'all' },
    { label: 'Office of the Chief', value: 'office_of_the_chief_group' },
    { label: 'BIOCON Section', value: 'BIOCON Section' },
    { label: 'PFS Section', value: 'PFS Section' },
    { label: 'PHPS Section', value: 'PHPS Section' },
    { label: 'Others', value: 'Others' },
];

// Sortable Row Component
function SortableRow({
    user,
    days,
    whereabouts,
    handleCellClick,
    canReorder,
    authUser,
}: {
    user: User;
    days: Date[];
    whereabouts: Record<number, Record<string, Whereabout>>;
    handleCellClick: (user: User, day: Date) => void;
    canReorder: boolean;
    authUser: AuthUser;
}) {
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
            <td className="sticky left-0 z-10 flex items-center gap-1 border border-gray-300 bg-white p-1.5 text-xs font-medium sm:gap-2 sm:p-2 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900">
                {canReorder && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-gray-400"
                    >
                        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                )}
                {user.name}
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
                            'group relative h-10 border border-gray-300 p-0 transition-opacity dark:border-neutral-700',
                            !isWknd && isEditable
                                ? 'cursor-pointer hover:opacity-80'
                                : '',
                            entry
                                ? STATUS_COLORS[entry.status]
                                : isWknd
                                    ? 'bg-gray-50 dark:bg-gray-800/50'
                                    : '',
                        )}
                        onClick={() =>
                            !isWknd && isEditable && handleCellClick(user, day)
                        }
                        title={
                            entry
                                ? `${entry.status}${entry.reason ? `: ${entry.reason}` : ''}`
                                : ''
                        }
                    ></td>
                );
            })}
        </tr>
    );
}

export default function Whereabouts({
    users,
    whereabouts,
    currentDate,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [date] = useState(parseISO(currentDate));
    const [selectedCell, setSelectedCell] = useState<{
        user: User;
        date: Date;
    } | null>(null);
    const [formData, setFormData] = useState({
        status: 'ON DUTY',
        reason: '',
        location: '',
    });
    const [selectedSection, setSelectedSection] = useState('all');

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
            const section = user.cpmd || 'Unassigned';
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
                const section = activeUser.cpmd || 'Unassigned';

                // Only reorder if both items are in the same section
                if ((overUser.cpmd || 'Unassigned') !== section) {
                    return items;
                }

                // Get all users in this section
                const sectionUsers = items.filter(
                    (u) => (u.cpmd || 'Unassigned') === section,
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
                    new Set(items.map((u) => u.cpmd || 'Unassigned')),
                );

                allSections.forEach((sec) => {
                    if (sec === section) {
                        result.push(...reorderedSection);
                    } else {
                        result.push(
                            ...items.filter(
                                (u) => (u.cpmd || 'Unassigned') === sec,
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
                        section: u.cpmd,
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
        const existing = whereabouts[user.id]?.[dateStr];

        setFormData({
            status: existing?.status || 'ON DUTY',
            reason: existing?.reason || '',
            location: existing?.location || '',
        });
        setSelectedCell({ user, date: day });
    };

    const handleSubmit = () => {
        if (!selectedCell) return;

        router.post(
            '/whereabouts',
            {
                user_id: selectedCell.user.id,
                date: format(selectedCell.date, 'yyyy-MM-dd'),
                ...formData,
            },
            {
                onSuccess: () => setSelectedCell(null),
            },
        );
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

        router.delete(`/whereabouts/${existing.id}`, {
            onSuccess: () => setSelectedCell(null),
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
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <h1 className="text-xl font-bold sm:text-2xl">
                        Whereabouts - {format(date, 'MMMM yyyy')}
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMonthChange(-1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMonthChange(1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col items-stretch gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:p-4 dark:border-neutral-700 dark:bg-neutral-900">
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
                                const year =
                                    new Date().getFullYear() - 5 + i;
                                return (
                                    <SelectItem
                                        key={year}
                                        value={String(year)}
                                    >
                                        {year}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 md:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90 hover:text-white"
                        onClick={() => {
                            const today = new Date();
                            router.visit(
                                `/whereabouts?date=${format(today, 'yyyy-MM-dd')}`,
                            );
                        }}
                    >
                        Today
                    </Button>

                    <Select
                        value={selectedSection}
                        onValueChange={setSelectedSection}
                    >
                        <SelectTrigger className="w-full border-gray-300 sm:ml-auto sm:w-[200px] dark:border-neutral-700 dark:bg-neutral-950">
                            <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                            {SECTION_FILTERS.map((filter) => (
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

                <div className="mb-2 flex flex-wrap gap-2 sm:mb-4 sm:gap-4">
                    {Object.entries(STATUS_COLORS).map(
                        ([status, colorClass]) => (
                            <div
                                key={status}
                                className="flex items-center gap-1.5 sm:gap-2"
                            >
                                <div
                                    className={cn(
                                        'h-3 w-3 rounded sm:h-4 sm:w-4',
                                        colorClass,
                                    )}
                                ></div>
                                <span className="text-xs sm:text-sm">{status}</span>
                            </div>
                        ),
                    )}
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="overflow-auto rounded-lg border border-gray-300 bg-white shadow dark:border-neutral-800 dark:bg-neutral-900">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-20 min-w-[120px] border border-gray-300 bg-gray-100 p-1.5 text-left text-xs sm:min-w-[200px] sm:p-2 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800">
                                        CROP PEST MANAGEMENT DIVISION
                                    </th>
                                    {days.map((day: Date) => (
                                        <th
                                            key={day.toString()}
                                            className={cn(
                                                'min-w-[30px] border border-gray-300 p-0.5 text-center text-xs font-normal sm:min-w-[40px] sm:p-1 sm:text-sm dark:border-neutral-700',
                                                isWeekend(day)
                                                    ? 'bg-gray-50 dark:bg-gray-800/50'
                                                    : '',
                                            )}
                                        >
                                            <div className="text-xs font-bold sm:text-sm">
                                                {format(day, 'd')}
                                            </div>
                                            <div className="text-[10px] text-gray-500 sm:text-xs dark:text-gray-400">
                                                {format(day, 'EEE')}
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
                                            <tr className="bg-gray-100 dark:bg-neutral-800">
                                                <td
                                                    colSpan={days.length + 1}
                                                    className="sticky left-0 z-10 border border-gray-300 bg-gray-100 p-1.5 text-xs font-bold sm:p-2 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800"
                                                >
                                                    {office}
                                                </td>
                                            </tr>
                                            {officeUsers.map((user) => (
                                                <SortableRow
                                                    key={user.id}
                                                    user={user}
                                                    days={days}
                                                    whereabouts={whereabouts}
                                                    handleCellClick={
                                                        handleCellClick
                                                    }
                                                    canReorder={canReorder}
                                                    authUser={auth.user}
                                                />
                                            ))}
                                        </SortableContext>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </DndContext>
            </div>

            <Dialog
                open={!!selectedCell}
                onOpenChange={(open) => !open && setSelectedCell(null)}
            >
                <DialogContent>
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
                            <Label>Reason (Optional)</Label>
                            <Input
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        reason: e.target.value,
                                    })
                                }
                                placeholder="e.g., Sick Leave, Official Business"
                            />
                        </div>

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
                    </div>

                    <DialogFooter className="flex justify-between">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedCell(null)}
                            >
                                Cancel
                            </Button>
                            <div>
                                {selectedCell &&
                                    whereabouts[selectedCell.user.id]?.[
                                    format(selectedCell.date, 'yyyy-MM-dd')
                                    ] && (
                                        <Button
                                            variant="destructive"
                                            onClick={handleReset}
                                        >
                                            Reset
                                        </Button>
                                    )}
                            </div>
                            <Button
                                className=" bg-[#163832] text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                onClick={handleSubmit}>Save</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
