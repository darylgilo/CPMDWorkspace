import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
import ToggleButton from '@/components/ToggleButton';
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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ChevronDown,
    ChevronUp,
    Edit3,
    Power,
    PowerOff,
    Trash2,
    UserCheck,
    UserPlus,
    UserRoundPlus,
    Users,
    UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Define the User interface
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'superadmin';
    status: 'active' | 'inactive';
    created_at?: string;
    last_login_at?: string | null;
    profile_photo_url?: string;
    profile_picture?: string;
    employee_id?: string;
    position?: string;
    employment_status?: string;
    office?: string;
    cpmd?: string;
    tin_number?: string;
    gsis_number?: string;
    address?: string;
    date_of_birth?: string;
    hiring_date?: string;
    item_number?: string;
    gender?: string;
    mobile_number?: string;
    contact_number?: string;
    contact_person?: string;
    [key: string]: unknown; // For any additional properties
}

// Breadcrumb navigation items for the user management page
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: '/usermanagement',
    },
];

interface AnalyticsData {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    online: number;
    [key: string]: number; // Index signature for dynamic properties
}

interface PageProps extends InertiaPageProps {
    users?: {
        data: User[];
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        from?: number;
        to?: number;
        [key: string]: unknown;
    };
    search?: string;
    perPage?: number | string;
    status?: 'active' | 'inactive';
    analytics?: {
        totalUsers?: number;
        activeUsers?: number;
        newUsersThisMonth?: number;
        onlineUsers?: number;
        [key: string]: unknown;
    };
    flash?: {
        success?: string;
        error?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export default function UserManagement() {
    // Get users data and search term from page props
    const { props } = usePage<PageProps>();
    const {
        users = { data: [] },
        search = '',
        perPage: perPageProp = 10,
        status: statusProp = 'active',
        analytics: analyticsProp,
    } = props;

    // Debug logging (commented out in production)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Page props:', props);
            console.log('Flash messages:', props.flash);
        }
    }, [props]);

    // State for search, filter, and pagination
    const [searchValue, setSearchValue] = useState(search || '');
    const [perPage, setPerPage] = useState<number>(Number(perPageProp) || 10);
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'inactive'
    >(statusProp === 'inactive' ? 'inactive' : 'active');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<keyof User>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Analytics calculation
    const analytics = useMemo<AnalyticsData>(() => {
        if (analyticsProp) {
            return {
                total: analyticsProp.totalUsers || 0,
                active: analyticsProp.activeUsers || 0,
                inactive:
                    (analyticsProp.totalUsers || 0) -
                    (analyticsProp.activeUsers || 0),
                newThisMonth: analyticsProp.newUsersThisMonth || 0,
                online: analyticsProp.onlineUsers || 0,
            };
        }

        const userData = users?.data || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        return {
            total: userData.length,
            active: userData.filter((user) => user.status === 'active').length,
            inactive: userData.filter((user) => user.status === 'inactive')
                .length,
            newThisMonth: userData.filter((user) => {
                if (!user.created_at) return false;
                const created = new Date(user.created_at);
                return (
                    created.getMonth() === currentMonth &&
                    created.getFullYear() === currentYear
                );
            }).length,
            online: userData.filter((user) => {
                if (!user.last_login_at) return false;
                return new Date(user.last_login_at) > fifteenMinutesAgo;
            }).length,
        };
    }, [users?.data, analyticsProp]);

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        let results = users?.data || [];

        // Apply search filter
        if (searchValue) {
            const query = searchValue.toLowerCase();
            results = results.filter(
                (user) =>
                    user.name?.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query) ||
                    user.role?.toLowerCase().includes(query),
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            results = results.filter((user) => user.status === statusFilter);
        }

        // Apply sorting
        return [...results].sort((a, b) => {
            let aValue = a[sortField] || '';
            let bValue = b[sortField] || '';

            // Handle potential null/undefined values
            if (aValue === null) aValue = '';
            if (bValue === null) bValue = '';

            // Convert to string for case-insensitive comparison
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [users?.data, searchValue, statusFilter, sortField, sortDirection]);

    // Calculate pagination
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return filteredUsers.slice(startIndex, startIndex + perPage);
    }, [filteredUsers, currentPage, perPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, statusFilter, sortField, sortDirection, perPage]);

    // Handle user deletion with confirmation
    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            router.delete(`/superadmin/users/${id}`, { preserveScroll: true });
        }
    };

    // Handle search input change (client-side only)
    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };

    // Handle user status change (activate/deactivate)
    const handleStatusChange = (userId: number, status: string) => {
        router.patch(
            `/superadmin/users/${userId}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['users'] });
                },
            },
        );
    };

    // Handle sorting
    const handleSort = (field: string) => {
        console.log(
            'Sorting by:',
            field,
            'Current sort:',
            sortField,
            'Current direction:',
            sortDirection,
        );

        if (sortField === field) {
            // Toggle direction if same field
            const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortDirection(newDirection);
            console.log('Toggling direction to:', newDirection);
            router.get(
                '/superadmin/usermanagement',
                {
                    search: searchValue,
                    perPage,
                    status: statusFilter,
                    sort: field,
                    direction: newDirection,
                },
                { preserveState: true, replace: true },
            );
        } else {
            // Set new field with ascending direction
            setSortField(field);
            setSortDirection('asc');
            console.log('Setting new field:', field, 'with direction: asc');
            router.get(
                '/superadmin/usermanagement',
                {
                    search: searchValue,
                    perPage,
                    status: statusFilter,
                    sort: field,
                    direction: 'asc',
                },
                { preserveState: true, replace: true },
            );
        }
    };

    // Sort icon component
    const SortIcon = ({ field }: { field: string }) => {
        console.log('SortIcon render:', { field, sortField, sortDirection });

        if (sortField !== field) {
            return (
                <div className="ml-1 inline-flex flex-col text-gray-400">
                    <ChevronUp size={12} />
                    <ChevronDown size={12} />
                </div>
            );
        }

        return (
            <div className="ml-1 inline-flex flex-col text-gray-600 dark:text-gray-300">
                {sortDirection === 'asc' ? (
                    <ChevronUp
                        size={12}
                        className="text-gray-600 dark:text-gray-300"
                    />
                ) : (
                    <ChevronDown
                        size={12}
                        className="text-gray-600 dark:text-gray-300"
                    />
                )}
            </div>
        );
    };

    // Status filter toggle is controlled and synchronized with server via statusFilter

    return (
        <AppLayout
            breadcrumbs={breadcrumbs.map((crumb) => ({
                title: crumb.title,
                href: crumb.href,
            }))}
        >
            <Head title="User Management" />
            <div className="flex flex-col gap-4 p-4">
                {/* Page Header */}

                {/* Analytics Dashboard */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    {/* Total Users Card */}
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800 dark:bg-[#163832] dark:text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm dark:text-gray-400">
                                    Total Users
                                </p>
                                <p className="text-xl font-bold text-white md:text-3xl dark:text-white">
                                    {analytics.total}
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center self-start rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                <Users className="h-4 w-4 text-green-600 md:h-6 md:w-6 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>

                    {/* Active Users Card */}
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800 dark:bg-[#163832] dark:text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm dark:text-gray-400">
                                    Active Users
                                </p>
                                <p className="text-xl font-bold text-white md:text-3xl dark:text-white">
                                    {analytics.active}
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center self-start rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                <UserCheck className="h-4 w-4 text-green-600 md:h-6 md:w-6 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>

                    {/* New Users This Month Card */}
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800 dark:bg-[#163832] dark:text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm dark:text-gray-400">
                                    New Users
                                </p>
                                <p className="text-xl font-bold text-white md:text-3xl dark:text-white">
                                    {analytics.newThisMonth}
                                </p>
                                <p className="hidden text-xs text-white/70 md:block dark:text-gray-400">
                                    This month
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center self-start rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                <UserPlus className="h-4 w-4 text-green-600 md:h-6 md:w-6 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>

                    {/* Online Users Card */}
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800 dark:bg-[#163832] dark:text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm dark:text-gray-400">
                                    Online Users
                                </p>
                                <p className="text-xl font-bold text-white md:text-3xl dark:text-white">
                                    {analytics.online}
                                </p>
                                <p className="flex hidden items-center gap-1 text-xs text-green-600 md:flex dark:text-green-400">
                                    <Activity className="h-3 w-3" />
                                    Last 15 minutes
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center self-start rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 md:h-3 md:w-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <ToggleButton
                        options={[
                            { value: 'active', label: 'Active Users' },
                            { value: 'inactive', label: 'New Users' },
                        ]}
                        activeValue={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value as 'active' | 'inactive');
                            router.get(
                                '/superadmin/usermanagement',
                                {
                                    search: searchValue,
                                    perPage,
                                    status: value,
                                    sort: sortField,
                                    direction: sortDirection,
                                },
                                { preserveState: true, replace: true },
                            );
                        }}
                        className="mb-1 rounded-lg shadow-sm md:rounded-xl md:p-1"
                    />
                </div>
                {/* Users Table */}
                <div
                    className="overborder-sidebar-border/70 relative min-h-[100vh] flex-1 overflow-x-auto rounded-xl border-t-4 border-r border-b border-l border-gray-200 border-t-[#163832] bg-white p-4 md:min-h-min dark:border-neutral-600 dark:border-neutral-800 dark:border-t-[#235347] dark:bg-neutral-900 shadow-sm"
                >
                    {/* DataTables-style Controls */}
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Left: Show entries and Add User button */}
                        <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-start">
                            {/* Add User Button */}
                            <button
                                title="Add User"
                                onClick={() => {
                                    router.get(
                                        '/superadmin/usermanagement/create',
                                        {},
                                        {
                                            preserveState: false,
                                            replace: false,
                                        },
                                    );
                                }}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 md:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            >
                                <UserRoundPlus className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Add User
                                </span>
                            </button>

                            {/* Show entries */}
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="entries"
                                    className="font-medium"
                                >
                                    Show
                                </label>
                                <Select
                                    value={perPage.toString()}
                                    onValueChange={(value) => {
                                        const newPerPage =
                                            parseInt(value, 10) || 10;
                                        setPerPage(newPerPage);
                                        router.get(
                                            '/superadmin/usermanagement',
                                            {
                                                search: searchValue,
                                                perPage: newPerPage,
                                                status: statusFilter,
                                                sort: sortField,
                                                direction: sortDirection,
                                            },
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                        <SelectValue placeholder="10" />
                                    </SelectTrigger>
                                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                        <SelectItem
                                            value="10"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            10
                                        </SelectItem>
                                        <SelectItem
                                            value="25"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            25
                                        </SelectItem>
                                        <SelectItem
                                            value="50"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            50
                                        </SelectItem>
                                        <SelectItem
                                            value="100"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            100
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <span>entries</span>
                            </div>
                        </div>

                        {/* Right: Search */}
                        <div className="flex w-full items-center gap-2 md:w-auto">
                            <SearchBar
                                search={searchValue}
                                onSearchChange={handleSearchChange}
                                placeholder="Search by name"
                                className="w-full md:max-w-md"
                                searchRoute="/superadmin/usermanagement"
                                additionalParams={{
                                    perPage,
                                    status: statusFilter,
                                    sort: sortField,
                                    direction: sortDirection,
                                }}
                            />
                        </div>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="block space-y-3 md:hidden">
                        {/* Mobile Sorting Controls */}
                        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-800">
                            <div className="flex flex-col space-y-3">
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    {/* Sort Field Selector */}
                                    <div className="flex-1">
                                        <label
                                            htmlFor="mobileSortField"
                                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Sort by
                                        </label>
                                        <select
                                            id="mobileSortField"
                                            value={sortField}
                                            onChange={(e) => {
                                                const newField = e.target.value;
                                                setSortField(newField);
                                                router.get(
                                                    '/superadmin/usermanagement',
                                                    {
                                                        search: searchValue,
                                                        perPage,
                                                        status: statusFilter,
                                                        sort: newField,
                                                        direction:
                                                            sortDirection,
                                                    },
                                                    {
                                                        preserveState: true,
                                                        replace: true,
                                                    },
                                                );
                                            }}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                                        >
                                            <option value="name">Name</option>
                                            <option value="role">Role</option>
                                            <option value="created_at">
                                                Date Registered
                                            </option>
                                            <option value="last_login_at">
                                                Last Login
                                            </option>
                                        </select>
                                    </div>

                                    {/* Sort Direction Toggle */}
                                    <div className="flex-1">
                                        <label
                                            htmlFor="mobileSortDirection"
                                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Order
                                        </label>
                                        <div className="flex">
                                            <button
                                                onClick={() => {
                                                    const newDirection = 'asc';
                                                    setSortDirection(
                                                        newDirection,
                                                    );
                                                    router.get(
                                                        '/superadmin/usermanagement',
                                                        {
                                                            search: searchValue,
                                                            perPage,
                                                            status: statusFilter,
                                                            sort: sortField,
                                                            direction:
                                                                newDirection,
                                                        },
                                                        {
                                                            preserveState: true,
                                                            replace: true,
                                                        },
                                                    );
                                                }}
                                                className={`flex-1 rounded-l-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                    sortDirection === 'asc'
                                                        ? 'border-[#163832] bg-[#163832] text-white dark:border-[#235347] dark:bg-[#235347]'
                                                        : 'border-gray-300 bg-white text-gray-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <ChevronUp size={14} />
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newDirection = 'desc';
                                                    setSortDirection(
                                                        newDirection,
                                                    );
                                                    router.get(
                                                        '/superadmin/usermanagement',
                                                        {
                                                            search: searchValue,
                                                            perPage,
                                                            status: statusFilter,
                                                            sort: sortField,
                                                            direction:
                                                                newDirection,
                                                        },
                                                        {
                                                            preserveState: true,
                                                            replace: true,
                                                        },
                                                    );
                                                }}
                                                className={`flex-1 rounded-r-lg border border-l-0 px-3 py-2 text-sm font-medium transition-colors ${
                                                    sortDirection === 'desc'
                                                        ? 'border-[#163832] bg-[#163832] text-white dark:border-[#235347] dark:bg-[#235347]'
                                                        : 'border-gray-300 bg-white text-gray-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <ChevronDown size={14} />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Sort Indicator */}
                                <div className="flex items-center justify-center pt-2">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                                        <span>Sorted by:</span>
                                        <span className="font-medium capitalize">
                                            {sortField === 'created_at'
                                                ? 'Date Registered'
                                                : sortField === 'last_login_at'
                                                  ? 'Last Login'
                                                  : sortField}
                                        </span>
                                        <span className="text-green-600 dark:text-green-400">
                                            {`(${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})`}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {searchValue ? (
                                        <span>
                                            Found{' '}
                                            <span className="font-medium">
                                                {filteredUsers.length}
                                            </span>{' '}
                                            {filteredUsers.length === 1
                                                ? 'user'
                                                : 'users'}
                                            {searchValue
                                                ? ' matching your search'
                                                : ''}
                                        </span>
                                    ) : (
                                        <span>
                                            Showing{' '}
                                            <span className="font-medium">
                                                {users.from !== undefined
                                                    ? users.from
                                                    : 0}
                                            </span>{' '}
                                            to{' '}
                                            <span className="font-medium">
                                                {users.to !== undefined
                                                    ? users.to
                                                    : 0}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">
                                                {users.total !== undefined
                                                    ? users.total
                                                    : 0}
                                            </span>{' '}
                                            users
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {Array.isArray(paginatedUsers) &&
                        paginatedUsers.length > 0 ? (
                            paginatedUsers.map((user: User) => (
                                <div
                                    key={user.id}
                                    className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {user.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-neutral-400">
                                                {user.email}
                                            </p>
                                        </div>
                                        <span
                                            className={`flex items-center justify-center rounded-full px-2 py-1 text-white ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}
                                        >
                                            {user.status === 'active' ? (
                                                <UserCheck size={16} />
                                            ) : (
                                                <UserX size={16} />
                                            )}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-neutral-400">
                                                Role:
                                            </span>
                                            <span className="ml-2 text-gray-900 capitalize dark:text-white">
                                                {user.role}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-neutral-400">
                                                Status:
                                            </span>
                                            <span
                                                className={`ml-2 ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}
                                            >
                                                {user.status === 'active'
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-neutral-400">
                                        <div>
                                            Registered:{' '}
                                            {user.created_at
                                                ? new Date(
                                                      user.created_at,
                                                  ).toLocaleString()
                                                : 'N/A'}
                                        </div>
                                        <div>
                                            Last Login:{' '}
                                            {user.last_login_at
                                                ? new Date(
                                                      user.last_login_at,
                                                  ).toLocaleString()
                                                : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            className="flex-1 rounded bg-red-500 p-2 text-white transition-colors hover:bg-red-700"
                                            onClick={() =>
                                                handleDelete(user.id)
                                            }
                                            title="Delete User"
                                        >
                                            <Trash2
                                                size={16}
                                                className="mx-auto"
                                            />
                                        </button>
                                        <button
                                            className={`flex-1 rounded p-2 text-white transition-colors ${user.status === 'active' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                                            onClick={() =>
                                                handleStatusChange(
                                                    user.id,
                                                    user.status === 'active'
                                                        ? 'inactive'
                                                        : 'active',
                                                )
                                            }
                                            title={
                                                user.status === 'active'
                                                    ? 'Deactivate User'
                                                    : 'Activate User'
                                            }
                                        >
                                            {user.status === 'active' ? (
                                                <PowerOff
                                                    size={16}
                                                    className="mx-auto"
                                                />
                                            ) : (
                                                <Power
                                                    size={16}
                                                    className="mx-auto"
                                                />
                                            )}
                                        </button>
                                        <button
                                            className="flex-1 rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
                                            title="Edit Profile"
                                            onClick={() =>
                                                router.get(
                                                    `/superadmin/usermanagement/${user.id}/edit`,
                                                )
                                            }
                                        >
                                            <Edit3
                                                size={16}
                                                className="mx-auto"
                                            />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-500 dark:text-neutral-400">
                                No users found.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden md:block">
                        <Table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                            <TableHeader>
                                <TableRow className="border-t border-b border-gray-200 dark:border-neutral-700">
                                    <TableHead
                                        className="cursor-pointer border-l px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Name
                                            <SortIcon field="name" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-left">
                                        Email
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('role')}
                                    >
                                        <div className="flex items-center">
                                            Role
                                            <SortIcon field="role" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center">
                                            Date Registered
                                            <SortIcon field="created_at" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() =>
                                            handleSort('last_login_at')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Last Login
                                            <SortIcon field="last_login_at" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-center">
                                        Status
                                    </TableHead>
                                    <TableHead className="border-r px-4 py-2 text-center">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Render user rows or show "No users found" message */}
                                {paginatedUsers && paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user: User) => (
                                        <TableRow
                                            key={user.id}
                                            className="cursor-default transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        >
                                            <TableCell className="border-b border-l px-4 py-2">
                                                {user.name}
                                            </TableCell>
                                            <TableCell className="border-b px-4 py-2">
                                                {user.email}
                                            </TableCell>
                                            <TableCell className="border-b px-4 py-2 text-left capitalize">
                                                {user.role}
                                            </TableCell>
                                            <TableCell className="border-b px-4 py-2 text-left">
                                                {user.created_at
                                                    ? new Date(
                                                          user.created_at,
                                                      ).toLocaleString()
                                                    : ''}
                                            </TableCell>
                                            <TableCell className="border-b px-4 py-2 text-left">
                                                {user.last_login_at
                                                    ? new Date(
                                                          user.last_login_at,
                                                      ).toLocaleString()
                                                    : ''}
                                            </TableCell>
                                            <TableCell className="border-b px-4 py-2 text-center">
                                                {/* Status indicator with color coding */}
                                                <span
                                                    className={`flex items-center justify-center rounded-full px-0 py-1 text-white ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}
                                                >
                                                    {user.status ===
                                                    'active' ? (
                                                        <UserCheck size={16} />
                                                    ) : (
                                                        <UserX size={16} />
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell className="border-r border-b px-4 py-2">
                                                <div className="flex justify-center gap-2">
                                                    {/* Action buttons for each user */}
                                                    <button
                                                        className="rounded bg-red-500 p-2 text-white transition-colors hover:bg-red-700"
                                                        onClick={() =>
                                                            handleDelete(
                                                                user.id,
                                                            )
                                                        }
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button
                                                        className={`rounded p-2 text-white transition-colors ${user.status === 'active' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                user.id,
                                                                user.status ===
                                                                    'active'
                                                                    ? 'inactive'
                                                                    : 'active',
                                                            )
                                                        }
                                                        title={
                                                            user.status ===
                                                            'active'
                                                                ? 'Deactivate User'
                                                                : 'Activate User'
                                                        }
                                                    >
                                                        {user.status ===
                                                        'active' ? (
                                                            <PowerOff
                                                                size={16}
                                                            />
                                                        ) : (
                                                            <Power size={16} />
                                                        )}
                                                    </button>
                                                    <button
                                                        className="rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
                                                        title="Edit Profile"
                                                        onClick={() =>
                                                            router.get(
                                                                `/superadmin/usermanagement/${user.id}/edit`,
                                                            )
                                                        }
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-4 text-center"
                                        >
                                            {searchValue
                                                ? 'No users match your search'
                                                : 'No users found'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Bottom Bar: active/inactive Toggle (left) + Pagination (right) */}
                    <div className="mt-4 flex w-full items-center justify-between">
                        {/* Pagination */}
                        <div className="mt-4 w-full overflow-x-auto">
                            <div className="min-w-max">
                                <CustomPagination
                                    currentPage={currentPage}
                                    totalItems={filteredUsers.length}
                                    perPage={perPage}
                                    onPageChange={(page) => {
                                        setCurrentPage(page);
                                        // Scroll to top of the table when changing pages
                                        window.scrollTo({
                                            top: 0,
                                            behavior: 'smooth',
                                        });
                                    }}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
