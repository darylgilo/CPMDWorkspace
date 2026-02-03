import { Card } from '@/components/ui/card';
import { useAppearance } from '@/hooks/use-appearance';
import { useMemo } from 'react';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface PieDataPoint {
    name: string;
    value: number;
    color?: string;
}

interface DonutPieChartProps {
    title: string;
    data: PieDataPoint[];
    height?: number;
    width?: number | string;
    className?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
    currency?: string;
    innerRadius?: number;
    outerRadius?: number;
    centerLabel?: string;
    centerValue?: string | number;
    showYearSelector?: boolean;
    availableYears?: number[];
    selectedYear?: number | null;
    onYearChange?: (year: number) => void;
}

// Theme-aware color palettes
const LIGHT_COLORS = [
    '#163832', // Primary dark green
    '#dc2626', // Red
    '#059669', // Green
    '#7c3aed', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#be123c', // Pink
    '#1e40af', // Blue
    '#84cc16', // Lime
    '#f59e0b', // Amber
];

const DARK_COLORS = [
    '#10b981', // Light green
    '#ef4444', // Light red
    '#34d399', // Lighter green
    '#a78bfa', // Light purple
    '#fb923c', // Light orange
    '#22d3ee', // Light cyan
    '#f472b6', // Light pink
    '#60a5fa', // Light blue
    '#bef264', // Light lime
    '#fbbf24', // Light amber
];

export default function DonutPieChart({
    title,
    data,
    height = 300,
    width = '100%',
    className = '',
    showLegend = true,
    showTooltip = true,
    currency = 'PHP',
    innerRadius = 60,
    outerRadius = 80,
    centerLabel,
    centerValue,
    showYearSelector = false,
    availableYears = [],
    selectedYear = null,
    onYearChange,
}: DonutPieChartProps) {
    const { appearance } = useAppearance();
    const isDark =
        appearance === 'dark' ||
        (appearance === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    // Process data and assign colors
    const processedData = useMemo(() => {
        return data.map((item, index) => ({
            ...item,
            color: item.color || colors[index % colors.length],
        }));
    }, [data, colors]);

    // Calculate total for percentage display
    const total = useMemo(() => {
        return data.reduce((sum, item) => sum + item.value, 0);
    }, [data]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatTooltipValue = (value: number) => {
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
        return [`${formatCurrency(value)} (${percentage}%)`, 'Amount'];
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage =
                total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
            return (
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <p className="font-semibold text-gray-900 dark:text-white">
                        {data.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(data.value)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        {percentage}% of total
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomLabel = (entry: any) => {
        const percentage =
            total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
        const numPercentage = parseFloat(percentage);
        return numPercentage > 5 ? `${percentage}%` : '';
    };

    const CustomizedLabel = ({ cx, cy }: any) => {
        if (centerLabel || centerValue !== undefined) {
            return (
                <text
                    x={cx}
                    y={cy}
                    fill={isDark ? '#ffffff' : '#111827'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {centerLabel && (
                        <tspan
                            x={cx}
                            dy="-0.5em"
                            className="text-sm font-medium"
                            fill={isDark ? '#9ca3af' : '#6b7280'}
                        >
                            {centerLabel}
                        </tspan>
                    )}
                    {centerValue !== undefined && (
                        <tspan x={cx} dy="1.2em" className="text-lg font-bold">
                            {typeof centerValue === 'number'
                                ? formatCurrency(centerValue)
                                : centerValue}
                        </tspan>
                    )}
                </text>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="flex h-64 items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        No data available
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`p-6 ${className}`}>
            {/* Title */}
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
                {showYearSelector && availableYears.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Year:
                        </span>
                        <select
                            value={selectedYear?.toString() || ''}
                            onChange={(e) =>
                                onYearChange?.(parseInt(e.target.value))
                            }
                            className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year.toString()}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="relative">
                <ResponsiveContainer width="100%" height={height}>
                    <PieChart>
                        <Pie
                            data={processedData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={outerRadius}
                            innerRadius={innerRadius}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {processedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>

                        {showTooltip && <Tooltip content={<CustomTooltip />} />}

                        {showLegend && (
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry: any) => (
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {value}
                                    </span>
                                )}
                            />
                        )}

                        <CustomizedLabel />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Statistics */}
            <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(total)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Items
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {data.length}
                    </p>
                </div>
            </div>
        </Card>
    );
}
