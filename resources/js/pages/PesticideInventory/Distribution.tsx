import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TruckIcon,
    PackageMinus,
    Calendar,
    TrendingUp,
    Plus,
    Edit3,
    Trash2,
    MoreVertical,
} from 'lucide-react';
import TableExport from '@/components/TableExport';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FormDialog, { type FormField } from '@/components/FormDialog';

interface PesticideType {
    id: string;
    type_of_pesticide: string;
    stock: number;
}

interface Distribution {
    id: number;
    pesticide_id: number;
    brand_name: string;
    type_of_pesticide: string;
    quantity: number;
    travel_purpose: string;
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
        thisMonth: number;
        thisWeek: number;
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

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(distributions?.current_page || 1);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null);
    const [sortField, setSortField] = useState<string>('received_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Form field configuration for distributions
    const distributionFormFields: FormField[] = [
        {
            name: 'pesticide_type',
            label: 'Select Pesticide Type',
            type: 'select',
            required: true,
            options: (pesticides || []).map((p) => ({
                value: p.type_of_pesticide,
                label: `${p.type_of_pesticide} (Stock: ${p.stock})`,
            })),
            customRender: (value: string) => {
                const selectedPesticideType = (pesticides || []).find((p) => p.type_of_pesticide === value);
                return selectedPesticideType ? (
                    <p className="text-sm text-muted-foreground">
                        Available stock: <span className="font-semibold">{selectedPesticideType.stock}</span>
                    </p>
                ) : null;
            },
        },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, step: '0.01', min: '0.01' },
        { name: 'travel_purpose', label: 'Travel Purpose', type: 'text', required: true, placeholder: 'e.g., Field Visit, Training, Distribution' },
        { name: 'received_by', label: 'Received By', type: 'text', required: true, placeholder: 'Name of recipient' },
        { name: 'received_date', label: 'Received Date', type: 'date', required: true },
    ];

    const [formData, setFormData] = useState({
        pesticide_type: '',
        quantity: '',
        travel_purpose: '',
        received_by: '',
        received_date: '',
    });

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            pesticide_type: '',
            quantity: '',
            travel_purpose: '',
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
            pesticide_type: distribution.type_of_pesticide,
            quantity: distribution.quantity.toString(),
            travel_purpose: distribution.travel_purpose,
            received_by: distribution.received_by,
            received_date: formatDateForInput(distribution.received_date),
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this distribution record?')) {
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
        router.get('/pesticidesindex', { tab: 'distribution', search: searchValue, perPage, page, sort: sortField, direction: sortDirection }, { preserveState: true, replace: true });
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
                direction: sortDirection
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSort = (field: string) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
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
                page: 1
            },
            { preserveState: true, replace: true }
        );
    };

    // Sort the data client-side
    const sortedDistributions = useMemo(() => {
        if (!distributions?.data) return [];
        
        return [...distributions.data].sort((a, b) => {
            let aValue = a[sortField as keyof Distribution];
            let bValue = b[sortField as keyof Distribution];
            
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
        if (sortField !== field) return <ChevronUp className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-50" />;
        return sortDirection === 'asc' ?
            <ChevronUp className="ml-1 h-3 w-3" /> :
            <ChevronDown className="ml-1 h-3 w-3" />;
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
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm">Total Distributions</p>
                                <p className="text-xl font-bold text-white md:text-3xl">{analytics?.totalDistributions || 0}</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                <TruckIcon className="h-4 w-4 text-green-600 md:h-6 md:w-6 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm">Total Distributed</p>
                                <p className="text-xl font-bold text-white md:text-3xl">{analytics?.totalDistributed || 0}</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                <PackageMinus className="h-4 w-4 text-green-600 md:h-6 md:w-6 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm">This Month</p>
                                <p className="text-xl font-bold text-white md:text-3xl">{analytics?.thisMonth || 0}</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 md:h-12 md:w-12 dark:bg-blue-900/20">
                                <Calendar className="h-4 w-4 text-blue-600 md:h-6 md:w-6 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm">This Week</p>
                                <p className="text-xl font-bold text-white md:text-3xl">{analytics?.thisWeek || 0}</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 md:h-12 md:w-12 dark:bg-purple-900/20">
                                <TrendingUp className="h-4 w-4 text-purple-600 md:h-6 md:w-6 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="relative min-h-[100vh] flex-1 overflow-x-auto rounded-xl border-t-4 border-r border-b border-l border-gray-200 border-t-[#163832] bg-white p-4 shadow-sm md:min-h-min dark:border-neutral-600 dark:border-t-[#235347] dark:bg-neutral-900">
                    {/* Controls */}
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-start">
                            <Button onClick={handleAdd} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 md:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90">
                                <Plus className="h-4 w-4" />
                                <span className="hidden md:inline">Add Distribution</span>
                            </Button>
                            <div className="flex items-center gap-2">
                                <label htmlFor="entries" className="font-medium">Show</label>
                                <Select value={perPage.toString()} onValueChange={(value) => { const newPerPage = parseInt(value, 10); setPerPage(newPerPage); router.get('/pesticidesindex', { tab: 'distribution', search: searchValue, perPage: newPerPage, sort: sortField, direction: sortDirection }, { preserveState: true, replace: true }); }}>
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
                                onSearchChange={handleSearchChange} 
                                placeholder="Search distributions..." 
                                className="w-full md:max-w-md" 
                                searchRoute="/pesticidesindex" 
                                additionalParams={{ tab: 'distribution', perPage, sort: sortField, direction: sortDirection }} 
                            />
                            <TableExport 
                                data={distributions.data} 
                                filename="distribution-records"
                                headers={[
                                    { key: 'brand_name', label: 'Brand Name' },
                                    { key: 'type_of_pesticide', label: 'Type' },
                                    { key: 'quantity', label: 'Quantity' },
                                    { key: 'travel_purpose', label: 'Purpose' },
                                    { key: 'received_by', label: 'Received By' },
                                    { key: 'received_date', label: 'Date Received' }
                                ]}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 bg-white hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
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
                                        onClick={() => handleSort('type_of_pesticide')}
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
                                        onClick={() => handleSort('travel_purpose')}
                                    >
                                        <div className="flex items-center">
                                            Travel Purpose
                                            <SortIndicator field="travel_purpose" />
                                        </div>
                                    </TableHead>
                                    <TableHead 
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('received_by')}
                                    >
                                        <div className="flex items-center">
                                            Received By
                                            <SortIndicator field="received_by" />
                                        </div>
                                    </TableHead>
                                    <TableHead 
                                        className="cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('received_date')}
                                    >
                                        <div className="flex items-center">
                                            Received Date
                                            <SortIndicator field="received_date" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {distributions?.data && distributions.data.length > 0 ? (
                                    sortedDistributions.map((distribution) => (
                                        <TableRow key={distribution.id}>
                                            <TableCell>{distribution.brand_name}</TableCell>
                                            <TableCell>{distribution.type_of_pesticide}</TableCell>
                                            <TableCell>{distribution.quantity}</TableCell>
                                            <TableCell>{distribution.travel_purpose}</TableCell>
                                            <TableCell>{distribution.received_by}</TableCell>
                                            <TableCell>{formatDate(distribution.received_date)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon-sm" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem 
                                                                onClick={() => handleEdit(distribution)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit3 className="mr-2 h-4 w-4" />
                                                                <span>Edit</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDelete(distribution.id)}
                                                                className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Delete</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">No distributions found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4">
                        <CustomPagination currentPage={currentPage} totalItems={distributions?.total || 0} perPage={perPage} onPageChange={handlePageChange} />
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
                    setFormData(prev => ({ ...prev, [name]: value }));
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
                    setFormData(prev => ({ ...prev, [name]: value }));
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
