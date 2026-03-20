import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface StatusOption {
    value: string;
    label: string;
    icon?: React.ComponentType<any>;
}

interface StatusDropdownProps {
    value: string;
    options: StatusOption[];
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    'resolved': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
};

export default function StatusDropdown({ value, options, onChange, className = '', disabled = false }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    const selectedOption = options.find(option => option.value === value);

    const handleButtonClick = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleButtonClick}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border-0 ${statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
            >
                <span className="flex items-center gap-1">
                    {selectedOption?.icon && <selectedOption.icon className="h-3 w-3" />}
                    {selectedOption?.label || value}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-1 z-50 w-48 rounded-lg bg-white shadow-lg border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
                >
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${
                                    option.value === value ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200'
                                }`}
                            >
                                {option.icon && <option.icon className="h-4 w-4" />}
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
