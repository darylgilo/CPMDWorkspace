import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import CalendarWidget from '@/components/widgets/CalendarWidget';
import WeatherWidget from '@/components/widgets/WeatherWidget';
import WriteupsWidget from '@/components/widgets/WriteupsWidget';
import PostedWriteupsWidget from '@/components/widgets/PostedWriteupsWidget';
import WhereaboutsWidget from '@/components/widgets/WhereaboutsWidget';
import DeadlinesWidget from '@/components/widgets/DeadlinesWidget';
import { BarChart3, Users, FileText, TrendingUp, Plus, Download, UserCheck, UserX, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch employee stats
            const today = new Date().toISOString().split('T')[0];
            const employeeResponse = await fetch(`/api/whereabouts?date=${today}`);
            const employeeData = await employeeResponse.json();

            if (employeeData.stats) {
                setEmployeeStats((prev: any) => ({
                    ...employeeData.stats,
                    online: prev.online // Keep online if it was set
                }));
            }

            // Fetch real-time online stats from usermanagement
            const userStatsResponse = await fetch('/api/user-stats');
            const userStatsData = await userStatsResponse.json();

            if (userStatsData) {
                setEmployeeStats((prev: any) => ({
                    ...prev,
                    total: userStatsData.total || prev.total,
                    online: userStatsData.online || 0
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
                return noticeDate.getMonth() === currentMonth &&
                    noticeDate.getFullYear() === currentYear &&
                    notice.category === 'Reminder/Deadline';
            });

            setNoticeCount(currentMonthNotices.length);

            // Fetch write-ups for review
            const writeupResponse = await fetch('/api/writeups?perPage=10');
            const writeupData = await writeupResponse.json();

            // Count write-ups that are 'for review'
            const writeupsForReview = writeupData.data?.filter((writeup: any) =>
                writeup.status === 'for review'
            ).length || 0;

            setWriteupCount(writeupsForReview);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-gray-50/30 dark:bg-neutral-950 px-0 pb-6">
                {/* Header Section */}
                <div className="mb-6 px-6">
                </div>

                {/* Employee Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 px-6">
                    <Card className="bg-[#163832] border-[#163832] shadow-lg hover:shadow-xl transition-shadow dark:bg-[#112a26] dark:border-[#112a26]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm font-medium">Online Employees</p>
                                    <p className="text-3xl font-bold text-white mt-2">{loading ? '...' : employeeStats.online}</p>
                                </div>
                                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-[#DAF1DE]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow dark:bg-neutral-900 dark:border-neutral-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Write-up on Review</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{loading ? '...' : writeupCount}</p>
                                </div>
                                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg">
                                    <FileText className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow dark:bg-neutral-900 dark:border-neutral-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Reminders/Deadlines</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{loading ? '...' : noticeCount}</p>
                                </div>
                                <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-lg">
                                    <CalendarDays className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow dark:bg-neutral-900 dark:border-neutral-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total CPMD Employees</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{loading ? '...' : employeeStats.total}</p>
                                </div>
                                <div className="bg-gray-100 dark:bg-neutral-800 p-3 rounded-lg">
                                    <Users className="h-6 w-6 text-gray-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
                    {/* Left Column - Calendar */}
                    <div className="flex flex-col h-full">
                        <CalendarWidget className="h-full" />
                    </div>

                    {/* Middle Column - Weather and Deadlines */}
                    <div className="flex flex-col gap-6 h-full">
                        <WeatherWidget />
                        <DeadlinesWidget className="flex-1" />
                    </div>

                    {/* Right Column - Whereabouts only */}
                    <div className="flex flex-col h-full">
                        <WhereaboutsWidget className="h-full" />
                    </div>
                </div>

                {/* Writeups Section with Right Sidebar - Full width */}
                <div className="lg:col-span-3 mt-6 px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
