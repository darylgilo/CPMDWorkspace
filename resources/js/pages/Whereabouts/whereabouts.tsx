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
import { useState, useEffect } from 'react';

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
    [key: string]: any;
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
    'ABSENT': 'bg-orange-500 text-white',
    'HALF DAY': 'bg-yellow-500 text-black',
    'WFH': 'bg-purple-500 text-white',
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
}: {
    user: User;
    days: Date[];
    whereabouts: Record<number, Record<string, Whereabout>>;
    handleCellClick: (user: User, day: Date) => void;
    canReorder: boolean;
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
        position: isDragging ? 'relative' as const : undefined,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(isDragging ? 'opacity-50 bg-gray-50 shadow-lg' : '')}
        >
            <td className="sticky left-0 z-10 border bg-white p-2 font-medium dark:bg-gray-900 flex items-center gap-2">
                {canReorder && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
                {user.name}
            </td>
            {days.map((day: Date) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const entry = whereabouts[user.id]?.[dateStr];
                const isWknd = isWeekend(day);

                return (
                    <td
                        key={day.toString()}
                        className={cn(
                            'group relative h-10 cursor-pointer border p-0 transition-opacity hover:opacity-80',
                            entry
                                ? STATUS_COLORS[entry.status]
                                : isWknd
                                    ? 'bg-gray-50 dark:bg-gray-800/50'
                                    : '',
                        )}
                        onClick={() => handleCellClick(user, day)}
                        title={
                            entry
                                ? `${entry.status}${entry.reason ? `: ${entry.reason}` : ''}`
                                : ''
                        }
                    >
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
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [date, setDate] = useState(parseISO(currentDate));
    const [selectedCell, setSelectedCell] = useState<{
        user: User;
        date: Date;
    } | null>(null);
    const [formData, setFormData] = useState({
        status: 'ON DUTY',
        reason: '',
        location: '',
    });

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
                const activeUser = items.find(u => u.id === active.id);
                const overUser = items.find(u => u.id === over.id);

                if (!activeUser || !overUser) return items;

                // Get the section for these users
                const section = activeUser.cpmd || 'Unassigned';

                // Only reorder if both items are in the same section
                if ((overUser.cpmd || 'Unassigned') !== section) {
                    return items;
                }

                // Get all users in this section
                const sectionUsers = items.filter(u => (u.cpmd || 'Unassigned') === section);
                const otherUsers = items.filter(u => (u.cpmd || 'Unassigned') !== section);

                // Find indices within the section
                const oldIndex = sectionUsers.findIndex(u => u.id === active.id);
                const newIndex = sectionUsers.findIndex(u => u.id === over.id);

                // Reorder within the section
                const reorderedSection = arrayMove(sectionUsers, oldIndex, newIndex);

                // Merge back: keep other sections in their original order
                // We need to maintain the overall structure
                const result: User[] = [];

                // Reconstruct the array maintaining section groupings
                const allSections = Array.from(new Set(items.map(u => u.cpmd || 'Unassigned')));

                allSections.forEach(sec => {
                    if (sec === section) {
                        result.push(...reorderedSection);
                    } else {
                        result.push(...items.filter(u => (u.cpmd || 'Unassigned') === sec));
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
                    result: result.map(u => ({ id: u.id, name: u.name, section: u.cpmd }))
                });

                // Call backend to save order
                setTimeout(() => {
                    router.post('/whereabouts/reorder', {
                        items: orderData
                    }, {
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: (response) => {
                            console.log('Order saved successfully', response);
                        },
                        onError: (errors) => {
                            console.error("Failed to save order", errors);
                        }
                    });
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
        router.visit(
            `/whereabouts?date=${format(newDate, 'yyyy-MM-dd')}`,
        );
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

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Whereabouts', href: '/whereabouts' }]}
        >
            <Head title="Whereabouts" />

            <div className="flex h-full flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
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

                <div className="mb-4 flex flex-wrap gap-4">
                    {Object.entries(STATUS_COLORS).map(
                        ([status, colorClass]) => (
                            <div
                                key={status}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className={cn(
                                        'h-4 w-4 rounded',
                                        colorClass,
                                    )}
                                ></div>
                                <span className="text-sm">{status}</span>
                            </div>
                        ),
                    )}
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="overflow-auto rounded-lg border bg-white shadow dark:bg-gray-900">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-20 min-w-[200px] border bg-gray-100 p-2 text-left dark:bg-gray-800">
                                        CROP PEST MANAGEMENT DIVISION
                                    </th>
                                    {days.map((day: Date) => (
                                        <th
                                            key={day.toString()}
                                            className={cn(
                                                'min-w-[40px] border p-1 text-center font-normal',
                                                isWeekend(day)
                                                    ? 'bg-gray-50 dark:bg-gray-800/50'
                                                    : '',
                                            )}
                                        >
                                            <div className="font-bold">
                                                {format(day, 'd')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(day, 'EEE')}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(usersByOffice).map(
                                    ([office, officeUsers]) => (
                                        <SortableContext
                                            key={office}
                                            items={officeUsers.map(u => u.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <tr
                                                className="bg-gray-100 dark:bg-gray-800"
                                            >
                                                <td
                                                    colSpan={days.length + 1}
                                                    className="sticky left-0 z-10 border bg-gray-100 p-2 font-bold dark:bg-gray-800"
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
                                                    handleCellClick={handleCellClick}
                                                    canReorder={canReorder}
                                                />
                                            ))}
                                        </SortableContext>
                                    ),
                                )}
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
                                {selectedCell && whereabouts[selectedCell.user.id]?.[format(selectedCell.date, 'yyyy-MM-dd')] && (
                                    <Button
                                        variant="destructive"
                                        onClick={handleReset}
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>
                            <Button onClick={handleSubmit}>Save</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
