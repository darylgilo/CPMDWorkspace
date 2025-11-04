import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
import {
    CustomCard,
    CustomCardAvatar,
    CustomCardContent,
} from '@/components/ui/CustomCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Eye, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Employee Directory list page component (read-only)
export default function EmployeeDirectory() {
    interface User {
        id: number;
        name: string;
        email: string;
        position?: string | null;
        office?: string | null;
        cpmd_section?: string | null;
        employee_id?: string | null;
        status?: 'active' | 'inactive' | null;
        [key: string]: unknown;
    }

    interface PageProps extends InertiaPageProps {
        users: {
            data: User[];
            [key: string]: unknown;
        };
        auth: {
            user?: {
                id: number;
                [key: string]: unknown;
            };
            [key: string]: unknown;
        };
    }

    const { props } = usePage<PageProps>();
    const { users = { data: [] } } = props;

    // State for search and filters
    const [search, setSearch] = useState<string>('');
    const [perPage, setPerPage] = useState<number>(12);
    const [office, setOffice] = useState<string>('');
    const [cpmd, setCpmd] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    // Local state for all employees
    const [allEmployees, setAllEmployees] = useState(users.data || []);

    // Update local state when props change
    useEffect(() => {
        setAllEmployees(users.data || []);
        // Reset to first page when filters change
        setCurrentPage(1);
    }, [users.data]);

    // Client-side filtering
    const filteredEmployees = useMemo(() => {
        let result: User[] = [...allEmployees];

        // Apply office filter
        if (office) {
            result = result.filter((emp) => emp.office === office);
        }

        // Apply CPMD section filter if office is CPMD
        if (office === 'CPMD' && cpmd) {
            result = result.filter((emp) => emp.cpmd_section === cpmd);
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
    }, [allEmployees, search, office, cpmd]);

    // Get paginated employees
    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return filteredEmployees.slice(startIndex, startIndex + perPage);
    }, [filteredEmployees, currentPage, perPage]);

    // Update URL without page reload
    const updateUrl = useMemo(() => {
        return () => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (perPage !== 12) params.set('perPage', perPage.toString());
            if (office) params.set('office', office);
            if (cpmd) params.set('cpmd', cpmd);
            if (currentPage > 1) params.set('page', currentPage.toString());

            const url = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', url);
        };
    }, [search, perPage, office, cpmd, currentPage]);

    // Handle page changes when filters or items per page changes
    useEffect(() => {
        const newTotalPages = Math.ceil(filteredEmployees.length / perPage);
        let shouldUpdate = false;
        let newPage = currentPage;

        if (currentPage > newTotalPages && newTotalPages > 0) {
            newPage = newTotalPages;
            shouldUpdate = true;
        } else if (currentPage === 0 && newTotalPages > 0) {
            newPage = 1;
            shouldUpdate = true;
        } else if (search || office || cpmd) {
            newPage = 1;
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            setCurrentPage(newPage);
        } else {
            updateUrl();
        }
    }, [search, office, cpmd, perPage, filteredEmployees.length, currentPage, updateUrl]);

    // Update URL when currentPage changes
    useEffect(() => {
        updateUrl();
    }, [currentPage, updateUrl]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // updateUrl will be called by the effect below
    };

    const handleClearFilters = () => {
        setSearch('');
        setOffice('');
        setCpmd('');
        setCurrentPage(1);
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Employee Directory', href: '/directory' }]}
        >
            <Head title="Employee Directory" />

            <div className="flex flex-col gap-4 p-4">
                {/* Header actions (no Add button) */}
                <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between md:p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Filters on the left */}
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                        <Select
                            value={office || 'all'}
                            onValueChange={(val) => {
                                const newValue = val === 'all' ? '' : val;
                                setOffice(newValue);
                                setCpmd(''); // Reset CPMD when office changes
                                setCurrentPage(1); // Reset to first page on filter change
                            }}
                        >
                            <SelectTrigger className="w-[180px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue placeholder="All Offices" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="all"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    All Offices
                                </SelectItem>
                                <SelectItem
                                    value="DO"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    DO
                                </SelectItem>
                                <SelectItem
                                    value="ADO"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    ADO
                                </SelectItem>
                                <SelectItem
                                    value="CPMD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    CPMD
                                </SelectItem>
                                <SelectItem
                                    value="AED"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    AED
                                </SelectItem>
                                <SelectItem
                                    value="NSQCS"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    NSQCS
                                </SelectItem>
                                <SelectItem
                                    value="NPQSD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    NPQSD
                                </SelectItem>
                                <SelectItem
                                    value="NSIC"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    NSIC
                                </SelectItem>
                                <SelectItem
                                    value="CRPSD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    CRPSD
                                </SelectItem>
                                <SelectItem
                                    value="PPSSD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    PPSSD
                                </SelectItem>
                                <SelectItem
                                    value="ADMINISTRATIVE"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    ADMINISTRATIVE
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
                            value={cpmd || 'all'}
                            onValueChange={(val) => {
                                const newValue = val === 'all' ? '' : val;
                                setCpmd(newValue);
                                setCurrentPage(1); // Reset to first page on filter change
                            }}
                            disabled={office !== 'CPMD'}
                        >
                            <SelectTrigger className="w-[180px] border-gray-300 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue
                                    placeholder={
                                        office === 'CPMD'
                                            ? 'All Sections'
                                            : 'Select CPMD First'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="all"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    All Sections
                                </SelectItem>
                                <SelectItem
                                    value="BIOCON section"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    BIOCON section
                                </SelectItem>
                                <SelectItem
                                    value="PFS section"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    PFS section
                                </SelectItem>
                                <SelectItem
                                    value="PHPS SECTION"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    PHPS SECTION
                                </SelectItem>
                                <SelectItem
                                    value="OC-Admin Support Unit"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    OC-Admin Support Unit
                                </SelectItem>
                                <SelectItem
                                    value="OC-ICT Unit"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    OC-ICT Unit
                                </SelectItem>
                                <SelectItem
                                    value="OC-Special Project"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    OC-Special Project
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
                                setCurrentPage(1); // Reset to first page when changing items per page
                            }}
                        >
                            <SelectTrigger className="w-[150px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
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

                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-2 text-sm text-white transition hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            title="Clear filters"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Clear filters</span>
                        </button>
                    </div>

                    {/* Search on the right */}
                    <div className="w-full md:w-80">
                        <SearchBar
                            search={search}
                            onSearchChange={handleSearchChange}
                            placeholder="Search employees..."
                            className="w-full"
                            searchRoute="/directory"
                            additionalParams={{ perPage, office, cpmd }}
                        />
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {paginatedEmployees.map((employee: User) => (
                        <CustomCard key={employee.id}>
                            <CustomCardAvatar
                                src={
                                    employee.profile_picture
                                        ? `/storage/${employee.profile_picture}`
                                        : undefined
                                }
                                alt={employee.name}
                            />
                            <CustomCardContent>
                                <div className="truncate font-semibold text-gray-900 dark:text-white">
                                    {employee.name || '—'}
                                </div>
                                <div className="truncate text-xs text-gray-500 dark:text-neutral-400">
                                    {employee.position || '—'}
                                </div>
                                <div className="mt-1 truncate text-xs text-gray-500 dark:text-neutral-400">
                                    {employee.employee_id || employee.email || '—'}
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs ${employee.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'}`}
                                    >
                                        {employee.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : '—'}
                                    </span>
                                    <button
                                        onClick={() =>
                                            router.get(
                                                `/directory/${employee.id}`,
                                            )
                                        }
                                        className="inline-flex items-center gap-1 rounded bg-[#163832] px-2.5 py-1 text-xs text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                    >
                                        <Eye className="h-3.5 w-3.5" /> View
                                    </button>
                                </div>
                            </CustomCardContent>
                        </CustomCard>
                    ))}
                </div>

                {/* Pagination */}
                {filteredEmployees.length > 0 && (
                    <CustomPagination
                        currentPage={currentPage}
                        totalItems={filteredEmployees.length}
                        perPage={perPage}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </AppLayout>
    );
}
