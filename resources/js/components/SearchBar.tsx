import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  searchRoute?: string;
  additionalParams?: Record<string, any>;
}

export default function SearchBar({
  search,
  onSearchChange,
  placeholder = 'Search...',
  className = '',
  searchRoute = '',
  additionalParams = {},
}: SearchBarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Sync local state with prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search
  useEffect(() => {
    if (searchRoute) {
      const timer = setTimeout(() => {
        if (localSearch !== search) {
          router.get(
            searchRoute,
            { ...additionalParams, search: localSearch },
            { preserveState: true, replace: true }
          );
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localSearch, searchRoute, additionalParams]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchRoute) {
      router.get(
        searchRoute,
        { ...additionalParams, search: localSearch },
        { preserveState: true, replace: true }
      );
    }
  };

  const handleSearchClick = () => {
    if (searchRoute) {
      router.get(
        searchRoute,
        { ...additionalParams, search: localSearch },
        { preserveState: true, replace: true }
      );
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={localSearch}
        onChange={(e) => {
          const value = e.target.value;
          setLocalSearch(value);
          onSearchChange(value);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
      />
      <button
        type="button"
        onClick={handleSearchClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
    </div>
  );
}
