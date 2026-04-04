import CustomPagination from '@/components/CustomPagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import SearchBar from '@/components/SearchBar';
import SimpleStatistic from '@/components/SimpleStatistic';
import ToggleButton from '@/components/ToggleButton';
import { usePopupAlert } from '@/components/ui/popup-alert';
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
    CheckCircle2,
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
    email_verified_at?: string | null;
    role: 'user' | 'admin' | 'superadmin' | 'DO' | 'ADO RDPSS' | 'ADO RS' | 'PMO' | 'BIOTECH' | 'NSIC' | 'ADMINISTRATIVE' | 'CPMD' | 'CRPSD' | 'AED' | 'PPSSD' | 'NPQSD' | 'NSQCS' | 'Baguio BPI center' | 'Davao BPI center' | 'Guimaras BPI center' | 'La Granja BPI center' | 'Los Baños BPI center' | 'Others';
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
    landbank_number?: string;
    gsis_number?: string;
    address?: string;
    date_of_birth?: string;
    hiring_date?: string;
    item_number?: string;
    gender?: string;
    mobile_number?: string;
    contact_number?: string;
    contact_person?: string;
    can_access_noticeboard?: boolean;
    can_access_writing_suite?: boolean;
    can_access_management?: boolean;
    can_access_inventory?: boolean;
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
    const { showSuccess, showError, showDeleted, showInfo } = usePopupAlert();
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

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
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        
        setShowDeleteConfirm(false);
        router.delete(`/superadmin/users/${deleteId}`, {
            preserveScroll: true,
            onSuccess: () => {
                showDeleted(
                    'User Deleted',
                    'User account has been successfully removed.',
                );
            },
            onError: (errors) => {
                showError(
                    'Delete Failed',
                    'Unable to delete user. Please try again.',
                );
            },
        });
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
                    const statusText =
                        status === 'active' ? 'activated' : 'deactivated';
                    showSuccess(
                        `User ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
                        `User account has been ${statusText}.`,
                    );
                    router.reload({ only: ['users'] });
                },
                onError: (errors) => {
                    showError(
                        'Status Update Failed',
                        'Unable to update user status. Please try again.',
                    );
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

    // Status filter toggle is controlled and synchronized with server via statusFilter

    return (
        <>
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
                <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4 md:gap-4">
                    {/* Total Users Card */}
                    <SimpleStatistic
                        label="Total Users"
                        value={analytics.total}
                        icon={Users}
                        backgroundColor="#163832"
                    />

                    {/* Active Users Card */}
                    <SimpleStatistic
                        label="Active Users"
                        value={analytics.active}
                        icon={UserCheck}
                        backgroundColor="#1a4d3e"
                    />

                    {/* New Users This Month Card */}
                    <SimpleStatistic
                        label="New Users"
                        value={analytics.newThisMonth}
                        icon={UserPlus}
                        subtitle="This month"
                        backgroundColor="#235347"
                    />

                    {/* Online Users Card */}
                    <SimpleStatistic
                        label="Online Users"
                        value={analytics.online}
                        icon={Activity}
                        backgroundColor="#2a6358"
                        additionalContent={
                            <p className="flex hidden items-center gap-1 text-xs text-green-600 md:flex dark:text-green-400">
                                <Activity className="h-3 w-3" />
                                Last 15 minutes
                            </p>
                        }
                    />
                </div>
                <div className="flex items-center justify-between">
                    <ToggleButton
                        options={[
                            { value: 'active', label: 'Active Users' },
                            { value: 'inactive', label: 'Inactive Users' },
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
                <div className="overborder-sidebar-border/70 relative min-h-[100vh] flex-1 overflow-x-auto rounded-xl border-t-4 border-r border-b border-l border-gray-200 border-t-[#163832] bg-white p-4 shadow-sm md:min-h-min dark:border-neutral-600 dark:border-neutral-800 dark:border-t-[#235347] dark:bg-neutral-900">
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
                                    <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100">
                                        <SelectValue placeholder="Entries" />
                                    </SelectTrigger>
                                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                        <SelectItem
                                            value="10"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            10 entries
                                        </SelectItem>
                                        <SelectItem
                                            value="25"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            25 entries
                                        </SelectItem>
                                        <SelectItem
                                            value="50"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            50 entries
                                        </SelectItem>
                                        <SelectItem
                                            value="100"
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            100 entries
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
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

                                    {/* Sort By Field */}
                                    <div className="flex-1">
                                        <label
                                            htmlFor="mobileSortField"
                                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Sort By
                                        </label>
                                        <select
                                            id="mobileSortField"
                                            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                            value={sortField}
                                            onChange={(e) =>
                                                handleSort(e.target.value)
                                            }
                                        >
                                            <option value="name">Name</option>
                                            <option value="email">Email</option>
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
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Order
                                        </label>
                                        <div className="flex">
                                            <button
                                                type="button"
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
                                                className={`flex-1 rounded-l-lg border border-r-0 px-3 py-2 text-sm font-medium transition-colors ${
                                                    sortDirection === 'asc'
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
                                            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400">
                                                {user.email}
                                                {user.email_verified_at && (
                                                    <span title="Email Verified">
                                                        <CheckCircle2
                                                            size={14}
                                                            className="text-green-600 dark:text-green-400"
                                                        />
                                                    </span>
                                                )}
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
                                            <SortIndicator field="name" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center">
                                            Email
                                            <SortIndicator field="email" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('role')}
                                    >
                                        <div className="flex items-center">
                                            Role
                                            <SortIndicator field="role" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center">
                                            Date Registered
                                            <SortIndicator field="created_at" />
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
                                            <SortIndicator field="last_login_at" />
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
                                                <div className="flex items-center gap-2">
                                                    {user.email}
                                                    {user.email_verified_at && (
                                                        <span title="Email Verified">
                                                            <CheckCircle2
                                                                size={16}
                                                                className="text-green-600 dark:text-green-400"
                                                            />
                                                        </span>
                                                    )}
                                                </div>
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title="Delete User"
            message="Are you sure you want to delete this user? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={confirmDelete}
            variant="destructive"
        />
    </>
    );
}
