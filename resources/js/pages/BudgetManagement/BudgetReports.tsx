import SimpleStatistic from '@/components/SimpleStatistic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { BarChart3, DollarSign, TrendingUp, FileText, Download } from 'lucide-react';
import React, { useState } from 'react';

interface Report {
    id: number;
    report_type: string;
    fund_name: string;
    period: string;
    total_amount: number;
    allocated_amount: number;
    spent_amount: number;
    remaining_amount: number;
    generated_date: string;
    file_path?: string;
}

interface PageProps {
    reports: {
        data: Report[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    reportAnalytics: {
        totalReports: number;
        totalAmount: number;
        totalSpent: number;
        thisMonthReports: number;
    };
    funds: Array<{ id: number; fund_name: string }>;
    [key: string]: unknown;
}

export default function BudgetReports() {
    const { props } = usePage<PageProps>();
    const {
        reports,
        reportAnalytics: analytics,
        funds = [],
    } = props;

    const [selectedFund, setSelectedFund] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleGenerateReport = () => {
        // Logic to generate report
        router.post('/budget-reports/generate', {
            fund_id: selectedFund,
            period: selectedPeriod,
        });
    };

    const handleDownloadReport = (reportId: number) => {
        // Logic to download report
        router.get(`/budget-reports/${reportId}/download`);
    };

    if (!reports) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">Loading report data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Reports
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics?.totalReports || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Amount
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(analytics?.totalAmount || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Spent
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(analytics?.totalSpent || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            This Month
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics?.thisMonthReports || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Generation */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate Budget Report</CardTitle>
                    <CardDescription>
                        Create detailed budget reports for specific funds and periods
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium">Fund</label>
                            <Select value={selectedFund} onValueChange={setSelectedFund}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select fund" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Funds</SelectItem>
                                    {funds.map((fund) => (
                                        <SelectItem key={fund.id} value={fund.id.toString()}>
                                            {fund.fund_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium">Period</label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current-month">Current Month</SelectItem>
                                    <SelectItem value="last-month">Last Month</SelectItem>
                                    <SelectItem value="current-quarter">Current Quarter</SelectItem>
                                    <SelectItem value="current-year">Current Year</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGenerateReport}>
                            Generate Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Budget Reports</CardTitle>
                    <CardDescription>
                        View and download generated budget reports
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 dark:border-neutral-700">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-neutral-800">
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Report Type
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Fund Name
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Period
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Total Amount
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Allocated Amount
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Spent Amount
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Remaining Amount
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Generated Date
                                    </th>
                                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold dark:border-neutral-700">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports?.data && reports.data.length > 0 ? (
                                    reports.data.map((report: Report) => (
                                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                {report.report_type}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                {report.fund_name}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                {report.period}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                {formatCurrency(report.total_amount)}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                {formatCurrency(report.allocated_amount)}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                {formatCurrency(report.spent_amount)}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                <span className={`font-semibold ${
                                                    report.remaining_amount === 0
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : report.remaining_amount < report.total_amount * 0.2
                                                          ? 'text-orange-600 dark:text-orange-400'
                                                          : 'text-green-600 dark:text-green-400'
                                                }`}>
                                                    {formatCurrency(report.remaining_amount)}
                                                </span>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                {formatDate(report.generated_date)}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 dark:border-neutral-700">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownloadReport(report.id)}
                                                    >
                                                        <Download className="h-3 w-3 mr-1" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="border border-gray-200 px-4 py-8 text-center dark:border-neutral-700">
                                            No reports found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
