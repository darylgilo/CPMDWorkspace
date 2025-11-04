import React from 'react';

interface ToggleButtonProps {
    options: {
        value: string;
        label: string;
    }[];
    activeValue: string;
    onChange: (value: string) => void;
    className?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
    options,
    activeValue,
    onChange,
    className = '',
}) => {
    return (
        <div
            className={`inline-flex items-center rounded-lg border border-gray-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-800 ${className}`}
        >
            {options.map((option, index) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeValue === option.value
                            ? 'rounded-md bg-[#163832] text-white shadow-sm dark:bg-[#235347]'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700'
                    } ${index === 0 ? 'rounded-l-md' : ''} ${
                        index === options.length - 1 ? 'rounded-r-md' : ''
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default ToggleButton;
