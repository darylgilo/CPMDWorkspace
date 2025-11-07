import React, { useState } from 'react';
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
    Package,
    PackageCheck,
    AlertTriangle,
    Calendar,
    Plus,
    Edit3,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import FormDialog, { type FormField } from '@/components/FormDialog';

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
        expiringSoon: number;
    };
    pesticideTypes: string[];
    sourcesOfFund: string[];
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
    } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(pesticides?.current_page || 1);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedPesticide, setSelectedPesticide] = useState<Pesticide | null>(null);
    const [currentTypeIndex, setCurrentTypeIndex] = useState(0);

    // Form field configuration for pesticides
    const pesticideFormFields: FormField[] = [
        { name: 'brand_name', label: 'Brand Name', type: 'text', required: true },
        { name: 'active_ingredient', label: 'Active Ingredient', type: 'text', required: true },
        { name: 'mode_of_action', label: 'Mode of Action', type: 'text', required: true },
        { name: 'type_of_pesticide', label: 'Type of Pesticide', type: 'datalist', required: true, datalistOptions: pesticideTypes },
        { name: 'unit', label: 'Unit', type: 'text', required: true, placeholder: 'e.g., Liters, Kg, Bottles' },
        { name: 'received_date', label: 'Received Date', type: 'date', required: true, gridCols: 1 },
        { name: 'production_date', label: 'Production Date', type: 'date', required: true, gridCols: 1 },
        { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
        { name: 'source_of_fund', label: 'Source of Fund', type: 'datalist', required: true, datalistOptions: sourcesOfFund },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, step: '0.01', min: '0' },
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

    const handleEdit = (pesticide: Pesticide) => {
        setSelectedPesticide(pesticide);
        setFormData({
            brand_name: pesticide.brand_name,
            active_ingredient: pesticide.active_ingredient,
            mode_of_action: pesticide.mode_of_action,
            type_of_pesticide: pesticide.type_of_pesticide,
            unit: pesticide.unit,
            received_date: pesticide.received_date,
            production_date: pesticide.production_date,
            expiry_date: pesticide.expiry_date,
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

    const handleSubmitAdd = () => {
        router.post('/pesticides', formData, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                resetForm();
            },
        });
    };

    const handleSubmitEdit = () => {
        if (selectedPesticide) {
            router.put(`/pesticides/${selectedPesticide.id}`, formData, {
                onSuccess: () => {
                    setIsEditDialogOpen(false);
                    resetForm();
                    setSelectedPesticide(null);
                },
            });
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get('/pesticidesindex', { tab: 'inventory', search: searchValue, perPage, page }, { preserveState: true, replace: true });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handlePrevType = () => {
        setCurrentTypeIndex((prev) => 
            prev === 0 ? (analytics?.typeStatistics?.length || 1) - 1 : prev - 1
        );
    };

    const handleNextType = () => {
        setCurrentTypeIndex((prev) => 
            prev === (analytics?.typeStatistics?.length || 1) - 1 ? 0 : prev + 1
        );
    };

    const currentTypeStat = analytics?.typeStatistics?.[currentTypeIndex];

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
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    {/* Pesticide Type Carousel */}
                    {analytics?.typeStatistics && analytics.typeStatistics.length > 0 && currentTypeStat && (
                        <div className="relative rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-white/80 md:text-sm">{currentTypeStat.type}</p>
                                    <p className="text-xl font-bold text-white">Stock: {currentTypeStat.totalStock}</p>
                                </div>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                    <Package className="h-4 w-4 text-green-600 md:h-6 md:w-6 dark:text-[#DAF1DE]" />
                                </div>
                            </div>
                            {/* Carousel Controls */}
                            {analytics.typeStatistics.length > 1 && (
                                <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                                    <button
                                        onClick={handlePrevType}
                                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                                        aria-label="Previous type"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div className="flex gap-1">
                                        {analytics.typeStatistics.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentTypeIndex(index)}
                                                className={`h-1.5 w-1.5 rounded-full transition-all ${
                                                    index === currentTypeIndex
                                                        ? 'w-4 bg-white'
                                                        : 'bg-white/40 hover:bg-white/60'
                                                }`}
                                                aria-label={`Go to type ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleNextType}
                                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                                        aria-label="Next type"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Total Stock */}
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm">Total Stock</p>
                                <p className="text-xl font-bold text-white md:text-3xl">{analytics?.totalStock || 0}</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 md:h-12 md:w-12 dark:bg-green-900/20">
                                <PackageCheck className="h-4 w-4 text-green-600 md:h-6 md:w-6 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Low Stock */}
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm">Low Stock</p>
                                <p className="text-xl font-bold text-white md:text-3xl">{analytics?.lowStock || 0}</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 md:h-12 md:w-12 dark:bg-yellow-900/20">
                                <AlertTriangle className="h-4 w-4 text-yellow-600 md:h-6 md:w-6 dark:text-yellow-400" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Expiring Soon */}
                    <div className="rounded-lg border border-gray-200 bg-[#163832] p-3 text-white shadow-lg md:rounded-xl md:p-6 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-white/80 md:text-sm">Expiring Soon</p>
                                <p className="text-xl font-bold text-white md:text-3xl">{analytics?.expiringSoon || 0}</p>
                                <p className="hidden text-xs text-white/70 md:block">Within 3 months</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 md:h-12 md:w-12 dark:bg-red-900/20">
                                <Calendar className="h-4 w-4 text-red-600 md:h-6 md:w-6 dark:text-red-400" />
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
                                <span className="hidden md:inline">Add Pesticide</span>
                            </Button>
                            <div className="flex items-center gap-2">
                                <label htmlFor="entries" className="font-medium">Show</label>
                                <Select value={perPage.toString()} onValueChange={(value) => { const newPerPage = parseInt(value, 10); setPerPage(newPerPage); router.get('/pesticidesindex', { tab: 'inventory', search: searchValue, perPage: newPerPage }, { preserveState: true, replace: true }); }}>
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
                            <SearchBar search={searchValue} onSearchChange={setSearchValue} placeholder="Search pesticides..." className="w-full md:max-w-md" searchRoute="/pesticidesindex" additionalParams={{ tab: 'inventory', perPage }} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                    <TableHead className="font-semibold">Brand Name</TableHead>
                                    <TableHead className="font-semibold">Active Ingredient</TableHead>
                                    <TableHead className="font-semibold">Mode of Action</TableHead>
                                    <TableHead className="font-semibold">Type</TableHead>
                                    <TableHead className="font-semibold">Unit</TableHead>
                                    <TableHead className="font-semibold">Received Date</TableHead>
                                    <TableHead className="font-semibold">Expiry Date</TableHead>
                                    <TableHead className="font-semibold">Source of Fund</TableHead>
                                    <TableHead className="font-semibold">Quantity</TableHead>
                                    <TableHead className="font-semibold">Stock</TableHead>
                                    <TableHead className="text-center font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pesticides?.data && pesticides.data.length > 0 ? (
                                    pesticides.data.map((pesticide) => (
                                        <TableRow key={pesticide.id}>
                                            <TableCell>{pesticide.brand_name}</TableCell>
                                            <TableCell>{pesticide.active_ingredient}</TableCell>
                                            <TableCell>{pesticide.mode_of_action}</TableCell>
                                            <TableCell>{pesticide.type_of_pesticide}</TableCell>
                                            <TableCell>{pesticide.unit}</TableCell>
                                            <TableCell>{formatDate(pesticide.received_date)}</TableCell>
                                            <TableCell>{formatDate(pesticide.expiry_date)}</TableCell>
                                            <TableCell>{pesticide.source_of_fund}</TableCell>
                                            <TableCell>{pesticide.quantity}</TableCell>
                                            <TableCell className={pesticide.stock < 10 ? 'font-semibold text-red-600' : ''}>{pesticide.stock}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(pesticide)} className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950">
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(pesticide.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center">No pesticides found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4">
                        <CustomPagination currentPage={currentPage} totalItems={pesticides?.total || 0} perPage={perPage} onPageChange={handlePageChange} />
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
                onSelectChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
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
                    setFormData(prev => ({ ...prev, [name]: value }));
                }}
                onSelectChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
                fields={pesticideFormFields}
                title="Edit Pesticide"
                description="Update the pesticide information."
                submitButtonText="Update Pesticide"
                isEdit
            />
        </>
    );
}
