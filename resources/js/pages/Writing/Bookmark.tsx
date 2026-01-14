import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { router, usePage } from '@inertiajs/react';
import {
    Bookmark as BookmarkIcon,
    ChevronDown,
    ChevronUp,
    Edit3,
    MoreVertical,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Document {
    id: number;
    title: string;
    content: string;
    category: string;
    status: 'draft' | 'for review' | 'approved' | 'rejected' | 'posted';
    created_at: string;
    updated_at: string;
    author: {
        id: number;
        name: string;
        email: string;
    };
    is_bookmarked?: boolean;
}

interface PageProps {
    documents?: {
        data: Document[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search?: string;
    perPage?: number;
    auth?: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    [key: string]: unknown;
}

export default function Bookmark() {
    const { props } = usePage<PageProps>();
    const { documents, search = '', perPage: perPageProp = 10 } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(
        documents?.current_page || 1,
    );
    const [sortField, setSortField] = useState<string>('updated_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Filter documents to show only those bookmarked by current user
    const userBookmarks = useMemo(() => {
        if (!documents?.data) return [];
        return documents.data.filter(
            (document: Document) => document.is_bookmarked,
        );
    }, [documents]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/writing',
            {
                tab: 'bookmark',
                search: searchValue,
                perPage,
                page,
            },
            { preserveState: true, replace: true },
        );
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        router.get(
            '/writing',
            {
                tab: 'bookmark',
                search: searchValue,
                perPage: newPerPage,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Handle sorting
    const handleSort = (field: string) => {
        const newDirection =
            sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        setCurrentPage(1);

        router.get(
            '/writing',
            {
                tab: 'bookmark',
                search: searchValue,
                perPage,
                sort: field,
                direction: newDirection,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    // Sort the data client-side
    const sortedBookmarks = useMemo(() => {
        if (!userBookmarks) return [];

        return [...userBookmarks].sort((a, b) => {
            let aValue = a[sortField as keyof Document];
            let bValue = b[sortField as keyof Document];

            // Handle dates
            if (sortField.includes('_at')) {
                aValue = aValue ? new Date(aValue as string).getTime() : 0;
                bValue = bValue ? new Date(bValue as string).getTime() : 0;
            }

            // Handle nested author.name
            if (sortField === 'author.name') {
                aValue = a.author.name;
                bValue = b.author.name;
            }

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // Handle number comparison
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            return 0;
        });
    }, [userBookmarks, sortField, sortDirection]);

    // Sort indicator component
    const SortIndicator = ({ field }: { field: string }) => {
        if (sortField !== field)
            return (
                <ChevronUp className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-50" />
            );
        return sortDirection === 'asc' ? (
            <ChevronUp className="ml-1 h-3 w-3" />
        ) : (
            <ChevronDown className="ml-1 h-3 w-3" />
        );
    };

    const handleEdit = (document: Document) => {
        router.get(`/editdocument/${document.id}`, { tab: 'bookmark' });
    };

    const handleRemoveBookmark = (id: number) => {
        if (confirm('Are you sure you want to remove this bookmark?')) {
            router.post(
                `/documents/${id}/bookmark`,
                {},
                {
                    onSuccess: () => {
                        router.reload();
                    },
                },
            );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            case 'for review':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'posted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="space-y-6 px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <BookmarkIcon className="h-8 w-8 text-[#163832] dark:text-[#235347]" />
                        My Bookmarks
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        View and manage all your bookmarked write-ups
                    </p>
                </div>
            </div>

            {/* Header Controls */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="entries"
                                className="text-sm font-medium"
                            >
                                Show
                            </label>
                            <Select
                                value={perPage.toString()}
                                onValueChange={(value) => {
                                    const newPerPage = parseInt(value, 10);
                                    handlePerPageChange(newPerPage);
                                }}
                            >
                                <SelectTrigger className="w-[80px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>entries</span>
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-2 md:w-auto">
                        <SearchBar
                            search={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Search bookmarks..."
                            className="w-full md:max-w-md"
                            searchRoute="/writing"
                            additionalParams={{ tab: 'bookmark', perPage }}
                        />
                    </div>
                </div>
            </div>

            {/* Bookmarks Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="px-6 py-4">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                        Bookmarked Write-ups
                        <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                            {userBookmarks.length}
                        </span>
                    </h2>

                    {userBookmarks.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('title')}
                                    >
                                        <div className="flex items-center">
                                            Title
                                            <SortIndicator field="title" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center">
                                            Category
                                            <SortIndicator field="category" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status
                                            <SortIndicator field="status" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('updated_at')}
                                    >
                                        <div className="flex items-center">
                                            Updated
                                            <SortIndicator field="updated_at" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedBookmarks.map((document: Document) => (
                                    <TableRow
                                        key={document.id}
                                        className="hover:bg-gray-50 dark:hover:bg-neutral-800"
                                    >
                                        <TableCell>
                                            <div className="flex items-center">
                                                <BookmarkIcon className="mr-3 h-5 w-5 text-[#163832] dark:text-[#235347]" />
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {document.title}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {document.category === 'posting'
                                                    ? 'Posting'
                                                    : 'Travel Report'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                className={`inline-flex cursor-pointer items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${getStatusColor(document.status)}`}
                                            >
                                                {document.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    document.status.slice(1)}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(document.updated_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <span className="sr-only">
                                                                Open menu
                                                            </span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-40"
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleEdit(
                                                                    document,
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit3 className="mr-2 h-4 w-4" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleRemoveBookmark(
                                                                    document.id,
                                                                )
                                                            }
                                                            className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Remove</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-12 text-center">
                            <BookmarkIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                                No bookmarks found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                You haven't bookmarked any write-ups yet. Start
                                by bookmarking your favorite write-ups!
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {userBookmarks.length > 0 && (
                        <div className="mt-4">
                            <CustomPagination
                                currentPage={currentPage}
                                totalItems={documents?.total || 0}
                                perPage={perPage}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
