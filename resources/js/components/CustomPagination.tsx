import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

interface CustomPaginationProps {
    currentPage: number;
    totalItems: number;
    perPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function CustomPagination({
    currentPage,
    totalItems,
    perPage,
    onPageChange,
    className = '',
}: CustomPaginationProps) {
    const totalPages = Math.ceil(totalItems / perPage);

    // Debug info
    console.log('CustomPagination:', {
        currentPage,
        totalItems,
        perPage,
        totalPages,
        showPagination: totalPages > 1,
    });

    // Always show pagination, even if only one page (for debugging)
    // if (totalPages <= 1) return null;

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is less than or equal to max visible pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate start and end of the middle section
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if we're near the start or end
            if (currentPage <= 3) {
                endPage = 4;
            } else if (currentPage >= totalPages - 2) {
                startPage = totalPages - 3;
            }

            // Add ellipsis after first page if needed
            if (startPage > 2) {
                pages.push('...');
            }

            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Add ellipsis before last page if needed
            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-4 ${className}`}
        >
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {Math.max(1, totalPages)} ({totalItems}{' '}
                total)
            </div>
            <div className="flex items-center gap-1">
                {/* First Page Button */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="rounded border border-[#163832] bg-[#163832] p-2 text-white transition-colors hover:bg-[#163832]/90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#235347] dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                    aria-label="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous Page Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded border border-[#163832] bg-[#163832] p-2 text-white transition-colors hover:bg-[#163832]/90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#235347] dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() =>
                            typeof page === 'number' && onPageChange(page)
                        }
                        disabled={page === '...'}
                        className={`rounded border px-3 py-1 transition-colors ${
                            currentPage === page
                                ? 'border-[#163832] bg-[#163832] text-white hover:bg-[#163832]/90 dark:border-[#235347] dark:bg-[#235347] dark:hover:bg-[#235347]/90'
                                : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700'
                        } ${page === '...' ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        {page}
                    </button>
                ))}

                {/* Next Page Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="rounded border border-[#163832] bg-[#163832] p-2 text-white transition-colors hover:bg-[#163832]/90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#235347] dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page Button */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="rounded border border-[#163832] bg-[#163832] p-2 text-white transition-colors hover:bg-[#163832]/90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#235347] dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                    aria-label="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
