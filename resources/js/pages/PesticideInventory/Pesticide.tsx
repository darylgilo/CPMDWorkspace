import CustomPagination from '@/components/CustomPagination';
import ExportPesticide from '@/components/export/ExportPesticide';
import FormDialog, { type FormField } from '@/components/FormDialog';
import SearchBar from '@/components/SearchBar';
import SimpleCarouselStat from '@/components/SimpleCarouselStat';
import SimpleStatistic from '@/components/SimpleStatistic';
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
    ChevronDown,
    ChevronUp,
    Edit3,
    MoreVertical,
    Package,
    PackageCheck,
    Plus,
    Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Pesticide {
    id: number;
    brand_name: string;
    active_ingredient: string;
    mode_of_action: string;
    type_of_pesticide: string;
    unit: string;
    received_date: string;
    production_date: string;
    expiry_date: string;
    source_of_fund: string;
    quantity: number;
    stock: number;
    user_id: number;
}

interface TypeStatistic {
    type: string;
    count: number;
    totalStock: number;
}

interface PageProps {
    pesticides: {
        data: Pesticide[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search: string;
    perPage: number;
    pesticideAnalytics: {
        typeStatistics: TypeStatistic[];
        totalStock: number;
        lowStock: number;
        thisYearStock: number;
    };
    pesticideTypes: string[];
    sourcesOfFund: string[];
    brandNames: string[];
    [key: string]: unknown;
}

export default function PesticideIndex() {
    const { props } = usePage<PageProps>();
    const {
        pesticides,
        search = '',
        perPage: perPageProp = 10,
        pesticideAnalytics: analytics,
        pesticideTypes = [],
        sourcesOfFund = [],
        brandNames = [],
    } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(
        pesticides?.current_page || 1,
    );
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedPesticide, setSelectedPesticide] =
        useState<Pesticide | null>(null);
    const [sortField, setSortField] = useState<string>('brand_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Form field configuration for pesticides
    const pesticideFormFields: FormField[] = [
        {
            name: 'brand_name',
            label: 'Brand Name',
            type: 'datalist',
            required: true,
            datalistOptions: brandNames,
            datalistId: 'brand-names',
        },
        {
            name: 'active_ingredient',
            label: 'Active Ingredient',
            type: 'text',
            required: true,
        },
        {
            name: 'mode_of_action',
            label: 'Mode of Action',
            type: 'text',
            required: true,
        },
        {
            name: 'type_of_pesticide',
            label: 'Type of Pesticide',
            type: 'datalist',
            required: true,
            datalistOptions: pesticideTypes,
        },
        {
            name: 'unit',
            label: 'Unit',
            type: 'text',
            required: true,
            placeholder: 'e.g., Liters, Kg, Bottles',
        },
        {
            name: 'received_date',
            label: 'Received Date',
            type: 'date',
            required: true,
            gridCols: 1,
        },
        {
            name: 'production_date',
            label: 'Production Date',
            type: 'date',
            required: true,
            gridCols: 1,
        },
        {
            name: 'expiry_date',
            label: 'Expiry Date',
            type: 'date',
            required: true,
        },
        {
            name: 'source_of_fund',
            label: 'Source of Fund',
            type: 'datalist',
            required: true,
            datalistOptions: sourcesOfFund,
        },
        {
            name: 'quantity',
            label: 'Quantity',
            type: 'number',
            required: true,
            step: '0.01',
            min: '0',
        },
    ];

    const [formData, setFormData] = useState({
        brand_name: '',
        active_ingredient: '',
        mode_of_action: '',
        type_of_pesticide: '',
        unit: '',
        received_date: '',
        production_date: '',
        expiry_date: '',
        source_of_fund: '',
        quantity: '',
    });

    const resetForm = () => {
        setFormData({
            brand_name: '',
            active_ingredient: '',
            mode_of_action: '',
            type_of_pesticide: '',
            unit: '',
            received_date: '',
            production_date: '',
            expiry_date: '',
            source_of_fund: '',
            quantity: '',
        });
    };

    const handleAdd = () => {
        resetForm();
        setIsAddDialogOpen(true);
    };

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const handleEdit = (pesticide: Pesticide) => {
        setSelectedPesticide(pesticide);
        setFormData({
            brand_name: pesticide.brand_name,
            active_ingredient: pesticide.active_ingredient,
            mode_of_action: pesticide.mode_of_action,
            type_of_pesticide: pesticide.type_of_pesticide,
            unit: pesticide.unit,
            received_date: formatDateForInput(pesticide.received_date),
            production_date: formatDateForInput(pesticide.production_date),
            expiry_date: formatDateForInput(pesticide.expiry_date),
            source_of_fund: pesticide.source_of_fund,
            quantity: pesticide.quantity.toString(),
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this pesticide?')) {
            router.delete(`/pesticides/${id}`);
        }
    };

    const handleSubmitAdd = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission

        // Format the form data before sending
        const formattedData = {
            ...formData,
            quantity: parseFloat(formData.quantity) || 0,
            received_date: formData.received_date
                ? new Date(formData.received_date).toISOString().split('T')[0]
                : '',
            production_date: formData.production_date
                ? new Date(formData.production_date).toISOString().split('T')[0]
                : '',
            expiry_date: formData.expiry_date
                ? new Date(formData.expiry_date).toISOString().split('T')[0]
                : '',
        };

        router.post('/pesticides', formattedData, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                resetForm();
                // Refresh the data by re-fetching the current page
                router.get(
                    '/pesticidesindex',
                    {
                        tab: 'inventory',
                        search: searchValue,
                        perPage,
                        page: currentPage,
                        sort: sortField,
                        direction: sortDirection,
                    },
                    {
                        preserveState: true,
                        onSuccess: () => {
                            // Force a hard refresh to ensure the UI updates
                            router.visit(window.location.pathname, {
                                only: ['pesticides', 'pesticideAnalytics'],
                                preserveState: true,
                                preserveScroll: true,
                            });
                        },
                    },
                );
            },
            onError: (errors) => {
                console.error('Error adding pesticide:', errors);
            },
        });
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission

        if (selectedPesticide) {
            // Format the form data before sending
            const formattedData = {
                ...formData,
                quantity: parseFloat(formData.quantity) || 0,
                received_date: formData.received_date
                    ? new Date(formData.received_date)
                          .toISOString()
                          .split('T')[0]
                    : '',
                production_date: formData.production_date
                    ? new Date(formData.production_date)
                          .toISOString()
                          .split('T')[0]
                    : '',
                expiry_date: formData.expiry_date
                    ? new Date(formData.expiry_date).toISOString().split('T')[0]
                    : '',
            };

            router.put(`/pesticides/${selectedPesticide.id}`, formattedData, {
                onSuccess: () => {
                    setIsEditDialogOpen(false);
                    resetForm();
                    setSelectedPesticide(null);
                    // Refresh the data
                    router.get(
                        '/pesticidesindex',
                        {
                            tab: 'inventory',
                            search: searchValue,
                            perPage,
                            page: currentPage,
                            sort: sortField,
                            direction: sortDirection,
                        },
                        { preserveState: true },
                    );
                },
                onError: (errors) => {
                    console.error('Error updating pesticide:', errors);
                },
            });
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/pesticidesindex',
            {
                tab: 'inventory',
                search: searchValue,
                perPage,
                page,
                sort: sortField,
                direction: sortDirection,
            },
            { preserveState: true, replace: true },
        );
    };

