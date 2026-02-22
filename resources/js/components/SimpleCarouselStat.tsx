import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';

export interface CarouselItem {
    /**
     * Unique identifier for the carousel item
     */
    id: string | number;

    /**
     * The label/title displayed at the top
     */
    label: string;

    /**
     * The main value to display
     */
    value: string | number;

    /**
     * Optional additional content (e.g., warning messages, badges)
     */
    additionalContent?: ReactNode;
}

interface SimpleCarouselStatProps {
    /**
     * Array of items to display in the carousel
     */
    items: CarouselItem[];

    /**
     * Optional icon component from lucide-react
     */
    icon?: LucideIcon;

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
     * Optional custom className for the container
     */
    className?: string;

    /**
     * Optional initial index to display (defaults to 0)
     */
    initialIndex?: number;

    /**
     * Optional callback when the current item changes
     */
    onItemChange?: (index: number, item: CarouselItem) => void;

    /**
     * Whether to show carousel controls when there's only one item (defaults to false)
     */
    showControlsForSingleItem?: boolean;
}

/**
 * SimpleCarouselStat - A reusable carousel statistic card component
 *
 * This component displays statistics in a carousel format with navigation controls.
 * Users can navigate through multiple items using previous/next buttons or indicator dots.
 *
 * @example
 * ```tsx
 * <SimpleCarouselStat
 *   items={[
 *     { id: 1, label: "Herbicide", value: "Stock: 153.00", additionalContent: <p>Low stock</p> },
 *     { id: 2, label: "Insecticide", value: "Stock: 250.00" },
 *     { id: 3, label: "Fungicide", value: "Stock: 180.00" }
 *   ]}
 *   icon={Package}
 * />
 * ```
 */
export default function SimpleCarouselStat({
    items,
    icon: Icon,
    backgroundColor = '#163832',
    iconBackgroundColor = 'bg-green-100 dark:bg-green-900/20',
    iconColor = 'text-green-600 dark:text-[#DAF1DE]',
    className = '',
    initialIndex = 0,
    onItemChange,
    showControlsForSingleItem = false,
}: SimpleCarouselStatProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Return null if no items
    if (!items || items.length === 0) {
        return null;
    }

    const currentItem = items[currentIndex];
    const showControls = items.length > 1 || showControlsForSingleItem;

    const handlePrev = () => {
        const newIndex =
            currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
        onItemChange?.(newIndex, items[newIndex]);
    };

    const handleNext = () => {
        const newIndex =
            currentIndex === items.length - 1 ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
        onItemChange?.(newIndex, items[newIndex]);
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
        onItemChange?.(index, items[index]);
    };

    return (
        <div
            className={`relative rounded-lg border border-gray-200 p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800 ${className}`}
            style={{ backgroundColor }}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-white/80 md:text-sm">
                        {currentItem.label}
                    </p>
                    <p className="text-xl font-bold text-white">
                        {currentItem.value}
                    </p>
                    {currentItem.additionalContent}
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

            {/* Carousel Controls */}
            {showControls && (
                <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                    <button
                        onClick={handlePrev}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                        aria-label="Previous item"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex gap-1">
                        {items.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => handleDotClick(index)}
                                className={`h-1.5 w-1.5 rounded-full transition-all ${
                                    index === currentIndex
                                        ? 'w-4 bg-white'
                                        : 'bg-white/40 hover:bg-white/60'
                                }`}
                                aria-label={`Go to item ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                        aria-label="Next item"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
