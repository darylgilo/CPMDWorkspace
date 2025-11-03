import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

type AppearanceToggleTabProps = HTMLAttributes<HTMLDivElement> & {
    showLabels?: boolean;
};

export default function AppearanceToggleTab({
    className = '',
    showLabels = true,
    ...props
}: AppearanceToggleTabProps) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex items-center justify-center rounded-md transition-colors',
                        showLabels ? 'px-3.5 py-1.5' : 'h-8 w-8',
                        appearance === value
                            ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                            : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                    )}
                >
                    <Icon
                        className={cn('-ml-1 h-4 w-4', showLabels ? '' : 'm-0')}
                    />
                    {showLabels && (
                        <span className="ml-1.5 text-sm">{label}</span>
                    )}
                </button>
            ))}
        </div>
    );
}
