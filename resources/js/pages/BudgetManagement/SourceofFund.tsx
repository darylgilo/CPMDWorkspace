import CustomPagination from '@/components/CustomPagination';
import DonutPieChart from '@/components/DonutPieChart';
import FormDialog, { type FormField } from '@/components/FormDialog';
import FundTrendChart from '@/components/FundTrendChart';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    Edit3,
    MoreVertical,
    Plus,
    Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Fund {
    id: number;
    fund_name: string;
    total_amount: number;
    source_year: number;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    funds: {
        data: Fund[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search: string;
    perPage: number;
    fundAnalytics: {
        totalFunds: number;
        totalAmount: number;
        totalByYear: { source_year: number; total: number }[];
        fundsByYearAndName: { year: number; funds: Record<string, number> }[];
    };
    [key: string]: unknown;
}

export default function SourceofFund() {
    const { showSuccess, showError, showDeleted, showWarning } =
        usePopupAlert();
    const { props } = usePage<PageProps>();
    const {
        funds,
        search = '',
        perPage: perPageProp = 10,
        fundAnalytics: analytics,
    } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(funds?.current_page || 1);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
    const [sortField, setSortField] = useState<string>('fund_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Form field configuration for funds
    // Generate year options (20 years back and 10 years forward)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from(
        { length: 31 },
        (_, i) => currentYear - 20 + i,
    );

    const fundFormFields: FormField[] = [
        {
            name: 'fund_name',
            label: 'Fund Name',
            type: 'text',
            required: true,
            placeholder: 'e.g., Regular Fund, Special Fund',
        },
        {
            name: 'total_amount',
            label: 'Total Amount',
            type: 'number',
            required: true,
            step: '0.01',
            min: '0',
        },
        {
            name: 'source_year',
            label: 'Year',
            type: 'select',
            required: true,
            options: yearOptions.map((year) => ({
                value: year.toString(),
                label: year.toString(),
            })),
            placeholder: 'Select year',
        },
    ];

    const [formData, setFormData] = useState({
        fund_name: '',
        total_amount: '',
        source_year: '',
    });

    const resetForm = () => {
        setFormData({
            fund_name: '',
            total_amount: '',
            source_year: '',
        });
    };

    const handleAdd = () => {
        resetForm();
        setIsAddDialogOpen(true);
    };

    const handleEdit = (fund: Fund) => {
        setSelectedFund(fund);
        setFormData({
            fund_name: fund.fund_name,
            total_amount: fund.total_amount.toString(),
            source_year: fund.source_year.toString(),
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this fund?')) {
            router.delete(`/funds/${id}`, {
                onSuccess: () => {
                    showDeleted(
                        'Fund Deleted',
                        'Fund source has been successfully removed.',
                    );
                    router.get(
                        '/budgetmanagement',
                        {
                            tab: 'source',
                            search: searchValue,
                            perPage,
                            page: currentPage,
                            sort: sortField,
                            direction: sortDirection,
                        },
                        { preserveState: false }, // Force refresh to get updated analytics
                    );
                },
                onError: (errors) => {
                    showError(
                        'Delete Failed',
                        'Unable to delete fund. Please try again.',
                    );
                    console.error('Error deleting fund:', errors);
                },
            });
        }
    };

    const handleSubmitAdd = (e: React.FormEvent) => {
        e.preventDefault();

        const formattedData = {
            ...formData,
            total_amount: parseFloat(formData.total_amount) || 0,
            source_year: parseInt(formData.source_year),
        };

        router.post('/funds', formattedData, {
            onSuccess: () => {
                showSuccess(
                    'Fund Added',
                    'New fund source has been successfully created.',
                );
                setIsAddDialogOpen(false);
                resetForm();
                router.get(
                    '/budgetmanagement',
                    {
                        tab: 'source',
                        search: searchValue,
                        perPage,
                        page: currentPage,
                        sort: sortField,
                        direction: sortDirection,
                    },
                    { preserveState: false }, // Force refresh to get updated analytics
                );
            },
            onError: (errors) => {
                showError(
                    'Add Failed',
                    'Unable to add fund. Please try again.',
                );
                console.error('Error adding fund:', errors);
            },
        });
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedFund) {
            const formattedData = {
                ...formData,
                total_amount: parseFloat(formData.total_amount) || 0,
                source_year: parseInt(formData.source_year),
            };

            router.put(`/funds/${selectedFund.id}`, formattedData, {
                onSuccess: () => {
                    showSuccess(
                        'Fund Updated',
                        'Fund source has been successfully updated.',
                    );
                    setIsEditDialogOpen(false);
                    resetForm();
                    setSelectedFund(null);
                    router.get(
                        '/budgetmanagement',
                        {
                            tab: 'source',
                            search: searchValue,
                            perPage,
                            page: currentPage,
                            sort: sortField,
                            direction: sortDirection,
                        },
                        { preserveState: false }, // Force refresh to get updated analytics
                    );
                },
                onError: (errors) => {
                    showError(
                        'Update Failed',
                        'Unable to update fund. Please try again.',
                    );
                    console.error('Error updating fund:', errors);
                },
            });
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/budgetmanagement',
            {
                tab: 'source',
                search: searchValue,
                perPage,
                page,
                sort: sortField,
                direction: sortDirection,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSort = (field: string) => {
        const newDirection =
            sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        setCurrentPage(1);
        router.get(
            '/budgetmanagement',
            {
                tab: 'source',
                search: searchValue,
                perPage,
                sort: field,
                direction: newDirection,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const sortedFunds = useMemo(() => {
        if (!funds?.data) return [];

        return [...funds.data].sort((a, b) => {
            let aValue = a[sortField as keyof Fund];
            let bValue = b[sortField as keyof Fund];

            if (sortField.includes('_date') || sortField === 'expiry_date') {
                aValue = aValue ? new Date(aValue as string).getTime() : 0;
                bValue = bValue ? new Date(bValue as string).getTime() : 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            return 0;
        });
    }, [funds, sortField, sortDirection]);

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

    // State to hold the selected year for the donut chart
    const [selectedDonutYear, setSelectedDonutYear] = useState<number | null>(
        null,
    );

    // Prepare data for donut chart from fund analytics
    const donutChartData = useMemo(() => {
        if (
            !analytics?.fundsByYearAndName ||
            analytics.fundsByYearAndName.length === 0
        )
            return [];

        // Use selected year or default to most recent year
        const yearToDisplay =
            selectedDonutYear ||
            Math.max(...analytics.fundsByYearAndName.map((item) => item.year));
        const yearData = analytics.fundsByYearAndName.find(
            (item) => item.year === yearToDisplay,
        );

        if (!yearData) return [];

        return Object.entries(yearData.funds).map(([name, value]) => ({
            name,
            value,
        }));
    }, [analytics, selectedDonutYear]);

    // Get the most recent year for title display
    const mostRecentYear = useMemo(() => {
        if (
            !analytics?.fundsByYearAndName ||
            analytics.fundsByYearAndName.length === 0
        )
            return null;
        return Math.max(
            ...analytics.fundsByYearAndName.map((item) => item.year),
        );
    }, [analytics]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    if (!funds) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">Loading fund data...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {/* Analytics Dashboard */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Donut Chart - Left Side */}
                        <div>
                            <DonutPieChart
                                title={`Annual Budget of CPMD ${selectedDonutYear || mostRecentYear ? `(${selectedDonutYear || mostRecentYear})` : ''}`}
                                data={donutChartData}
                                height={360}
                                outerRadius={120}
                                innerRadius={80}
                                showYearSelector={true}
                                availableYears={
                                    analytics?.fundsByYearAndName
                                        ?.map((item) => item.year)
                                        .sort((a, b) => b - a) || []
                                }
                                selectedYear={selectedDonutYear}
                                onYearChange={(year) =>
                                    setSelectedDonutYear(year)
                                }
                            />
                        </div>

                        {/* Fund Trends Chart - Right Side */}
                        <div>
                            <FundTrendChart
                                title="Fund Trends Overview"
                                data={analytics?.fundsByYearAndName || []}
                                height={350}
                            />
                        </div>
                    </div>
                </div>

                {/* Funds Table */}
                <div className="relative min-h-[50vh] flex-1 overflow-x-auto rounded-xl border-t-4 border-r border-b border-l border-gray-200 border-t-[#163832] bg-white p-4 shadow-sm md:min-h-min dark:border-neutral-600 dark:border-t-[#235347] dark:bg-neutral-900">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-start">
                            <Button
                                onClick={handleAdd}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Add Fund
                                </span>
                            </Button>
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
                                        const newPerPage = parseInt(value, 10);
                                        setPerPage(newPerPage);
                                        router.get(
                                            '/budgetmanagement',
                                            {
                                                tab: 'source',
                                                search: searchValue,
                                                perPage: newPerPage,
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
                                placeholder="Search funds..."
                                className="w-full md:max-w-md"
                                searchRoute="/budgetmanagement"
                                additionalParams={{ tab: 'source', perPage }}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('fund_name')}
                                    >
                                        <div className="flex items-center">
                                            Fund Name
                                            <SortIndicator field="fund_name" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('total_amount')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Total Amount
                                            <SortIndicator field="total_amount" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('source_year')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Year
                                            <SortIndicator field="source_year" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {funds?.data && funds.data.length > 0 ? (
                                    sortedFunds.map((fund: Fund) => (
                                        <TableRow key={fund.id}>
                                            <TableCell className="font-medium">
                                                {fund.fund_name}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    fund.total_amount,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {fund.source_year}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        fund,
                                                                    )
                                                                }
                                                            >
                                                                <Edit3 className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        fund.id,
                                                                    )
                                                                }
                                                                className="text-red-600 focus:text-red-600 dark:text-red-400"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-24 text-center"
                                        >
                                            No funds found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {funds && (
                        <div className="mt-4">
                            <CustomPagination
                                currentPage={funds.current_page}
                                totalItems={funds.total}
                                perPage={funds.per_page}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>

                {/* Add Fund Dialog */}
                <FormDialog
                    isOpen={isAddDialogOpen}
                    onOpenChange={(open) => !open && setIsAddDialogOpen(false)}
                    title="Add New Fund"
                    description="Create a new fund with details"
                    fields={fundFormFields}
                    formData={formData}
                    onInputChange={(e) =>
                        setFormData({
                            ...formData,
                            [e.target.name]: e.target.value,
                        })
                    }
                    onSelectChange={(name, value) =>
                        setFormData({ ...formData, [name]: value })
                    }
                    onSubmit={handleSubmitAdd}
                    submitButtonText="Add Fund"
                />

                {/* Edit Fund Dialog */}
                <FormDialog
                    isOpen={isEditDialogOpen}
                    onOpenChange={(open) => !open && setIsEditDialogOpen(false)}
                    title="Edit Fund"
                    description="Update fund details"
                    fields={fundFormFields}
                    formData={formData}
                    onInputChange={(e) =>
                        setFormData({
                            ...formData,
                            [e.target.name]: e.target.value,
                        })
                    }
                    onSelectChange={(name, value) =>
                        setFormData({ ...formData, [name]: value })
                    }
                    onSubmit={handleSubmitEdit}
                    submitButtonText="Update Fund"
                    isEdit={true}
                />
            </div>
        </>
    );
}
