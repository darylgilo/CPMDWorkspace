import CustomPagination from '@/components/CustomPagination';
import ExportPesticide from '@/components/export/ExportPesticide';
import FormDialog, { type FormField } from '@/components/FormDialog';
import PhilippineLocationSelector from '@/components/PhilippineLocationSelector';
import SearchBar from '@/components/SearchBar';
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
    Calendar,
    ChevronDown,
    ChevronUp,
    Edit3,
    MoreVertical,
    PackageMinus,
    Plus,
    Trash2,
    TruckIcon,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface PesticideType {
    id: string;
    brand_name: string;
    type_of_pesticide: string;
    stock: number;
    unit: string;
}

interface Distribution {
    id: number;
    pesticide_id: number;
    pesticide?: {
        id: number;
        brand_name: string;
        type_of_pesticide: string;
        unit: string;
    };
    quantity: number;
    travel_purpose: string;
    travel_location: string;
    region_id?: number | null;
    province_id?: number | null;
    municipality_id?: number | null;
    barangay_id?: number | null;
    received_by: string;
    received_date: string;
    user_id: number;
    created_at?: string;
}

interface PageProps {
    distributions: {
        data: Distribution[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    availablePesticides: PesticideType[];
    search: string;
    perPage: number;
    distributionAnalytics: {
        totalDistributions: number;
        totalDistributed: number;
        thisYear: number;
    };
    [key: string]: unknown;
}

export default function Distribution() {
    const { props } = usePage<PageProps>();
    const {
        distributions,
        availablePesticides: pesticides = [],
        search = '',
        perPage: perPageProp = 10,
        distributionAnalytics: analytics,
    } = props;

    // Debug: Log the pesticides data
    // console.log('Available Pesticides:', pesticides);

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(
        distributions?.current_page || 1,
    );
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedDistribution, setSelectedDistribution] =
        useState<Distribution | null>(null);
    const [sortField, setSortField] = useState<string>('received_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Form field configuration for distributions
    const distributionFormFields: FormField[] = [
        {
            name: 'pesticide_id',
            label: 'Select Pesticide',
            type: 'select',
            required: true,
            options: (pesticides || []).map((p) => {
                // Debug: Log each pesticide item with full details
                // console.log('Pesticide item:', JSON.stringify(p, null, 2));
                const displayName =
                    p?.brand_name ||
                    p?.type_of_pesticide ||
                    `Pesticide #${p?.id || '?'}`;
                const typeDisplay = p?.type_of_pesticide || 'N/A';
                return {
                    value: p?.id?.toString() || '',
                    // Include ID in the display to ensure uniqueness
                    label: `[${typeDisplay}] ${displayName} - ${p?.unit || 'N/A'} - STOCK: ${p?.stock || 0}`,
                    rawData: p,
                };
            }),
            customRender: (value: string) => {
                const selectedPesticide = (pesticides || []).find(
                    (p) => p.id.toString() === value,
                );
                if (!selectedPesticide) return null;
                const displayName =
                    selectedPesticide.brand_name ||
                    selectedPesticide.type_of_pesticide ||
                    'Unknown';
                return (
                    <div className="text-sm text-muted-foreground">
                        [{selectedPesticide.type_of_pesticide || 'N/A'}]{' '}
                        {displayName} - {selectedPesticide.unit || 'N/A'} -
                        STOCK: {selectedPesticide.stock || 0}
                    </div>
                );
            },
        },
        {
            name: 'quantity',
            label: 'Quantity',
            type: 'number',
            required: true,
            step: '0.01',
            min: '0.01',
            customRender: (
                value: string,
                onChange?: (value: string) => void,
            ) => {
                const selectedPesticide = (pesticides || []).find(
                    (p) => p.id.toString() === formData.pesticide_id,
                );
                const maxQuantity = selectedPesticide
                    ? selectedPesticide.stock
                    : 0;

                const handleChange = (
                    e: React.ChangeEvent<HTMLInputElement>,
                ) => {
                    if (onChange) {
                        onChange(e.target.value);
                    }
                };

                return (
                    <div>
                        <input
                            type="number"
                            value={value}
                            onChange={handleChange}
                            step="0.01"
                            min="0.01"
                            max={maxQuantity}
                            className="w-full rounded border p-2"
                            required
                        />
                        {selectedPesticide && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Max: {maxQuantity} {selectedPesticide.unit}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            name: 'travel_purpose',
            label: 'Travel Purpose',
            type: 'text',
            required: true,
            placeholder: 'e.g., Field Visit, Training, Distribution',
        },
        {
            name: 'travel_location',
            label: 'Travel Location',
            type: 'custom',
            required: true,
            customRender: (
                value: string,
                onChange?: (value: string) => void,
            ) => {
                return (
                    <PhilippineLocationSelector
                        value={value}
                        onChange={(location) => {
                            if (onChange) {
                                onChange(location);
                            }
                        }}
                        required={true}
                    />
                );
            },
        },
        {
            name: 'received_by',
            label: 'Received By',
            type: 'text',
            required: true,
            placeholder: 'Name of recipient',
        },
        {
            name: 'received_date',
            label: 'Received Date',
            type: 'date',
            required: true,
        },
    ];

    const [formData, setFormData] = useState({
        pesticide_id: '',
        quantity: '',
        travel_purpose: '',
        travel_location: '',
        received_by: '',
        received_date: '',
    });

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Reset quantity when changing pesticide to prevent invalid values
            ...(name === 'pesticide_id' ? { quantity: '' } : {}),
        }));
    };

    const resetForm = () => {
        setFormData({
            pesticide_id: '',
            quantity: '',
            travel_purpose: '',
            travel_location: '',
            received_by: '',
            received_date: '',
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

    const handleEdit = (distribution: Distribution) => {
        setSelectedDistribution(distribution);
        setFormData({
            pesticide_id: distribution.pesticide_id.toString(),
            quantity: distribution.quantity.toString(),
            travel_purpose: distribution.travel_purpose,
            travel_location: distribution.travel_location || '',
            received_by: distribution.received_by,
            received_date: formatDateForInput(distribution.received_date),
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (
            window.confirm(
                'Are you sure you want to delete this distribution record?',
            )
        ) {
            router.delete(`/distributions/${id}`);
        }
    };

    const handleSubmitAdd = () => {
        router.post('/distributions', formData, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                resetForm();
            },
        });
    };

    const handleSubmitEdit = () => {
        if (selectedDistribution) {
            router.put(`/distributions/${selectedDistribution.id}`, formData, {
                onSuccess: () => {
                    setIsEditDialogOpen(false);
                    resetForm();
                    setSelectedDistribution(null);
                },
            });
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/pesticidesindex',
            {
                tab: 'distribution',
                search: searchValue,
                perPage,
                page,
                sort: sortField,
                direction: sortDirection,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        setCurrentPage(1);
        router.get(
            '/pesticidesindex',
            {
                tab: 'distribution',
                search: value,
                perPage,
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

        // Update URL with sort parameters
        router.get(
            '/pesticidesindex',
            {
                tab: 'distribution',
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
    const sortedDistributions = useMemo(() => {
        if (!distributions?.data) return [];

        return [...distributions.data].sort((a, b) => {
            let aValue: string | number | null = null;
            let bValue: string | number | null = null;

            // Handle nested properties
            if (
                sortField === 'brand_name' ||
                sortField === 'type_of_pesticide'
            ) {
                aValue = a.pesticide
                    ? a.pesticide[sortField as keyof typeof a.pesticide]
                    : '';
                bValue = b.pesticide
                    ? b.pesticide[sortField as keyof typeof b.pesticide]
                    : '';
            } else {
                aValue = a[sortField as keyof Distribution] as
                    | string
                    | number
                    | null;
                bValue = b[sortField as keyof Distribution] as
                    | string
                    | number
                    | null;
            }

            // Handle dates
            if (sortField === 'received_date' || sortField === 'created_at') {
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
    }, [distributions, sortField, sortDirection]);

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

    // Show loading state if data is not yet available
    if (!distributions) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">Loading distribution data...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {/* Analytics Dashboard */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
                    <SimpleStatistic
                        label="Total Distributions"
                        value={analytics?.totalDistributions || 0}
                        icon={TruckIcon}
                    />
                    <SimpleStatistic
                        label="Total Distributed Pesticide Stock"
                        value={analytics?.totalDistributed || 0}
                        icon={PackageMinus}
                    />
                    <SimpleStatistic
                        label="Total Pesticide Distributed This Year"
                        value={analytics?.thisYear || 0}
                        icon={Calendar}
                        subtitle="Based on quantity of pesticide distributed this year"
                        iconBackgroundColor="bg-blue-100 dark:bg-blue-900/20"
                        iconColor="text-blue-600 dark:text-blue-400"
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
                                    Add Distribution
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
                                                tab: 'distribution',
                                                search: searchValue,
                                                perPage: newPerPage,
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
                                data={distributions.data}
                                filename="pesticide-distributions"
                                headers={[
                                    { key: 'id', label: 'ID' },
                                    {
                                        key: 'pesticide.brand_name',
                                        label: 'Brand Name',
                                    },
                                    {
                                        key: 'pesticide.type_of_pesticide',
                                        label: 'Type',
                                    },
                                    { key: 'quantity', label: 'Quantity' },
                                    { key: 'pesticide.unit', label: 'Unit' },
                                    {
                                        key: 'received_date',
                                        label: 'Date Distributed',
                                    },
                                    {
                                        key: 'received_by',
                                        label: 'Received By',
                                    },
                                    { key: 'travel_purpose', label: 'Purpose' },
                                    {
                                        key: 'travel_location',
                                        label: 'Travel Location',
                                    },
                                ]}
                                variant="outline"
                                size="sm"
                                className="mr-2"
                            />
                            <SearchBar
                                search={searchValue}
                                onSearchChange={handleSearchChange}
                                placeholder="Search distributions..."
                                className="w-full md:max-w-md"
                                searchRoute="/pesticidesindex"
                                additionalParams={{
                                    tab: 'distribution',
                                    perPage,
                                    sort: sortField,
                                    direction: sortDirection,
                                }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                    <TableHead
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('brand_name')}
                                    >
                                        <div className="flex items-center">
                                            Brand Name
                                            <SortIndicator field="brand_name" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('type_of_pesticide')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Type of Pesticide
                                            <SortIndicator field="type_of_pesticide" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('quantity')}
                                    >
                                        <div className="flex items-center">
                                            Quantity
                                            <SortIndicator field="quantity" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('travel_purpose')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Travel Purpose
                                            <SortIndicator field="travel_purpose" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('travel_location')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Travel Location
                                            <SortIndicator field="travel_location" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('received_by')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Received By
                                            <SortIndicator field="received_by" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('received_date')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Received Date
                                            <SortIndicator field="received_date" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {distributions?.data &&
                                distributions.data.length > 0 ? (
                                    sortedDistributions.map((distribution) => (
                                        <TableRow key={distribution.id}>
                                            <TableCell>
                                                {distribution.pesticide
                                                    ?.brand_name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {distribution.pesticide
                                                    ?.type_of_pesticide ||
                                                    'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {distribution.quantity}
                                            </TableCell>
                                            <TableCell>
                                                {distribution.travel_purpose}
                                            </TableCell>
                                            <TableCell>
                                                {distribution.travel_location}
                                            </TableCell>
                                            <TableCell>
                                                {distribution.received_by}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    distribution.received_date,
                                                )}
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
                                                                        distribution,
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
                                                                        distribution.id,
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
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center"
                                        >
                                            No distributions found.
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
                            totalItems={distributions?.total || 0}
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
                onSelectChange={handleSelectChange}
                fields={distributionFormFields}
                title="Add New Distribution"
                description="Fill in the details to record a new distribution."
                submitButtonText="Add Distribution"
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
                onSelectChange={handleSelectChange}
                fields={distributionFormFields}
                title="Edit Distribution"
                description="Update the distribution information."
                submitButtonText="Update Distribution"
                isEdit
            />
        </>
    );
}
