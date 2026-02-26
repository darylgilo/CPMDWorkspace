import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface NoticeEvent {
    id: string;
    title: string;
    description: string;
    username: string;
    createdAt: string;
    date?: string | null;
    time?: string | null;
    category: string;
}

interface PhilippineHoliday {
    date: string;
    name: string;
    type: 'regular' | 'special';
}

interface CalendarWidgetProps {
    className?: string;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ className }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState<PhilippineHoliday[]>([]);
    const [notices, setNotices] = useState<NoticeEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Get notices from Inertia page props or fetch from API
    const { props } = usePage();

    useEffect(() => {
        const loadNotices = async () => {
            // Always fetch from API since dashboard doesn't have notices in props
            try {
                const response = await fetch('/api/notices');
                if (response.ok) {
                    const data = await response.json();
                    setNotices(data);
                }
            } catch (error) {
                console.error('Error fetching notices:', error);
            }
        };

        loadNotices();
        setHolidays(philippineHolidays);
    }, []); // Remove dependency on props.notices to always fetch from API

    // Sample Philippine holidays (you can expand this)
    const currentYear = new Date().getFullYear();
    const philippineHolidays: PhilippineHoliday[] = [
        {
            date: `${currentYear}-01-01`,
            name: "New Year's Day",
            type: 'regular',
        },
        {
            date: `${currentYear}-02-25`,
            name: 'EDSA People Power Revolution',
            type: 'special',
        },
        {
            date: `${currentYear}-04-09`,
            name: 'Araw ng Kagitingan',
            type: 'regular',
        },
        { date: `${currentYear}-05-01`, name: 'Labor Day', type: 'regular' },
        {
            date: `${currentYear}-06-12`,
            name: 'Independence Day',
            type: 'regular',
        },
        {
            date: `${currentYear}-08-21`,
            name: 'Ninoy Aquino Day',
            type: 'special',
        },
        {
            date: `${currentYear}-08-26`,
            name: 'National Heroes Day',
            type: 'regular',
        },
        {
            date: `${currentYear}-11-30`,
            name: 'Bonifacio Day',
            type: 'regular',
        },
        {
            date: `${currentYear}-12-25`,
            name: 'Christmas Day',
            type: 'regular',
        },
        { date: `${currentYear}-12-30`, name: 'Rizal Day', type: 'regular' },
    ];

    useEffect(() => {
        setHolidays(philippineHolidays);
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const handleDayClick = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const clickedDate = new Date(dateStr);
        setSelectedDate(clickedDate);
        setShowModal(true);
    };

    const getEventsForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const noticeEvents = notices.filter(
            (notice: NoticeEvent) => notice.date === dateStr,
        );
        const holidayEvents = holidays.filter(
            (holiday) => holiday.date === dateStr,
        );

        return { noticeEvents, holidayEvents };
    };

    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Card
            className={`min-h-[480px] w-full border-gray-200 bg-white shadow-md transition-all duration-200 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 ${className || ''}`}
        >
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Calendar className="h-5 w-5 text-[#163832] dark:text-green-400" />
                    Calendar & Events
                </CardTitle>
            </CardHeader>
            <CardContent className="relative">
                <div className="space-y-2">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() =>
                                setCurrentDate(
                                    new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() - 1,
                                    ),
                                )
                            }
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-[#163832]/10 hover:text-[#163832] dark:text-gray-400 dark:hover:bg-[#163832]/40 dark:hover:text-[#DAF1DE]"
                        >
                            ←
                        </button>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {monthNames[currentDate.getMonth()]}{' '}
                            {currentDate.getFullYear()}
                        </h3>
                        <button
                            onClick={() =>
                                setCurrentDate(
                                    new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() + 1,
                                    ),
                                )
                            }
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-[#163832]/10 hover:text-[#163832] dark:text-gray-400 dark:hover:bg-[#163832]/40 dark:hover:text-[#DAF1DE]"
                        >
                            →
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-xs">
                        {weekDays.map((day) => (
                            <div
                                key={day}
                                className="p-2 text-center font-semibold"
                            >
                                {day}
                            </div>
                        ))}
                        {getDaysInMonth(currentDate).map((day, index) => {
                            if (day === null) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="p-2"
                                    ></div>
                                );
                            }

                            const { noticeEvents, holidayEvents } =
                                getEventsForDate(day);
                            const isToday =
                                day === new Date().getDate() &&
                                currentDate.getMonth() ===
                                    new Date().getMonth() &&
                                currentDate.getFullYear() ===
                                    new Date().getFullYear();
                            const hasHoliday = holidayEvents.length > 0;
                            const hasEvents = noticeEvents.length > 0;
                            const hasContent =
                                hasEvents || hasHoliday || isToday;

                            const getDayStyle = () => {
                                if (isToday)
                                    return 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-900 dark:text-blue-100 font-semibold';
                                if (hasHoliday)
                                    return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400';
                                if (hasEvents)
                                    return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400';
                                return 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50';
                            };

                            return (
                                <div
                                    key={day}
                                    className={`relative rounded border p-2 text-center ${
                                        hasContent
                                            ? 'cursor-pointer'
                                            : 'cursor-default'
                                    } ${getDayStyle()}`}
                                    onClick={() =>
                                        hasContent && handleDayClick(day)
                                    }
                                >
                                    <div className="font-medium">{day}</div>
                                    {/* Show small indicator only for today's notices */}
                                    {hasEvents && isToday && (
                                        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Events Sections - Side by Side */}
                    <div className="flex gap-4">
                        {/* Today's Events - Left Side */}
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-semibold dark:text-gray-100">
                                Today
                            </h4>
                            <div className="hide-scrollbar max-h-40 space-y-2 overflow-y-auto">
                                {/* Filter notices for today only */}
                                {notices
                                    .filter((notice: NoticeEvent) => {
                                        if (!notice.date) return false;
                                        const noticeDate = new Date(
                                            notice.date,
                                        );
                                        const today = new Date();
                                        return (
                                            noticeDate.getDate() ===
                                                today.getDate() &&
                                            noticeDate.getMonth() ===
                                                today.getMonth() &&
                                            noticeDate.getFullYear() ===
                                                today.getFullYear()
                                        );
                                    })
                                    .slice(0, 3)
                                    .map((notice: NoticeEvent) => (
                                        <div
                                            key={notice.id}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <Clock className="mt-0.5 h-3 w-3 text-gray-500 dark:text-gray-400" />
                                            <div className="flex-1">
                                                <div className="font-medium dark:text-gray-200">
                                                    {notice.title}
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    {notice.time || 'No time'}
                                                </div>
                                                <div className="text-gray-400 dark:text-gray-500">
                                                    {notice.category}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {/* Filter holidays for today only */}
                                {holidays
                                    .filter((holiday) => {
                                        const holidayDate = new Date(
                                            holiday.date,
                                        );
                                        const today = new Date();
                                        return (
                                            holidayDate.getDate() ===
                                                today.getDate() &&
                                            holidayDate.getMonth() ===
                                                today.getMonth() &&
                                            holidayDate.getFullYear() ===
                                                today.getFullYear()
                                        );
                                    })
                                    .map((holiday) => (
                                        <div
                                            key={holiday.date}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <MapPin className="mt-0.5 h-3 w-3 text-red-500" />
                                            <div className="flex-1">
                                                <div className="font-medium text-red-600 dark:text-red-400">
                                                    {holiday.name}
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    {holiday.type === 'regular'
                                                        ? 'Regular Holiday'
                                                        : 'Special Holiday'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                {/* Show message if no events or holidays today */}
                                {(() => {
                                    const today = new Date();
                                    const todayNotices = notices.filter(
                                        (notice: NoticeEvent) => {
                                            if (!notice.date) return false;
                                            const noticeDate = new Date(
                                                notice.date,
                                            );
                                            return (
                                                noticeDate.getDate() ===
                                                    today.getDate() &&
                                                noticeDate.getMonth() ===
                                                    today.getMonth() &&
                                                noticeDate.getFullYear() ===
                                                    today.getFullYear()
                                            );
                                        },
                                    );

                                    const todayHolidays = holidays.filter(
                                        (holiday) => {
                                            const holidayDate = new Date(
                                                holiday.date,
                                            );
                                            const today = new Date();
                                            return (
                                                holidayDate.getDate() ===
                                                    today.getDate() &&
                                                holidayDate.getMonth() ===
                                                    today.getMonth() &&
                                                holidayDate.getFullYear() ===
                                                    today.getFullYear()
                                            );
                                        },
                                    );

                                    if (
                                        todayNotices.length === 0 &&
                                        todayHolidays.length === 0
                                    ) {
                                        return (
                                            <div className="py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                                                No events or holidays today
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        {/* Upcoming Events - Right Side */}
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-semibold dark:text-gray-100">
                                Upcoming
                            </h4>
                            <div className="hide-scrollbar max-h-40 space-y-2 overflow-y-auto">
                                {/* Filter notices to show only current month */}
                                {notices
                                    .filter((notice: NoticeEvent) => {
                                        if (!notice.date) return false;
                                        const noticeDate = new Date(
                                            notice.date,
                                        );
                                        const isCurrentMonth =
                                            noticeDate.getMonth() ===
                                                currentDate.getMonth() &&
                                            noticeDate.getFullYear() ===
                                                currentDate.getFullYear();
                                        const isTodayOrFuture =
                                            noticeDate >= new Date();
                                        return (
                                            isCurrentMonth && isTodayOrFuture
                                        );
                                    })
                                    .slice(0, 3)
                                    .map((notice: NoticeEvent) => (
                                        <div
                                            key={notice.id}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <Clock className="mt-0.5 h-3 w-3 text-gray-500 dark:text-gray-400" />
                                            <div className="flex-1">
                                                <div className="font-medium dark:text-gray-200">
                                                    {notice.title}
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    {notice.date} at{' '}
                                                    {notice.time || 'No time'}
                                                </div>
                                                <div className="text-gray-400 dark:text-gray-500">
                                                    {notice.category}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {/* Filter holidays to show only current month */}
                                {holidays
                                    .filter((holiday) => {
                                        const holidayDate = new Date(
                                            holiday.date,
                                        );
                                        const isCurrentMonth =
                                            holidayDate.getMonth() ===
                                                currentDate.getMonth() &&
                                            holidayDate.getFullYear() ===
                                                currentDate.getFullYear();
                                        const isTodayOrFuture =
                                            holidayDate >= new Date();
                                        return (
                                            isCurrentMonth && isTodayOrFuture
                                        );
                                    })
                                    .slice(0, 3)
                                    .map((holiday) => (
                                        <div
                                            key={holiday.date}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <MapPin className="mt-0.5 h-3 w-3 text-red-500" />
                                            <div className="flex-1">
                                                <div className="font-medium text-red-600 dark:text-red-400">
                                                    {holiday.name}
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    {holiday.date} -{' '}
                                                    {holiday.type === 'regular'
                                                        ? 'Regular Holiday'
                                                        : 'Special Holiday'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                {/* Show message if no events or holidays */}
                                {(() => {
                                    const currentMonthNotices = notices.filter(
                                        (notice: NoticeEvent) => {
                                            if (!notice.date) return false;
                                            const noticeDate = new Date(
                                                notice.date,
                                            );
                                            const isCurrentMonth =
                                                noticeDate.getMonth() ===
                                                    currentDate.getMonth() &&
                                                noticeDate.getFullYear() ===
                                                    currentDate.getFullYear();
                                            const isTodayOrFuture =
                                                noticeDate >= new Date();
                                            return (
                                                isCurrentMonth &&
                                                isTodayOrFuture
                                            );
                                        },
                                    );

                                    const currentMonthHolidays =
                                        holidays.filter((holiday) => {
                                            const holidayDate = new Date(
                                                holiday.date,
                                            );
                                            const isCurrentMonth =
                                                holidayDate.getMonth() ===
                                                    currentDate.getMonth() &&
                                                holidayDate.getFullYear() ===
                                                    currentDate.getFullYear();
                                            const isTodayOrFuture =
                                                holidayDate >= new Date();
                                            return (
                                                isCurrentMonth &&
                                                isTodayOrFuture
                                            );
                                        });

                                    if (
                                        currentMonthNotices.length === 0 &&
                                        currentMonthHolidays.length === 0
                                    ) {
                                        return (
                                            <div className="py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                                                No upcoming events or holidays
                                                this month
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 border-t pt-3 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full border border-blue-500 bg-blue-100"></div>
                                <span className="dark:text-gray-300">
                                    Today
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"></div>
                                <span className="dark:text-gray-300">
                                    Holiday
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"></div>
                                <span className="dark:text-gray-300">
                                    Notice/Event
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Modal for showing events on clicked date */}
                    {showModal && selectedDate && (
                        <div className="absolute top-1/2 left-1/2 z-50 max-w-sm -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-gray-200 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="rounded bg-white p-3 dark:bg-neutral-900">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold dark:text-gray-100">
                                        {selectedDate.toLocaleDateString(
                                            'en-US',
                                            {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            },
                                        )}
                                    </h3>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Show notices for this date */}
                                    {(() => {
                                        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                                        const dayNotices = notices.filter(
                                            (notice: NoticeEvent) =>
                                                notice.date === dateStr,
                                        );
                                        const dayHolidays = holidays.filter(
                                            (holiday) =>
                                                holiday.date === dateStr,
                                        );

                                        return (
                                            <>
                                                {dayNotices.length > 0 && (
                                                    <div>
                                                        <h4 className="mb-2 font-medium text-green-700 dark:text-green-500">
                                                            Notices/Events
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {dayNotices.map(
                                                                (
                                                                    notice: NoticeEvent,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            notice.id
                                                                        }
                                                                        className="border-l-4 border-green-500 py-2 pl-3"
                                                                    >
                                                                        <div className="text-sm font-medium dark:text-gray-200">
                                                                            {
                                                                                notice.title
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                            {
                                                                                notice.category
                                                                            }{' '}
                                                                            •{' '}
                                                                            {notice.time ||
                                                                                'No time'}
                                                                        </div>
                                                                        {notice.description && (
                                                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                                {
                                                                                    notice.description
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {dayHolidays.length > 0 && (
                                                    <div>
                                                        <h4 className="mb-2 font-medium text-red-700 dark:text-red-500">
                                                            Holidays
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {dayHolidays.map(
                                                                (
                                                                    holiday,
                                                                    index,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="border-l-4 border-red-500 py-2 pl-3"
                                                                    >
                                                                        <div className="text-sm font-medium dark:text-gray-200">
                                                                            {
                                                                                holiday.name
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                            {holiday.type ===
                                                                            'regular'
                                                                                ? 'Regular Holiday'
                                                                                : 'Special Holiday'}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {dayNotices.length === 0 &&
                                                    dayHolidays.length ===
                                                        0 && (
                                                        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                                                            No events or
                                                            holidays for this
                                                            date
                                                        </div>
                                                    )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CalendarWidget;
