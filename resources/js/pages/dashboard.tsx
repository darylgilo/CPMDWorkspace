import { Card, CardContent } from '@/components/ui/card';
import CalendarWidget from '@/components/widgets/CalendarWidget';
import DeadlinesWidget from '@/components/widgets/DeadlinesWidget';
import PostedWriteupsWidget from '@/components/widgets/PostedWriteupsWidget';
import WeatherWidget from '@/components/widgets/WeatherWidget';
import WhereaboutsWidget from '@/components/widgets/WhereaboutsWidget';
import WriteupsWidget from '@/components/widgets/WriteupsWidget';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FileText, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const [employeeStats, setEmployeeStats] = useState({
        total: 0,
        onDuty: 0,
        onTravel: 0,
        onLeave: 0,
        absent: 0,
        halfDay: 0,
        wfh: 0,
        online: 0,
    });
    const [noticeCount, setNoticeCount] = useState(0);
    const [writeupCount, setWriteupCount] = useState(0);
    const [myTasks, setMyTasks] = useState<any[]>([]);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (myTasks.length > 1) {
            const timer = setInterval(() => {
                setCurrentTaskIndex((prev) => (prev + 1) % myTasks.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [myTasks]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch employee stats
            const today = new Date().toISOString().split('T')[0];
            const employeeResponse = await fetch(
                `/api/whereabouts?date=${today}`,
            );
            const employeeData = await employeeResponse.json();

            if (employeeData.stats) {
                setEmployeeStats((prev: any) => ({
                    ...employeeData.stats,
                    online: prev.online, // Keep online if it was set
                }));
            }

            // Fetch real-time online stats from usermanagement
            const userStatsResponse = await fetch('/api/user-stats');
            const userStatsData = await userStatsResponse.json();

            if (userStatsData) {
                setEmployeeStats((prev: any) => ({
                    ...prev,
                    total: userStatsData.total || prev.total,
                    online: userStatsData.online || 0,
                }));
            }

            // Fetch notices for current month
            const noticeResponse = await fetch('/api/notices');
            const noticeData = await noticeResponse.json();

            // Filter notices for current month
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const currentMonthNotices = noticeData.filter((notice: any) => {
                if (!notice.date) return false;
                const noticeDate = new Date(notice.date);
                return (
                    noticeDate.getMonth() === currentMonth &&
                    noticeDate.getFullYear() === currentYear &&
                    notice.category === 'Reminder/Deadline'
                );
            });

            setNoticeCount(currentMonthNotices.length);

            // Fetch write-ups for review
            const writeupResponse = await fetch('/api/writeups?perPage=10');
            const writeupData = await writeupResponse.json();

            // Count write-ups that are 'for review'
            const writeupsForReview =
                writeupData.data?.filter(
                    (writeup: any) => writeup.status === 'for review',
                ).length || 0;

            setWriteupCount(writeupsForReview);

            // Fetch my tasks
            const taskResponse = await fetch('/api/my-tasks');
            const taskData = await taskResponse.json();
            setMyTasks(taskData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-gray-50/30 px-0 pb-6 dark:bg-neutral-950">
                {/* Header Section */}
                <div className="mb-6 px-6"></div>

                {/* Employee Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 px-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden border-[#163832] bg-[#163832] shadow-lg transition-shadow hover:shadow-xl dark:border-[#112a26] dark:bg-[#112a26]">
                        <CardContent className="flex h-[100px] flex-col justify-center p-6">
                            {loading ? (
                                <div className="flex items-center justify-between">
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-4 w-24 rounded bg-white/20"></div>
                                        <div className="h-8 w-32 rounded bg-white/20"></div>
                                    </div>
                                </div>
                            ) : myTasks.length > 0 ? (
                                <div className="flex h-full flex-col justify-center">
                                    <div className="mb-1 flex items-center justify-between">
                                        <p className="text-xs font-bold tracking-wider text-white/80 uppercase">
                                            My Tasks
                                        </p>
                                    </div>
                                    <div className="transition-all duration-500 ease-in-out">
                                        <p className="line-clamp-1 truncate text-lg font-bold text-white">
                                            {myTasks[currentTaskIndex].title}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                                    myTasks[currentTaskIndex]
                                                        .priority === 'urgent'
                                                        ? 'bg-red-500 text-white'
                                                        : myTasks[
                                                                currentTaskIndex
                                                            ].priority ===
                                                            'high'
                                                          ? 'bg-orange-500 text-white'
                                                          : 'bg-blue-500 text-white'
                                                }`}
                                            >
                                                {
                                                    myTasks[currentTaskIndex]
                                                        .priority
                                                }
                                            </span>
                                            <span className="text-[10px] text-white/60">
                                                {
                                                    myTasks[currentTaskIndex]
                                                        .progress
                                                }
                                                % complete
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white/80">
                                            My Tasks
                                        </p>
                                        <p className="mt-2 text-lg font-bold text-white/60 italic">
                                            No active tasks
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        {!loading && myTasks.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                                {myTasks.slice(0, 5).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all ${i === currentTaskIndex ? 'w-3 bg-white' : 'w-1 bg-white/30'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Write-up on Review
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                                        {loading ? '...' : writeupCount}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/40">
                                    <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Online Users
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                                        {loading ? '...' : employeeStats.online}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/40">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Total CPMD Employees
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                                        {loading ? '...' : employeeStats.total}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-gray-100 p-3 dark:bg-neutral-800">
                                    <Users className="h-6 w-6 text-gray-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 px-6 lg:grid-cols-3">
                    {/* Left Column - Calendar */}
                    <div className="flex h-full flex-col">
                        <CalendarWidget className="h-full" />
                    </div>

                    {/* Middle Column - Weather and Deadlines */}
                    <div className="flex h-full flex-col gap-6">
                        <WeatherWidget />
                        <DeadlinesWidget className="flex-1" />
                    </div>

                    {/* Right Column - Whereabouts only */}
                    <div className="flex h-full flex-col">
                        <WhereaboutsWidget className="h-full" />
                    </div>
                </div>

                {/* Writeups Section with Right Sidebar - Full width */}
                <div className="mt-6 px-6 lg:col-span-3">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {/* Main Content - Writeups Widget (3 columns) */}
                        <div className="lg:col-span-3">
                            <WriteupsWidget />
                        </div>

                        {/* Right Sidebar - Writeup Posted Widget */}
                        <div className="space-y-6">
                            <PostedWriteupsWidget />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
