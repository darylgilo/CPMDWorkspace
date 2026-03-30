import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
// Custom card components removed as they're no longer used
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
        section_id?: number | null;
        employment_status?: string | null;
        employee_id?: string | null;
        status?: 'active' | 'inactive' | null;
        profile_picture?: string | null;
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
        sections?: Array<{
            id: number;
            name: string;
            code: string;
            office: string;
            display_order: number;
        }>;
        [key: string]: unknown;
    }

    const { props } = usePage<PageProps>();
    const { users = { data: [] }, sections } = props;

    // State for search and filters
    const [search, setSearch] = useState<string>('');
    const [perPage, setPerPage] = useState<number>(12);
    const [office, setOffice] = useState<string>('');
    const [cpmd, setCpmd] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    // Define sections for each office
    const officeSections: Record<string, string[]> = {
        'CPMD': [
            'Office of the Chief',
            'OC-Admin Support Unit',
            'OC-Special Project Unit',
            'OC-ICT Unit',
            'BIOCON Section',
            'PFS Section',
            'PHPS Section',
            'Others'
        ],
        'DO': [
            'Office of the Director',
            'Admin Support Unit',
            'Planning Unit',
            'Others'
        ],
        'ADO RDPSS': [
            'Office of the ADO',
            'RDPSS Unit',
            'Admin Support',
            'Others'
        ],
        'ADO RS': [
            'Office of the ADO',
            'Research Services',
            'Admin Support',
            'Others'
        ],
        'PMO': [
            'Project Management',
            'Monitoring Unit',
            'Admin Support',
            'Others'
        ],
        'BIOTECH': [
            'Biotechnology Unit',
            'Research Lab',
            'Admin Support',
            'Others'
        ],
        'NSIC': [
            'Office of the Chief',
            'Information Center',
            'Admin Support',
            'Others'
        ],
        'ADMINISTRATIVE': [
            'HR Unit',
            'Finance Unit',
            'General Services',
            'Others'
        ],
        'CRPSD': [
            'Office of the Chief',
            'Crop Research',
            'Admin Support',
            'Others'
        ],
        'AED': [
            'Office of the Chief',
            'Extension Services',
            'Admin Support',
            'Others'
        ],
        'PPSSD': [
            'Office of the Chief',
            'Plant Services',
            'Admin Support',
            'Others'
        ],
        'NPQSD': [
            'Office of the Chief',
            'Quality Services',
            'Admin Support',
            'Others'
        ],
        'NSQCS': [
            'Office of the Chief',
            'Quality Control',
            'Admin Support',
            'Others'
        ],
        'Others': [
            'General',
            'Support',
            'Others'
        ]
    };

    // Use backend sections or fallback to hardcoded sections
    const sectionsByOffice = useMemo(() => {
        if (sections && sections.length > 0) {
            const grouped: Record<string, { id: number; name: string }[]> = {};
            sections.forEach((section: { id: number; name: string; code: string; office: string; display_order: number }) => {
                if (!grouped[section.office]) {
                    grouped[section.office] = [];
                }
                grouped[section.office].push({ id: section.id, name: section.name });
            });
            return grouped;
        }
        return officeSections;
    }, [sections]);

    // Get current office sections
    const currentOfficeSections = office && office !== 'all' ? sectionsByOffice[office] || [] : [];

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

        // Apply section filter (works regardless of office selection)
        if (cpmd) {
            const section = sections?.find(s => s.name === cpmd);
            if (section) {
                result = result.filter((emp) => emp.section_id === section.id);
            }
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
    }, [allEmployees, search, office, cpmd, status]);

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
            if (status) params.set('status', status);
            if (currentPage > 1) params.set('page', currentPage.toString());

            const url = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', url);
        };
    }, [search, perPage, office, cpmd, status, currentPage]);

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
        } else if (search || office || cpmd || status) {
            newPage = 1;
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            setCurrentPage(newPage);
        } else {
            updateUrl();
        }
    }, [
        search,
        office,
        cpmd,
        status,
        perPage,
        filteredEmployees.length,
        currentPage,
        updateUrl,
    ]);

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
        setStatus('');
        setCurrentPage(1);
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Employee Directory', href: '/directory' }]}
        >
            <Head title="Employee Directory" />

            <div className="flex flex-col gap-4 p-4">
                {/* Header actions (no Add button) */}
                <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Filters on the left */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select
                            value={office || 'all'}
                            onValueChange={(val) => {
                                const newValue = val === 'all' ? '' : val;
                                setOffice(newValue);
                                setCpmd(''); // Reset section filter when office changes
                                setCurrentPage(1); // Reset to first page on filter change
                            }}
                        >
                            <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950">
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
                                    value="ADO RDPSS"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    ADO RDPSS
                                </SelectItem>
                                <SelectItem
                                    value="ADO RS"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    ADO RS
                                </SelectItem>
                                <SelectItem
                                    value="PMO"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    PMO
                                </SelectItem>
                                <SelectItem
                                    value="BIOTECH"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    BIOTECH
                                </SelectItem>
                                <SelectItem
                                    value="NSIC"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    NSIC
                                </SelectItem>
                                <SelectItem
                                    value="ADMINISTRATIVE"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    ADMINISTRATIVE
                                </SelectItem>
                                <SelectItem
                                    value="CPMD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    CPMD
                                </SelectItem>
                                <SelectItem
                                    value="CRPSD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    CRPSD
                                </SelectItem>
                                <SelectItem
                                    value="AED"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    AED
                                </SelectItem>
                                <SelectItem
                                    value="PPSSD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    PPSSD
                                </SelectItem>
                                <SelectItem
                                    value="NPQSD"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    NPQSD
                                </SelectItem>
                                <SelectItem
                                    value="NSQCS"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    NSQCS
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
                            disabled={!office || office === 'all'}
                        >
                            <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950 disabled:opacity-50">
                                <SelectValue placeholder={office && office !== 'all' ? "All Sections" : "Select office first"} />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                <SelectItem
                                    value="all"
                                    className="cursor-pointer hover:bg-[#1a4d3e]"
                                >
                                    All Sections
                                </SelectItem>
                                {currentOfficeSections.map((section) => (
                                    <SelectItem
                                        key={section.id}
                                        value={section.name}
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        {section.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={status || 'all'}
                            onValueChange={(val) => {
                                const newValue = val === 'all' ? '' : val;
                                setStatus(newValue);
                                setCurrentPage(1); // Reset to first page on filter change
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
                                    COS (Contract of Service)
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
                                setCurrentPage(1); // Reset to first page when changing items per page
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
                            additionalParams={{ perPage, office, cpmd, status }}
                        />
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedEmployees.map((employee: User) => (
                        <div
                            key={employee.id}
                            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-neutral-700">
                                        {employee.profile_picture ? (
                                            <img
                                                src={`/storage/${employee.profile_picture}`}
                                                alt={employee.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-neutral-800">
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
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                            {employee.name || '—'}
                                        </h3>
                                        <p className="truncate text-xs text-gray-500 dark:text-neutral-400">
                                            {employee.position || '—'}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-neutral-400">
                                            {employee.employee_id ||
                                                employee.email ||
                                                '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${employee.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-300'}`}
                                    >
                                        {employee.status
                                            ? employee.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              employee.status.slice(1)
                                            : '—'}
                                    </span>
                                    <button
                                        onClick={() =>
                                            router.get(
                                                `/directory/${employee.id}`,
                                            )
                                        }
                                        className="inline-flex items-center gap-1 rounded-md bg-[#163832] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#1a4d3e]"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>View</span>
                                    </button>
                                </div>
                            </div>
                        </div>
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
