import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface SimpleStatisticProps {
    /**
     * The label/title displayed at the top of the statistic card
     */
    label: string;

    /**
     * The main value to display (can be a number or string)
     */
    value: string | number;

    /**
     * Optional icon component from lucide-react
     */
    icon?: LucideIcon;

    /**
     * Optional subtitle text displayed below the value
     */
    subtitle?: string;

    /**
     * Optional background color (defaults to #163832)
     */
    backgroundColor?: string;

    /**
     * Optional icon background color (defaults to green-100)
     */
    iconBackgroundColor?: string;

    /**
     * Optional icon color (defaults to green-600)
     */
    iconColor?: string;

    /**
     * Optional additional content to render (e.g., warning messages)
     */
    additionalContent?: ReactNode;

    /**
     * Optional custom className for the container
     */
    className?: string;
}

/**
 * SimpleStatistic - A reusable statistic card component
 *
 * This component displays a statistic with a label, value, optional icon, and subtitle.
 * It matches the design pattern used in the Pesticide Inventory page.
 *
 * @example
 * ```tsx
 * <SimpleStatistic
 *   label="Total Stock"
 *   value={1230.01}
 *   icon={PackageCheck}
 *   subtitle="Based on received date this year"
 * />
 * ```
 */
export default function SimpleStatistic({
    label,
    value,
    icon: Icon,
    subtitle,
    backgroundColor = '#163832',
    iconBackgroundColor = 'bg-green-100 dark:bg-green-900/20',
    iconColor = 'text-green-600 dark:text-[#DAF1DE]',
    additionalContent,
    className = '',
}: SimpleStatisticProps) {
    return (
        <div
            className={`rounded-lg border border-gray-200 p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800 ${className}`}
            style={{ backgroundColor }}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-white/80 md:text-sm">
                        {label}
                    </p>
                    <p className="text-xl font-bold text-white md:text-3xl">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="hidden text-sm font-medium text-white/90 md:block">
                            {subtitle}
                        </p>
                    )}
                    {additionalContent}
                </div>
                {Icon && (
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg md:h-12 md:w-12 ${iconBackgroundColor}`}
                    >
                        <Icon
                            className={`h-4 w-4 md:h-6 md:w-6 ${iconColor}`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
