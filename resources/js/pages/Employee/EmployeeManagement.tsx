import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
// Custom card components removed as they're no longer used
import ExportEmployee from '@/components/export/ExportEmployee';
import SimpleStatistic from '@/components/SimpleStatistic';
import { usePopupAlert } from '@/components/ui/popup-alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    ChevronDown,
    ChevronUp,
    Clock,
    Edit,
    MoreVertical,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';

// Define types
interface User {
    id: number;
    name: string;
    email: string;
    position?: string | null;
    office?: string | null;
    cpmd?: string | null;
    employment_status?: string | null;
    employee_id?: string | null;
    landbank_number?: string | null;
    status?: 'active' | 'inactive' | null;
    profile_picture?: string | null;
    tin_number?: string | null;
    gsis_number?: string | null;
    mobile_number?: string | null;
    contact_number?: string | null;
    item_number?: string | null;
    address?: string | null;
    hiring_date?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    contact_person?: string | null;
    whereabouts_updated_at?: string | null;
    whereabouts_status?: string | null;
    [key: string]: unknown;
}

interface PaginatedUsers {
    data: User[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PageProps extends InertiaPageProps {
    users: PaginatedUsers;
    auth: {
        user?: {
            id: number;
            role?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    stats?: {
        total: number;
        regular: number;
        cos: number;
        jobOrder: number;
    };
}

// Status colors matching Whereabouts page
const STATUS_COLORS: Record<string, string> = {
    'ON DUTY': 'ring-emerald-500 dark:ring-emerald-400',
    'ON TRAVEL': 'ring-blue-500 dark:ring-blue-400',
    'ON LEAVE': 'ring-red-500 dark:ring-red-400',
    ABSENT: 'ring-amber-500 dark:ring-amber-400',
    'HALF DAY': 'ring-yellow-400 dark:ring-yellow-300',
    WFH: 'ring-purple-500 dark:ring-purple-400',
};

// Helper function to get border color based on whereabouts status
const getWhereaboutsBorderColor = (status: string | null | undefined): string => {
    if (!status) return '';
    return STATUS_COLORS[status] || '';
};

// Helper function to check if whereabouts was updated today
const isWhereaboutsUpdatedToday = (updatedAt: string | null | undefined): boolean => {
    if (!updatedAt) return false;
    try {
        return isToday(parseISO(updatedAt));
    } catch {
        return false;
    }
};

// Employee Management list page component
export default function EmployeeManagement() {
    const { showSuccess, showError, showInfo } = usePopupAlert();
    const { props } = usePage<PageProps>();
    const {
        users = {
            data: [],
            links: [],
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: 0,
        } as PaginatedUsers,
        auth,
        stats = {
            total: 0,
            regular: 0,
            cos: 0,
            jobOrder: 0,
        },
    } = props;

    // Local state for search, filters, and employees
    const [search, setSearch] = useState<string>('');
    const [perPage, setPerPage] = useState<number>(12);
    const [cpmd, setCpmd] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const toggleRow = (id: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.relative')) {
                setActiveDropdown(null);
            }
        };

        if (activeDropdown !== null) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [activeDropdown]);

    // Load all employees once on component mount
    const [allEmployees, setAllEmployees] = useState(users.data || []);

    // Update all employees when data changes
    useEffect(() => {
        setAllEmployees(users.data || []);
    }, [users.data]);

    // Filter employees based on search and filters
    const filteredEmployees = useMemo(() => {
        let result = [...allEmployees];

        // Filter for CPMD office only
        result = result.filter((emp) => emp.office === 'CPMD');

        // Apply CPMD section filter
        if (cpmd) {
            result = result.filter((emp) => emp.cpmd === cpmd);
        }

        // Apply status filter
        if (status) {
            result = result.filter((emp) => emp.employment_status === status);
        }

        // Apply search
        if (search) {
            const query = search.toLowerCase();
            result = result.filter(
                (emp) =>
                    emp.name?.toLowerCase().includes(query) ||
                    emp.email?.toLowerCase().includes(query) ||
                    emp.position?.toLowerCase().includes(query),
            );
        }

        return result;
    }, [allEmployees, search, cpmd, status]);

    // Pagination
    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return filteredEmployees.slice(startIndex, startIndex + perPage);
    }, [filteredEmployees, currentPage, perPage]);

