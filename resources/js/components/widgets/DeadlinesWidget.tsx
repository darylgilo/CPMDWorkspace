import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CalendarDays, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Deadline {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
    posted_by: string;
    posted_date: string;
}

export default function DeadlinesWidget({ className }: { className?: string }) {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [slideInterval, setSlideInterval] = useState<NodeJS.Timeout | null>(
        null,
    );

    useEffect(() => {
        fetchDeadlines();
    }, []);

    useEffect(() => {
        // Auto-slide every 5 seconds
        if (deadlines.length > 1) {
            const interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % deadlines.length);
            }, 5000);
            setSlideInterval(interval);
        }

        return () => {
            if (slideInterval) {
                clearInterval(slideInterval);
            }
        };
    }, [deadlines.length]);

    const fetchDeadlines = async () => {
        try {
            const response = await fetch('/api/notices');
            const data = await response.json();

            // Filter for reminders/deadlines and sort by date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const filteredDeadlines = data
                .filter(
                    (notice: any) => notice.category === 'Reminder/Deadline',
                )
                .map(
                    (notice: any): Deadline => ({
                        id: notice.id,
                        title: notice.title,
                        description: notice.description || '',
                        date: notice.date,
                        time: notice.time || '00:00',
                        priority: notice.priority || 'medium',
                        posted_by: notice.posted_by || 'System',
                        posted_date: notice.created_at,
                    }),
                )
                .filter((deadline: Deadline) => {
                    // Filter out deadlines overdue for 6 days or more
                    const deadlineDateTime = new Date(`${deadline.date} ${deadline.time}`);
                    const now = new Date();
                    const daysOverdue = Math.floor((now.getTime() - deadlineDateTime.getTime()) / (1000 * 60 * 60 * 24));
                    return daysOverdue < 6;
                })
                .sort((a: Deadline, b: Deadline) => {
                    const dateA = new Date(`${a.date} ${a.time}`);
                    const dateB = new Date(`${b.date} ${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                });

            setDeadlines(filteredDeadlines);
        } catch (error) {
            console.error('Error fetching deadlines:', error);
            setDeadlines([]);
        } finally {
            setLoading(false);
        }
    };

    const getDeadlineStatus = (deadline: Deadline) => {
        const deadlineDateTime = new Date(`${deadline.date} ${deadline.time}`);
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline.date);

        if (deadlineDateTime < now) {
            return {
                status: 'overdue',
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-100 dark:bg-red-900/40',
                label: 'Overdue',
            };
        } else if (deadlineDate.getTime() === today.getTime()) {
            return {
                status: 'today',
                color: 'text-orange-600 dark:text-orange-400',
                bgColor: 'bg-orange-100 dark:bg-orange-900/40',
                label: 'Due Today',
            };
        } else if (
            deadlineDate.getTime() <=
            today.getTime() + 7 * 24 * 60 * 60 * 1000
        ) {
            return {
                status: 'upcoming',
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-100 dark:bg-blue-900/40',
                label: 'Upcoming',
            };
        } else {
            return {
                status: 'future',
                color: 'text-gray-600 dark:text-gray-400',
                bgColor: 'bg-gray-100 dark:bg-neutral-800',
                label: 'Future',
            };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-500';
            case 'medium':
                return 'text-yellow-500';
            case 'low':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
    };

    const formatDeadlineDate = (date: string, time: string) => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        // Reset the auto-slide timer
        if (slideInterval) {
            clearInterval(slideInterval);
        }
        const newInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % deadlines.length);
        }, 5000);
        setSlideInterval(newInterval);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % deadlines.length);
        goToSlide((currentSlide + 1) % deadlines.length);
    };

    const prevSlide = () => {
        setCurrentSlide(
            (prev) => (prev - 1 + deadlines.length) % deadlines.length,
        );
        goToSlide((currentSlide - 1 + deadlines.length) % deadlines.length);
    };

    if (loading) {
        return (
            <Card className="border-gray-200 bg-white shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <CalendarDays className="h-4 w-4 text-[#163832] dark:text-green-400" />
                        Reminders/Deadlines
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex h-12 items-center justify-center">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#163832]"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (deadlines.length === 0) {
        return (
            <Card className="border-gray-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <CalendarDays className="h-4 w-4 text-[#163832] dark:text-green-400" />
                        Reminders/Deadlines
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="py-2 text-center">
                        <AlertCircle className="mx-auto mb-1 h-6 w-6 text-gray-400" />
                        <p className="text-xs text-gray-500">No deadlines</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const currentDeadline = deadlines[currentSlide];
    const deadlineStatus = getDeadlineStatus(currentDeadline);

    return (
        <Card
            className={`border-gray-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900 ${className || ''}`}
        >
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <CalendarDays className="h-4 w-4 text-[#163832] dark:text-green-400" />
                    Reminders/Deadlines
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                    {/* Current Deadline Display */}
                    <div
                        className={`rounded-lg border p-2 ${deadlineStatus.bgColor} border-opacity-30`}
                    >
                        <div className="mb-1 flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="mb-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
                                    {currentDeadline.title}
                                </h3>
                            </div>
                            <div
                                className={`ml-2 ${getPriorityColor(currentDeadline.priority)}`}
                            >
                                <AlertCircle className="h-3 w-3" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    {formatDeadlineDate(
                                        currentDeadline.date,
                                        currentDeadline.time,
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    {currentDeadline.time}
                                </span>
                            </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${deadlineStatus.bgColor} ${deadlineStatus.color}`}
                            >
                                {deadlineStatus.label}
                            </span>
                        </div>
                    </div>

                    {/* Slide Controls */}
                    {deadlines.length > 1 && (
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={prevSlide}
                                className="h-5 w-5 p-0"
                            >
                                ←
                            </Button>

                            <div className="flex gap-1">
                                {deadlines.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`h-1 w-1 rounded-full transition-colors ${
                                            index === currentSlide
                                                ? 'bg-[#163832]'
                                                : 'bg-gray-300 hover:bg-gray-400 dark:bg-neutral-600 dark:hover:bg-neutral-500'
                                        }`}
                                    />
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={nextSlide}
                                className="h-5 w-5 p-0"
                            >
                                →
                            </Button>
                        </div>
                    )}

                    {/* Summary Info */}
                    <div className="pt-1 text-center text-xs text-gray-500 dark:text-gray-400">
                        {currentSlide + 1} of {deadlines.length}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
