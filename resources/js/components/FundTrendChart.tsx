import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import React, { useMemo, useState, useEffect } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useAppearance } from '@/hooks/use-appearance';

interface FundData {
    year: number;
    funds: Record<string, number>;
}

interface ChartDataPoint {
    name: string;
    [key: string]: number | string;
}

interface FundTrendChartProps {
    title: string;
    data: FundData[];
    height?: number;
    className?: string;
    showCount?: boolean;
    currency?: string;
    onYearChange?: (year: number) => void;
}

// Theme-aware color palettes for line charts
const LIGHT_LINE_COLORS = [
    '#163832', // Primary dark green
    '#dc2626', // Red
    '#059669', // Green
    '#7c3aed', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#be123c', // Pink
    '#1e40af', // Blue
];

const DARK_LINE_COLORS = [
    '#10b981', // Light green
    '#ef4444', // Light red
    '#34d399', // Lighter green
    '#a78bfa', // Light purple
    '#fb923c', // Light orange
    '#22d3ee', // Light cyan
    '#f472b6', // Light pink
    '#60a5fa', // Light blue
];

export default function FundTrendChart({
    title,
    data,
    height = 300,
    className = '',
    showCount = false,
    currency = 'PHP',
    onYearChange,
}: FundTrendChartProps) {
    const { appearance } = useAppearance();
    const isDark = appearance === 'dark' || (appearance === 'system' && 
        (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    
    const lineColors = isDark ? DARK_LINE_COLORS : LIGHT_LINE_COLORS;

    const [selectedYear, setSelectedYear] = useState(() => {
        // Set initial selected year to the latest year in data or current year
        if (data && data.length > 0) {
            const latestYear = Math.max(...data.map(item => item.year));
            return latestYear;
        }
        return new Date().getFullYear();
    });

    // Update selected year when data changes to always show the latest year
    useEffect(() => {
        if (data && data.length > 0) {
            const latestYear = Math.max(...data.map(item => item.year));
            setSelectedYear(latestYear);
            onYearChange?.(latestYear);
        }
    }, [data, onYearChange]);

    // Generate years from data and extend range
    const years = useMemo(() => {
        if (!data || data.length === 0) {
            const currentYear = new Date().getFullYear();
            return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
        }

        const dataYears = data.map(item => item.year);
        const minYear = Math.min(...dataYears);
        const maxYear = Math.max(...dataYears);
        
        // Extend range by 2 years on each side
        const years = [];
        for (let year = minYear - 2; year <= maxYear + 2; year++) {
            years.push(year);
        }
        
        return years;
    }, [data]);

    // Transform data for chart
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data
            .filter(item => item.year <= selectedYear)
            .map(item => ({
                name: item.year.toString(),
                ...item.funds
            }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }, [data, selectedYear]);

    // Get all unique fund names for lines
    const fundNames = useMemo(() => {
        if (!data || data.length === 0) return [];
        const allFunds = new Set<string>();
        data.forEach(item => {
            Object.keys(item.funds).forEach(fundName => allFunds.add(fundName));
        });
        return Array.from(allFunds).sort();
    }, [data]);

    // Generate colors for different fund lines
    const fundColors = useMemo(() => {
        const colorMap: Record<string, string> = {};
        fundNames.forEach((fundName, index) => {
            colorMap[fundName] = lineColors[index % lineColors.length];
        });
        return colorMap;
    }, [fundNames, lineColors]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!chartData.length) {
            return {
                totalAmount: 0,
                totalCount: 0,
                averageAmount: 0,
                trend: 'stable' as 'up' | 'down' | 'stable'
            };
        }

        // Get data for the selected year only
        const selectedYearData = chartData.find(item => parseInt(item.name) === selectedYear);
        const totalAmount = selectedYearData 
            ? Object.values(selectedYearData).reduce((fundSum, value) => {
                return fundSum + (typeof value === 'number' ? value : 0);
            }, 0)
            : 0;
        
        const fundCount = selectedYearData 
            ? Object.keys(selectedYearData).filter(key => key !== 'name').length
            : 0;
        
        const averageAmount = fundCount > 0 ? totalAmount / fundCount : 0;

        // Calculate trend based on year-over-year comparison
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (chartData.length >= 2) {
            const sortedData = [...chartData].sort((a, b) => parseInt(a.name) - parseInt(b.name));
            const currentIndex = sortedData.findIndex(item => parseInt(item.name) === selectedYear);
            
            if (currentIndex > 0) {
                const currentYearTotal = totalAmount;
                const previousYearTotal = sortedData[currentIndex - 1]
                    ? Object.values(sortedData[currentIndex - 1]).reduce((fundSum, value) => {
                        return fundSum + (typeof value === 'number' ? value : 0);
                    }, 0)
                    : 0;
                
                if (currentYearTotal > previousYearTotal * 1.05) trend = 'up';
                else if (currentYearTotal < previousYearTotal * 0.95) trend = 'down';
            }
        }

        return {
            totalAmount,
            totalCount: fundCount,
            averageAmount,
            trend
        };
    }, [chartData, selectedYear]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        onYearChange?.(year);
    };

    const trendColors = {
        up: '#10b981',
        down: '#ef4444',
        stable: '#6b7280'
    };

    return (
        <Card className={`p-6 ${className}`}>
            {/* Header with Controls */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Year:
                        </span>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) => handleYearChange(parseInt(value))}
                        >
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Statistics Summary */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(stats.totalAmount)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Entries</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {stats.totalCount}
                        </p>
                    </div>
                </div>

                {/* Trend Indicator */}
                <div className="mt-2 flex items-center justify-center">
                    <div 
                        className="flex items-center gap-1 text-sm"
                        style={{ color: trendColors[stats.trend] }}
                    >
                        <span>Trend: {stats.trend === 'up' ? '↗' : stats.trend === 'down' ? '↘' : '→'}</span>
                        <span className="capitalize">{stats.trend}</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                        stroke={isDark ? '#374151' : '#e5e7eb'}
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke={isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }} 
                        stroke={isDark ? '#9ca3af' : '#6b7280'}
                        tickFormatter={(value) => {
                            if (value === 0) return '0';
                            if (value >= 1000000) {
                                return `${(value / 1000000).toFixed(1)}m`;
                            }
                            if (value >= 1000) {
                                return `${(value / 1000).toFixed(0)}k`;
                            }
                            return value.toString();
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: isDark ? '#f3f4f6' : '#111827', fontWeight: 600 }}
                        formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Amount']}
                    />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px',
                        }}
                    />
                    {fundNames.map((fundName) => (
                        <Line
                            key={fundName}
                            type="monotone"
                            dataKey={fundName}
                            stroke={fundColors[fundName]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name={fundName}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