    // Update URL without page reload
    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (perPage !== 12) params.set('perPage', perPage.toString());
        if (cpmd) params.set('cpmd', cpmd);
        if (status) params.set('status', status);
        if (currentPage > 1) params.set('page', currentPage.toString());

        const url = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', url);
    }, [search, perPage, cpmd, status, currentPage]);

    // Handle page changes when filters or items per page changes
    useEffect(() => {
        const newTotalPages = Math.ceil(filteredEmployees.length / perPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (currentPage === 0 && newTotalPages > 0) {
            setCurrentPage(1);
        } else if (search || cpmd || status) {
            setCurrentPage(1);
        }
        updateUrl();
    }, [
        search,
        cpmd,
        status,
        perPage,
        filteredEmployees.length,
        currentPage,
        updateUrl,
    ]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    // Handle page change with proper type safety
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // updateUrl will be called by the effect below
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Employee Management', href: '/employees' }]}
        >
            <Head title="Employee Management" />

            <div className="flex flex-col gap-6 p-4">
                {/* Statistics Section */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SimpleStatistic
                        label="Total Employees"
                        value={stats.total}
                        icon={Users}
                        subtitle="Total employees in CPMD"
                        backgroundColor="#163832"
                    />
                    <SimpleStatistic
                        label="Regular Employees"
                        value={stats.regular}
                        icon={UserCheck}
                        subtitle="Permanent status"
                        backgroundColor="#1a4d3e"
                    />
                    <SimpleStatistic
                        label="COS Employees"
                        value={stats.cos}
                        icon={Briefcase}
                        subtitle="Contract of Service"
                        backgroundColor="#235347"
                    />
                    <SimpleStatistic
                        label="Job Order"
                        value={stats.jobOrder}
                        icon={Clock}
                        subtitle="Casual/Temporary"
                        backgroundColor="#2a6358"
                    />
                </div>

                {/* Header actions */}
                <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Filters and Add button on the left */}
                    <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                        {(auth?.user?.role === 'superadmin' ||
                            auth?.user?.role === 'admin') && (
                            <button
                                onClick={() => router.get('/employees/create')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-2 text-sm text-white transition hover:bg-[#163832]/90 sm:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span>Add Employee</span>
                            </button>
                        )}

                        <Select
                            value={cpmd || 'all'}
                            onValueChange={(val) => {
                                const newValue = val === 'all' ? '' : val;
                                setCpmd(newValue);
                                // Update state only, no server request needed
                            }}
                        >
                            <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue placeholder="All Sections" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="all"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    All Sections
                                </SelectItem>
                                <SelectItem
                                    value="Office of the Chief"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    Office of the Chief
                                </SelectItem>
                                <SelectItem
                                    value="OC-Admin Support Unit"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    OC-Admin Support Unit
                                </SelectItem>
                                <SelectItem
                                    value="OC-Special Project Unit"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    OC-Special Project Unit
                                </SelectItem>
                                <SelectItem
                                    value="OC-ICT Unit"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    OC-ICT Unit
                                </SelectItem>

                                <SelectItem
                                    value="BIOCON Section"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    BIOCON Section
                                </SelectItem>

                                <SelectItem
                                    value="PFS Section"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    PFS Section
                                </SelectItem>
                                <SelectItem
                                    value="PHPS Section"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    PHPS Section
                                </SelectItem>
                                <SelectItem
                                    value="Others"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    Others
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={status || 'all'}
                            onValueChange={(val) => {
                                const newValue = val === 'all' ? '' : val;
                                setStatus(newValue);
                                // Update state only, no server request needed
                            }}
                        >
                            <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue placeholder="Employment Status" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="all"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    Employment Status
                                </SelectItem>
                                <SelectItem
                                    value="Regular"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    Regular
                                </SelectItem>
                                <SelectItem
                                    value="COS"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    COS
                                </SelectItem>
                                <SelectItem
                                    value="Job Order"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    Job Order
                                </SelectItem>
                                <SelectItem
                                    value="Others"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    Others
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={perPage.toString()}
                            onValueChange={(value) => {
                                const newPerPage = parseInt(value);
                                setPerPage(newPerPage);
                                // Update state only, no server request needed
                            }}
                        >
                            <SelectTrigger className="w-full border-gray-300 sm:w-[150px] dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue placeholder="Rows per page" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="12"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    12 per page
                                </SelectItem>
                                <SelectItem
                                    value="24"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    24 per page
                                </SelectItem>
                                <SelectItem
                                    value="48"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    48 per page
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search and Export on the right */}
                    <div className="flex w-full flex-row items-center gap-2 md:w-auto md:flex-row md:items-center">
                        <ExportEmployee
                            data={filteredEmployees}
                            variant="outline"
                            size="default"
                            className="w-full md:w-auto"
                        />
                        <div className="w-full md:w-80">
                            <SearchBar
                                search={search}
                                onSearchChange={handleSearchChange}
                                placeholder="Search employees..."
                                className="w-full"
                                searchRoute="/employees"
                                additionalParams={{ perPage, cpmd, status }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table view */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-neutral-800">
                                <tr>
                                    <th className="w-10 px-4 py-3"></th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Employee
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Employee ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Position
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Office
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Section/Unit
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Employment Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                {filteredEmployees.length > 0 ? (
                                    paginatedEmployees.map((employee: User) => {
                                        const isRowExpanded = expandedRows.has(
                                            employee.id,
                                        );
                                        return (
                                            <Fragment key={employee.id}>
                                                <tr
                                                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${isRowExpanded ? 'bg-gray-50/80 dark:bg-neutral-800/40' : ''}`}
                                                    onClick={() =>
                                                        toggleRow(employee.id)
                                                    }
                                                >
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        {isRowExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                {employee.profile_picture ? (
                                                                    <img
                                                                        className={`h-10 w-10 rounded-full object-cover ${
                                                                            isWhereaboutsUpdatedToday(employee.whereabouts_updated_at)
                                                                                ? `ring-2 ring-offset-2 dark:ring-offset-neutral-900 ${getWhereaboutsBorderColor(employee.whereabouts_status)}`
                                                                                : ''
                                                                        }`}
                                                                        src={`/storage/${employee.profile_picture}`}
                                                                        alt={
                                                                            employee.name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-700 ${
                                                                        isWhereaboutsUpdatedToday(employee.whereabouts_updated_at)
                                                                            ? `ring-2 ring-offset-2 dark:ring-offset-neutral-900 ${getWhereaboutsBorderColor(employee.whereabouts_status)}`
                                                                            : ''
                                                                    }`}>
                                                                        <svg
                                                                            className="h-6 w-6 text-gray-400 dark:text-neutral-500"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {employee.name ||
                                                                        '—'}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {employee.email ||
                                                                        '—'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                                        {employee.employee_id ||
                                                            '—'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                                        {employee.position ||
                                                            '—'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                                        {employee.office || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                                        {employee.cpmd || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                employee.status ===
                                                                'active'
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                    : 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-300'
                                                            }`}
                                                        >
                                                            {employee.employment_status ||
                                                                '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.get(
                                                                    `/employees/${employee.id}`,
                                                                );
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-md bg-[#163832] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#1a4d3e]"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            <span>Edit</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isRowExpanded && (
                                                    <tr className="bg-gray-50/50 dark:bg-neutral-800/20">
                                                        <td
                                                            colSpan={8}
                                                            className="px-8 py-4"
                                                        >
                                                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                                                                {/* Column 1 */}
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Hiring
                                                                            Date
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.hiring_date ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Item
                                                                            Number
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.item_number ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            TIN
                                                                            Number
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.tin_number ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Column 2 */}
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            GSIS
                                                                            Number
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.gsis_number ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Landbank
                                                                            Number
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.landbank_number ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Mobile
                                                                            Number
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.mobile_number ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Column 3 */}
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Home
                                                                            Address
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.address ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Birth
                                                                            Date
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.date_of_birth ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Gender
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.gender ||
                                                                                '—'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Column 4 */}
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Emergency
                                                                            Contact
                                                                        </span>
                                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                                            {employee.contact_person ||
                                                                                '—'}{' '}
                                                                            {employee.contact_number
                                                                                ? `- ${employee.contact_number}`
                                                                                : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center"
                                        >
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {search
                                                    ? 'No employees match your search'
                                                    : 'No employees found'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {filteredEmployees.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                                {paginatedEmployees.map((employee: User) => {
                                    const isRowExpanded = expandedRows.has(employee.id);
                                    return (
                                        <div
                                            key={employee.id}
                                            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${isRowExpanded ? 'bg-gray-50/80 dark:bg-neutral-800/40' : ''}`}
                                            onClick={(e) => {
                                                if (activeDropdown === null) {
                                                    toggleRow(employee.id);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col space-y-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-12 w-12 flex-shrink-0">
                                                        {employee.profile_picture ? (
                                                            <img
                                                                className={`h-12 w-12 rounded-full object-cover ${
                                                                    isWhereaboutsUpdatedToday(employee.whereabouts_updated_at)
                                                                        ? `ring-2 ring-offset-2 dark:ring-offset-neutral-900 ${getWhereaboutsBorderColor(employee.whereabouts_status)}`
                                                                        : ''
                                                                }`}
                                                                src={`/storage/${employee.profile_picture}`}
                                                                alt={employee.name}
                                                            />
                                                        ) : (
                                                            <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-700 ${
                                                                isWhereaboutsUpdatedToday(employee.whereabouts_updated_at)
                                                                    ? `ring-2 ring-offset-2 dark:ring-offset-neutral-900 ${getWhereaboutsBorderColor(employee.whereabouts_status)}`
                                                                    : ''
                                                            }`}>
                                                                <svg
                                                                    className="h-8 w-8 text-gray-400 dark:text-neutral-500"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {employee.name || '—'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                            {employee.email || '—'}
                                                        </p>
                                                        <p className="text-sm text-gray-900 dark:text-white truncate">
                                                            {employee.position || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-gray-500 dark:text-gray-400">ID:</span>
                                                            <span className="ml-1 text-gray-900 dark:text-white truncate">{employee.employee_id || '—'}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-gray-500 dark:text-gray-400">Office:</span>
                                                            <span className="ml-1 text-gray-900 dark:text-white truncate">{employee.office || '—'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="flex items-center flex-1 min-w-0">
                                                            <span className="font-medium text-gray-500 dark:text-gray-400">Section:</span>
                                                            <span className="ml-1 text-gray-900 dark:text-white truncate">{employee.cpmd || '—'}</span>
                                                        </div>
                                                        <div className="flex items-center flex-shrink-0">
                                                            <span className="font-medium text-gray-500 dark:text-gray-400">Status:</span>
                                                            <span
                                                                className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                    employee.status === 'active'
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-300'
                                                                }`}
                                                            >
                                                                {employee.employment_status || '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-neutral-700">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.get(`/employees/${employee.id}`);
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-md bg-[#163832] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#1a4d3e]"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleRow(employee.id);
                                                        }}
                                                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        {isRowExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            
                                            {isRowExpanded && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
                                                    <div className="grid grid-cols-1 gap-3 text-xs">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">Hiring Date</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.hiring_date || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">Item Number</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.item_number || '—'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">TIN Number</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.tin_number || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">GSIS Number</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.gsis_number || '—'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">Landbank Number</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.landbank_number || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">Mobile Number</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.mobile_number || '—'}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="block font-medium text-gray-500 dark:text-gray-400">Home Address</span>
                                                            <span className="block text-gray-900 dark:text-white">{employee.address || '—'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">Birth Date</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.date_of_birth || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block font-medium text-gray-500 dark:text-gray-400">Gender</span>
                                                                <span className="block text-gray-900 dark:text-white">{employee.gender || '—'}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="block font-medium text-gray-500 dark:text-gray-400">Emergency Contact</span>
                                                            <span className="block text-gray-900 dark:text-white">
                                                                {employee.contact_person || '—'} {employee.contact_number ? `- ${employee.contact_number}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400">
                                    {search
                                        ? 'No employees match your search'
                                        : 'No employees found'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-2">
                    {filteredEmployees.length > 0 && (
                        <CustomPagination
                            currentPage={currentPage}
                            totalItems={filteredEmployees.length}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
