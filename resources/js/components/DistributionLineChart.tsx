import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface Distribution {
    received_date?: string;
}

interface ChartDataPoint {
    month: string;
    [key: string]: string | number;
}

interface DistributionLineChartProps {
    title: string;
    data: ChartDataPoint[];
    lines: Array<{
        dataKey: string;
        name: string;
        color: string;
    }>;
    height?: number;
    className?: string;
    distributions?: Distribution[]; // Add distributions prop for year extraction
    onYearChange?: (year: number) => void;
    onMonthChange?: (month: number) => void;
    onViewTypeChange?: (viewType: 'monthly' | 'yearly') => void;
}

export default function DistributionLineChart({
    title,
    data,
    lines,
    height = 400,
    className = '',
    distributions,
    onYearChange,
    onMonthChange,
    onViewTypeChange,
}: DistributionLineChartProps) {
    const [filterType, setFilterType] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    // const [calendarDate, setCalendarDate] = useState(new Date());

    // Generate years dynamically - show all years with scrollable dropdown
    const years = useMemo(() => {
        const dataYears = new Set<number>();
        
        // Extract years from the actual distribution data
        distributions?.forEach((distribution: Distribution) => {
            if (distribution.received_date) {
                const year = new Date(distribution.received_date).getFullYear();
                dataYears.add(year);
            }
        });
        
        // Create a wide range of years for scrolling (1950 to current year + 10)
        const currentYear = new Date().getFullYear();
        const allYears = [];
        
        // Generate years from 1950 to current year + 10
        for (let year = 1950; year <= currentYear + 10; year++) {
            allYears.push(year);
        }
        
        return allYears;
    }, [distributions]);
    
    const months = useMemo(() => [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ], []);

    // Filter data based on selected filters
    const displayData = useMemo(() => {
        if (filterType === 'yearly') {
            // For yearly view, show all 12 months for the selected year
            return data; // The data is already monthly, so we show all months
        } else {
            // For monthly view, show data for the selected month only
            const selectedMonthName = months[selectedMonth];
            return data.filter(item => item.month === selectedMonthName);
        }
    }, [data, filterType, selectedMonth, months]);

    // const handleCalendarPrevious = () => {
    //     const newDate = new Date(calendarDate);
    //     if (filterType === 'monthly') {
    //         newDate.setMonth(newDate.getMonth() - 1);
    //     } else {
    //         newDate.setFullYear(newDate.getFullYear() - 1);
    //     }
    //     setCalendarDate(newDate);
    //     setSelectedMonth(newDate.getMonth());
    //     setSelectedYear(newDate.getFullYear());
        
    //     // Trigger parent component to update data if needed
    //     // This will cause the displayData useMemo to recalculate
    // };

    // const handleCalendarNext = () => {
    //     const newDate = new Date(calendarDate);
    //     if (filterType === 'monthly') {
    //         newDate.setMonth(newDate.getMonth() + 1);
    //     } else {
    //         newDate.setFullYear(newDate.getFullYear() + 1);
    //     }
    //     setCalendarDate(newDate);
    //     setSelectedMonth(newDate.getMonth());
    //     setSelectedYear(newDate.getFullYear());
    // };

    return (
        <Card className={`p-6 ${className}`}>
            {/* Header with Filters */}
            <div className="mb-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
                
                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Filter Type Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">View:</span>
                        <Select value={filterType} onValueChange={(value: 'monthly' | 'yearly') => {
                            setFilterType(value);
                            onViewTypeChange?.(value);
                        }}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Year:</span>
                        <Select value={selectedYear.toString()} onValueChange={(value) => {
                            const year = parseInt(value);
                            setSelectedYear(year);
                            onYearChange?.(year);
                        }}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Month Selector (only for monthly view) */}
                    {filterType === 'monthly' && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Month:</span>
                            <Select value={selectedMonth.toString()} onValueChange={(value) => {
                                const month = parseInt(value);
                                setSelectedMonth(month);
                                onMonthChange?.(month);
                            }}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month, index) => (
                                        <SelectItem key={index} value={index.toString()}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={displayData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                        dataKey={filterType === 'monthly' && displayData.length === 1 ? 'month' : 'month'}
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                    />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#111827', fontWeight: 600 }}
                    />
                    <Legend 
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px'
                        }}
                    />
                    {lines.map((line) => (
                        <Line
                            key={line.dataKey}
                            type="monotone"
                            dataKey={line.dataKey}
                            stroke={line.color}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name={line.name}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
