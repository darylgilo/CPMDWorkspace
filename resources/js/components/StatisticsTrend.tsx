import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface TrendData {
    label: string;
    value: number;
    previousValue: number;
    trend: 'up' | 'down' | 'stable';
    unit?: string;
}

interface StatisticsTrendProps {
    title: string;
    data: TrendData[];
    className?: string;
}

export default function StatisticsTrend({
    title,
    data,
    className = '',
}: StatisticsTrendProps) {
    const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            case 'stable':
                return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400';
            case 'down':
                return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400';
            case 'stable':
                return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400';
        }
    };

    return (
        <Card className={`p-4 ${className}`}>
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                {title}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((item, index) => {
                    const percentageChange = calculatePercentageChange(
                        item.value,
                        item.previousValue
                    );
                    
                    return (
                        <div
                            key={index}
                            className="rounded-lg border border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {item.label}
                                </span>
                                {getTrendIcon(item.trend)}
                            </div>
                            <div className="mt-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {item.value.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.unit || ''}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${getTrendColor(item.trend)}`}
                                    >
                                        {percentageChange > 0 ? '+' : ''}
                                        {percentageChange.toFixed(1)}%
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        vs previous period
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