    // Handle sorting
    const handleSort = (field: string) => {
        const newDirection =
            sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        setCurrentPage(1);

        // Only update the URL with the sort parameters
        router.get(
            '/pesticidesindex',
            {
                tab: 'inventory',
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
    const sortedPesticides = useMemo(() => {
        if (!pesticides?.data) return [];

        return [...pesticides.data].sort((a, b) => {
            let aValue = a[sortField as keyof Pesticide];
            let bValue = b[sortField as keyof Pesticide];

            // Handle dates
            if (sortField.includes('_date') || sortField === 'expiry_date') {
                aValue = aValue ? new Date(aValue as string).getTime() : 0;
                bValue = bValue ? new Date(bValue as string).getTime() : 0;
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
    }, [pesticides, sortField, sortDirection]);

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Helper function to check if a date is within 2 months from now
    const isExpiringWithinTwoMonths = (expiryDateString: string) => {
        const expiryDate = new Date(expiryDateString);
        const today = new Date();
        const twoMonthsFromNow = new Date();
        twoMonthsFromNow.setMonth(today.getMonth() + 2);

        return expiryDate <= twoMonthsFromNow && expiryDate >= today;
    };

    // Show loading state if data is not yet available
    if (!pesticides) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">Loading pesticide data...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {/* Analytics Dashboard */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
                    {/* Pesticide Type Carousel */}
                    {analytics?.typeStatistics &&
                        analytics.typeStatistics.length > 0 && (
                            <SimpleCarouselStat
                                items={analytics.typeStatistics.map(
                                    (stat, index) => ({
                                        id: index,
                                        label: stat.type,
                                        value: `Stock: ${stat.totalStock}`,
                                        additionalContent:
                                            stat.totalStock < 20 ? (
                                                <p className="mt-1 text-xs font-semibold text-yellow-300">
                                                    Low stock
                                                </p>
                                            ) : undefined,
                                    }),
                                )}
                                icon={Package}
                            />
                        )}

                    {/* Total Stock */}
                    <SimpleStatistic
                        label="Total Stock"
                        value={analytics?.totalStock || 0}
                        icon={PackageCheck}
                    />

                    {/* Total Stock Added This Year */}
                    <SimpleStatistic
                        label="Total Stock Added This Year"
                        value={analytics?.thisYearStock || 0}
                        icon={Package}
                        subtitle="Based on received date this year"
                    />
                </div>

                {/* Table Container */}
                <div className="relative min-h-[100vh] flex-1 overflow-x-auto rounded-xl border-t-4 border-r border-b border-l border-gray-200 border-t-[#163832] bg-white p-4 shadow-sm md:min-h-min dark:border-neutral-600 dark:border-t-[#235347] dark:bg-neutral-900">
                    {/* Controls */}
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-start">
                            <Button
                                onClick={handleAdd}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Add Pesticide
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
                                            '/pesticidesindex',
                                            {
                                                tab: 'inventory',
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
                            <ExportPesticide
                                data={pesticides.data}
                                filename="pesticide-inventory"
                                headers={[
                                    { key: 'id', label: 'ID' },
                                    { key: 'brand_name', label: 'Brand Name' },
                                    { key: 'type_of_pesticide', label: 'Type' },
                                    {
                                        key: 'active_ingredient',
                                        label: 'Active Ingredient',
                                    },
                                    {
                                        key: 'mode_of_action',
                                        label: 'Mode of Action',
                                    },
                                    { key: 'unit', label: 'Unit' },
                                    {
                                        key: 'received_date',
                                        label: 'Received Date',
                                    },
                                    {
                                        key: 'expiry_date',
                                        label: 'Expiry Date',
                                    },
                                    { key: 'quantity', label: 'Quantity' },
                                ]}
                                variant="outline"
                                size="sm"
                                className="mr-2"
                            />
                            <SearchBar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                placeholder="Search pesticides..."
                                className="w-full md:max-w-md"
                                searchRoute="/pesticidesindex"
                                additionalParams={{ tab: 'inventory', perPage }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('brand_name')}
                                    >
                                        <div className="flex items-center">
                                            Brand Name
                                            <SortIndicator field="brand_name" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('active_ingredient')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Active Ingredient
                                            <SortIndicator field="active_ingredient" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('mode_of_action')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Mode of Action
                                            <SortIndicator field="mode_of_action" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('type_of_pesticide')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Type
                                            <SortIndicator field="type_of_pesticide" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('unit')}
                                    >
                                        <div className="flex items-center">
                                            Unit
                                            <SortIndicator field="unit" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('received_date')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Received Date
                                            <SortIndicator field="received_date" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('expiry_date')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Expiry Date
                                            <SortIndicator field="expiry_date" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('source_of_fund')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Source of Fund
                                            <SortIndicator field="source_of_fund" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('quantity')}
                                    >
                                        <div className="flex items-center">
                                            Quantity
                                            <SortIndicator field="quantity" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('stock')}
                                    >
                                        <div className="flex items-center">
                                            Stock
                                            <SortIndicator field="stock" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pesticides?.data &&
                                pesticides.data.length > 0 ? (
                                    sortedPesticides.map(
                                        (pesticide: Pesticide) => (
                                            <TableRow key={pesticide.id}>
                                                <TableCell>
                                                    {pesticide.brand_name}
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        pesticide.active_ingredient
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {pesticide.mode_of_action}
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        pesticide.type_of_pesticide
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {pesticide.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        pesticide.received_date,
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    className={
                                                        isExpiringWithinTwoMonths(
                                                            pesticide.expiry_date,
                                                        )
                                                            ? 'font-semibold text-orange-600 dark:text-orange-400'
                                                            : ''
                                                    }
                                                >
                                                    {formatDate(
                                                        pesticide.expiry_date,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {pesticide.source_of_fund}
                                                </TableCell>
                                                <TableCell>
                                                    {pesticide.quantity}
                                                </TableCell>
                                                <TableCell
                                                    className={
                                                        pesticide.stock === 0
                                                            ? 'font-semibold text-gray-500 dark:text-gray-400'
                                                            : pesticide.stock <
                                                                10
                                                              ? 'font-semibold text-red-600 dark:text-red-400'
                                                              : ''
                                                    }
                                                >
                                                    {pesticide.stock}
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
                                                                        Open
                                                                        menu
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
                                                                            pesticide,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                                    <span>
                                                                        Edit
                                                                    </span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            pesticide.id,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>
                                                                        Delete
                                                                    </span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={11}
                                            className="text-center"
                                        >
                                            No pesticides found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4">
                        <CustomPagination
                            currentPage={currentPage}
                            totalItems={pesticides?.total || 0}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            {/* Add Dialog */}
            <FormDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSubmit={handleSubmitAdd}
                formData={formData}
                onInputChange={(e) => {
                    const { name, value } = e.target;
                    setFormData((prev) => ({ ...prev, [name]: value }));
                }}
                onSelectChange={(name, value) =>
                    setFormData((prev) => ({ ...prev, [name]: value }))
                }
                fields={pesticideFormFields}
                title="Add New Pesticide"
                description="Fill in the details to add a new pesticide to the inventory."
                submitButtonText="Add Pesticide"
            />

            {/* Edit Dialog */}
            <FormDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSubmit={handleSubmitEdit}
                formData={formData}
                onInputChange={(e) => {
                    const { name, value } = e.target;
                    setFormData((prev) => ({ ...prev, [name]: value }));
                }}
                onSelectChange={(name, value) =>
                    setFormData((prev) => ({ ...prev, [name]: value }))
                }
                fields={pesticideFormFields}
                title="Edit Pesticide"
                description="Update the pesticide information."
                submitButtonText="Update Pesticide"
                isEdit
            />
        </>
    );
}
