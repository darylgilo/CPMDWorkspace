import SearchBar from '@/components/SearchBar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import ExportPPMP from '@/components/export/ExportPPMP';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
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
import {
    Fund,
    FundingDetail,
    PaginatedData,
    PPMPProject,
    Timeline,
} from '@/types/ppmp';
import { router, usePage } from '@inertiajs/react';
import {
    Edit3,
    MinusCircle,
    MoreVertical,
    PenTool,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

export default function PPMP() {
    const { showSuccess, showError, showDeleted } = usePopupAlert();
    const props = usePage().props;
    const funds = props.funds as unknown as PaginatedData<Fund>;
    const ppmpItems = props.ppmpItems as unknown as PaginatedData<PPMPProject>;

    // Expense categories for dropdown
    const expenseCategories = [
        'Communication & Delivery',
        'Electricity Expenses',
        'Fuel, Oil and Lubricants Expenses',
        'Insurance Expenses',
        'Internet Subscription Expenses',
        'Janitorial Services',
        'Mobile Expenses',
        'Office Supplies Expenses',
        'Postage and Courier Services',
        'Printing and Publication Expenses',
        'Procurement of Agricultural and Marine Supplies Expenses',
        'Procurement of Chemical and Filtering Supplies Expenses',
        'Procurement of Other Supplies and Materials Expenses',
        'Professional & General Services',
        'Repairs and Maintenance',
        'Repairs and Maintenance Motor Vehicles',
        'Repairs and Maintenance Technical and Scientific Equipment',
        'Representation Expenses',
        'Security Services',
        'Semi-Expendable Property',
        'Semi-Expendable ICT Equipment',
        'Semi-Expendable Technical and Scientific Equipment',
        'Supplies and Materials Expenses',
        'Training & Representation',
        'Training Expenses',
        'Travelling Expenses - Foreign',
        'Travelling Expenses - Local',
        'Utilities Expenses',
        'Water Expenses',
        'Other MOOE',
        'Others',
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeFundId, setActiveFundId] = useState<number | null>(null);
    const [isPPMPDialogOpen, setIsPPMPDialogOpen] = useState(false);
    const [isEditPPMPDialogOpen, setIsEditPPMPDialogOpen] = useState(false);
    const [isFundingDetailsDialogOpen, setIsFundingDetailsDialogOpen] =
        useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPPMPItem, setSelectedPPMPItem] =
        useState<PPMPProject | null>(null);
    const [selectedExistingProject, setSelectedExistingProject] =
        useState<PPMPProject | null>(null);
    const [selectedExistingQuantity, setSelectedExistingQuantity] =
        useState<FundingDetail | null>(null);
    const [selectedFundingDetail, setSelectedFundingDetail] =
        useState<FundingDetail | null>(null);
    const [highlightedSubtotals, setHighlightedSubtotals] = useState<
        Set<string>
    >(new Set());
    const [isCustomDescription, setIsCustomDescription] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<'ppmp' | 'funding-detail' | null>(null);

    const formatCurrency = (amount: number | undefined | null) => {
        const val = amount || 0;
        return `₱ ${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })} `;
    };

    const [ppmpFormData, setPpmpFormData] = useState({
        fund_id: '',
        general_description: '',
        project_type: '',
    });

    const [fundingDetailsFormData, setFundingDetailsFormData] = useState({
        quantities: [{ quantity_size: '' }],
        timelines: [
            {
                start_procurement: '',
                end_procurement: '',
                delivery_period: '',
            },
        ],
        mode_of_procurement: '',
        pre_procurement_conference: 'No',
        estimated_budget: '',
        supporting_documents: '',
        remarks: '',
    });

    const resetPPMPForm = () => {
        setPpmpFormData({
            fund_id: '',
            general_description: '',
            project_type: '',
        });
        setSelectedPPMPItem(null);
        setIsCustomDescription(false);
    };

    const handleAddPPMP = (fund: Fund) => {
        // Reset PPMP form data for new project
        setPpmpFormData({
            fund_id: fund.id.toString(),
            general_description: '',
            project_type: '',
        });
        setIsCustomDescription(false);

        // Reset funding details form data for new project
        setFundingDetailsFormData({
            quantities: [{ quantity_size: '' }],
            mode_of_procurement: '',
            pre_procurement_conference: 'No',
            estimated_budget: '',
            supporting_documents: '',
            remarks: '',
            timelines: [
                {
                    start_procurement: '',
                    end_procurement: '',
                    delivery_period: '',
                },
            ],
        });

        // Reset selected existing project and quantity
        setSelectedExistingProject(null);
        setSelectedExistingQuantity(null);

        setIsPPMPDialogOpen(true);
    };

    const updateQuantity = (index: number, value: string) => {
        const newQuantities = [...fundingDetailsFormData.quantities];
        newQuantities[index] = { quantity_size: value };
        setFundingDetailsFormData({
            ...fundingDetailsFormData,
            quantities: newQuantities,
        });
    };

    const addTimeline = () => {
        setFundingDetailsFormData({
            ...fundingDetailsFormData,
            timelines: [
                ...fundingDetailsFormData.timelines,
                {
                    start_procurement: '',
                    end_procurement: '',
                    delivery_period: '',
                },
            ],
        });
    };

    const removeTimeline = (index: number) => {
        if (fundingDetailsFormData.timelines.length > 1) {
            const newTimelines = fundingDetailsFormData.timelines.filter(
                (_, i) => i !== index,
            );
            setFundingDetailsFormData({
                ...fundingDetailsFormData,
                timelines: newTimelines,
            });
        }
    };

    const updateTimeline = (index: number, field: string, value: string) => {
        const newTimelines = [...fundingDetailsFormData.timelines];
        newTimelines[index] = { ...newTimelines[index], [field]: value };
        setFundingDetailsFormData({
            ...fundingDetailsFormData,
            timelines: newTimelines,
        });
    };

    const handleSubmitFundingDetails = () => {
        setIsSubmitting(true);
        // Handle adding funding details to existing project from Add dialog
        if (selectedExistingProject) {
            // If we have selected an existing quantity, we're updating it
            if (selectedExistingQuantity) {
                // Update existing funding detail
                const fundingData = {
                    ...fundingDetailsFormData,
                    ppmp_project_id: selectedExistingProject.id,
                };

                router.put(
                    `/budgetmanagement/ppmp/funding-details/${selectedExistingQuantity.id}`,
                    fundingData,
                    {
                        onSuccess: () => {
                            showSuccess(
                                'Funding Details Updated',
                                'Funding details have been successfully updated.',
                            );
                            setIsPPMPDialogOpen(false);
                            setSelectedExistingProject(null);
                            setSelectedExistingQuantity(null);
                        },
                        onError: (errors) => {
                            showError(
                                'Update Failed',
                                'Unable to update funding details. Please try again.',
                            );
                            console.error(
                                'Error updating funding details:',
                                errors,
                            );
                        },
                        onFinish: () => setIsSubmitting(false),
                    },
                );
            } else {
                // Check if we're editing an existing funding detail or creating a new one
                const existingDetail =
                    selectedExistingProject.funding_details?.find(
                        (detail: FundingDetail) =>
                            detail.quantity_size ===
                            fundingDetailsFormData.quantities[0]?.quantity_size,
                    );

                if (existingDetail) {
                    // Update existing funding detail
                    const fundingData = {
                        ...fundingDetailsFormData,
                        ppmp_project_id: selectedExistingProject.id,
                    };

                    router.put(
                        `/budgetmanagement/ppmp/funding-details/${existingDetail.id}`,
                        fundingData,
                        {
                            onSuccess: () => {
                                showSuccess(
                                    'Funding Details Updated',
                                    'Funding details have been successfully updated.',
                                );
                                setIsPPMPDialogOpen(false);
                                setSelectedExistingProject(null);
                                setSelectedExistingQuantity(null);
                            },
                            onError: (errors) => {
                                showError(
                                    'Update Failed',
                                    'Unable to update funding details. Please try again.',
                                );
                                console.error(
                                    'Error updating funding details:',
                                    errors,
                                );
                            },
                            onFinish: () => setIsSubmitting(false),
                        },
                    );
                } else {
                    // Create new funding detail
                    const fundingData = {
                        ...fundingDetailsFormData,
                        ppmp_project_id: selectedExistingProject.id,
                    };

                    router.post(
                        '/budgetmanagement/ppmp/funding-details',
                        fundingData,
                        {
                            onSuccess: () => {
                                showSuccess(
                                    'Funding Details Added',
                                    'New funding details have been successfully created.',
                                );
                                setIsPPMPDialogOpen(false);
                                setSelectedExistingProject(null);
                                setSelectedExistingQuantity(null);
                            },
                            onError: (errors) => {
                                showError(
                                    'Add Failed',
                                    'Unable to add funding details. Please try again.',
                                );
                                console.error(
                                    'Error adding funding details:',
                                    errors,
                                );
                            },
                            onFinish: () => setIsSubmitting(false),
                        },
                    );
                }
            }
            return;
        }

        // Handle editing funding details from Edit dialog
        if (selectedPPMPItem) {
            // Check if we're editing a specific funding detail
            if (selectedFundingDetail) {
                // Update the specific funding detail
                const fundingData = {
                    ...fundingDetailsFormData,
                    ppmp_project_id: selectedPPMPItem.id,
                };

                router.put(
                    `/budgetmanagement/ppmp/funding-details/${selectedFundingDetail.id}`,
                    fundingData,
                    {
                        onSuccess: () => {
                            setIsFundingDetailsDialogOpen(false);
                            setSelectedPPMPItem(null);
                            setSelectedFundingDetail(null);
                        },
                        onError: (errors) => {
                            showError(
                                'Update Failed',
                                'Unable to update funding details. Please try again.',
                            );
                            console.error(
                                'Error updating funding details:',
                                errors,
                            );
                        },
                        onFinish: () => setIsSubmitting(false),
                    },
                );
            } else {
                // Check if we're editing an existing funding detail or creating a new one
                const existingDetail = selectedPPMPItem.funding_details?.find(
                    (detail: FundingDetail) =>
                        detail.quantity_size ===
                        fundingDetailsFormData.quantities[0]?.quantity_size,
                );

                if (existingDetail) {
                    // Update existing funding detail
                    const fundingData = {
                        ...fundingDetailsFormData,
                        ppmp_project_id: selectedPPMPItem.id,
                    };

                    router.put(
                        `/budgetmanagement/ppmp/funding-details/${existingDetail.id}`,
                        fundingData,
                        {
                            onSuccess: () => {
                                setIsFundingDetailsDialogOpen(false);
                                setSelectedPPMPItem(null);
                            },
                            onError: (errors) => {
                                showError(
                                    'Update Failed',
                                    'Unable to update funding details. Please try again.',
                                );
                                console.error(
                                    'Error updating funding details:',
                                    errors,
                                );
                            },
                            onFinish: () => setIsSubmitting(false),
                        },
                    );
                } else {
                    // Create new funding detail
                    const fundingData = {
                        ...fundingDetailsFormData,
                        ppmp_project_id: selectedPPMPItem.id,
                    };

                    router.post(
                        '/budgetmanagement/ppmp/funding-details',
                        fundingData,
                        {
                            onSuccess: () => {
                                setIsFundingDetailsDialogOpen(false);
                                setSelectedPPMPItem(null);
                            },
                            onError: (errors) => {
                                showError(
                                    'Add Failed',
                                    'Unable to add funding details. Please try again.',
                                );
                                console.error(
                                    'Error adding funding details:',
                                    errors,
                                );
                            },
                            onFinish: () => setIsSubmitting(false),
                        },
                    );
                }
            }
        }
    };

    const handleSubmitPPMP = () => {
        setIsSubmitting(true);
        router.post('/budgetmanagement/ppmp', ppmpFormData, {
            onSuccess: () => {
                setIsPPMPDialogOpen(false);
                resetPPMPForm();
                showSuccess(
                    'PPMP Item Added',
                    'New PPMP item has been successfully added.',
                );
            },
            onError: (errors: Record<string, string>) => {
                console.error('Error adding PPMP item:', errors);
                showError(
                    'Add Failed',
                    'Unable to add PPMP item. Please check your input and try again.',
                );
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleEditPPMP = (project: PPMPProject) => {
        setSelectedPPMPItem(project);

        // If project has funding details, open the funding details dialog
        if (project.funding_details && project.funding_details.length > 0) {
            // Load the first funding detail's data into the form for editing
            // Don't mix data from different funding details
            const firstFundingDetail = project.funding_details?.[0];
            setFundingDetailsFormData({
                quantities: [
                    { quantity_size: firstFundingDetail.quantity_size || '' },
                ],
                mode_of_procurement:
                    firstFundingDetail.mode_of_procurement || '',
                pre_procurement_conference:
                    firstFundingDetail.pre_procurement_conference || 'No',
                estimated_budget:
                    firstFundingDetail.estimated_budget?.toString() || '0',
                supporting_documents:
                    firstFundingDetail.supporting_documents || '',
                remarks: firstFundingDetail.remarks || '',
                timelines: firstFundingDetail.timelines || [
                    {
                        start_procurement: '',
                        end_procurement: '',
                        delivery_period: '',
                    },
                ],
            });
            setIsFundingDetailsDialogOpen(true);
        } else {
            // If no funding details, open basic project edit dialog
            setPpmpFormData({
                fund_id: project.fund_id?.toString() || '',
                general_description: project.general_description || '',
                project_type: project.project_type || '',
            });
            setIsEditPPMPDialogOpen(true);
        }
    };

    const handleEditFundingDetail = (
        project: PPMPProject,
        fundingDetail: FundingDetail,
    ) => {
        setSelectedPPMPItem(project);
        setSelectedFundingDetail(fundingDetail);

        // Load the specific funding detail into the form
        setFundingDetailsFormData({
            quantities: [{ quantity_size: fundingDetail.quantity_size || '' }],
            mode_of_procurement: fundingDetail.mode_of_procurement || '',
            pre_procurement_conference:
                fundingDetail.pre_procurement_conference || 'No',
            estimated_budget: fundingDetail.estimated_budget?.toString() || '0',
            supporting_documents: fundingDetail.supporting_documents || '',
            remarks: fundingDetail.remarks || '',
            timelines: fundingDetail.timelines || [
                {
                    start_procurement: '',
                    end_procurement: '',
                    delivery_period: '',
                },
            ],
        });
        setIsFundingDetailsDialogOpen(true);
    };

    const handleDeleteFundingDetail = (fundingDetailId: number) => {
        setDeleteId(fundingDetailId);
        setDeleteType('funding-detail');
        setShowDeleteConfirm(true);
    };

    const loadHighlights = () => {
        fetch('/budgetmanagement/ppmp/highlights', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
            },
        })
            .then((response) => response.json())
            .then((highlights) => {
                const highlightedKeys = new Set<string>(
                    highlights
                        .filter((h: { status: string }) => h.status === 'FINAL')
                        .map((h: { project_key: string }) => h.project_key),
                );
                setHighlightedSubtotals(highlightedKeys);
            })
            .catch((errors) => {
                console.error('Error loading highlights:', errors);
            });
    };

    const toggleSubtotalHighlight = (projectKey: string, projectId: number) => {
        const isHighlighted = highlightedSubtotals.has(projectKey);

        if (isHighlighted) {
            // Remove highlight (set to INDICATIVE) - use POST to updateOrCreate
            router.post(
                '/budgetmanagement/ppmp/highlights',
                {
                    ppmp_project_id: projectId,
                    status: 'INDICATIVE',
                },
                {
                    onSuccess: () => {
                        setHighlightedSubtotals((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(projectKey);
                            return newSet;
                        });
                        // Reload highlights to get updated state from server
                        loadHighlights();
                    },
                    onError: (errors: Record<string, string>) => {
                        console.error('Error removing highlight:', errors);
                    },
                },
            );
        } else {
            // Add highlight (set to FINAL)
            router.post(
                '/budgetmanagement/ppmp/highlights',
                {
                    ppmp_project_id: projectId,
                    status: 'FINAL',
                },
                {
                    onSuccess: () => {
                        setHighlightedSubtotals((prev) => {
                            const newSet = new Set(prev);
                            newSet.add(projectKey);
                            return newSet;
                        });
                        // Reload highlights to get updated state from server
                        loadHighlights();
                    },
                    onError: (errors: Record<string, string>) => {
                        console.error('Error adding highlight:', errors);
                    },
                },
            );
        }
    };

    useEffect(() => {
        loadHighlights();
    }, []);

    const handleSubmitEditPPMP = () => {
        setIsSubmitting(true);
        if (!selectedPPMPItem) return;
        router.put(
            `/budgetmanagement/ppmp/${selectedPPMPItem.id}`,
            ppmpFormData,
            {
                onSuccess: () => {
                    setIsEditPPMPDialogOpen(false);
                    resetPPMPForm();
                    showSuccess(
                        'PPMP Updated',
                        'PPMP item has been successfully updated.',
                    );
                },
                onError: (errors) => {
                    console.error('Error updating PPMP item:', errors);
                    showError(
                        'Update Failed',
                        'Unable to update PPMP item. Please check your input and try again.',
                    );
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleDeletePPMP = (item: PPMPProject) => {
        setDeleteId(item.id);
        setDeleteType('ppmp');
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!deleteId || !deleteType) return;
        
        setIsSubmitting(true);
        setShowDeleteConfirm(false);

        if (deleteType === 'ppmp') {
            router.delete(`/budgetmanagement/ppmp/${deleteId}`, {
                onSuccess: () => {
                    showDeleted(
                        'PPMP Item Deleted',
                        'PPMP item has been successfully removed.',
                    );
                },
                onError: (errors) => {
                    console.error('Error deleting PPMP item:', errors);
                    showError(
                        'Delete Failed',
                        'Unable to delete PPMP item. Please try again.',
                    );
                },
                onFinish: () => setIsSubmitting(false),
            });
        } else if (deleteType === 'funding-detail') {
            router.delete(
                `/budgetmanagement/ppmp/funding-details/${deleteId}`,
                {
                    onSuccess: () => {
                        showDeleted(
                            'Funding Detail Deleted',
                            'Funding detail has been successfully removed.',
                        );
                        // Force a page reload to refresh the table data
                        router.reload();
                    },
                    onError: (errors) => {
                        console.error('Error deleting funding detail:', errors);
                        showError(
                            'Delete Failed',
                            'Unable to delete funding detail. Please try again.',
                        );
                    },
                    onFinish: () => setIsSubmitting(false),
                },
            );
        }
    };

    // Get available years from funds
    const availableYears = useMemo(() => {
        if (!funds?.data) return [];
        const years = [
            ...new Set(funds.data.map((fund: Fund) => fund.source_year)),
        ];
        return years.sort((a, b) => (b as number) - (a as number));
    }, [funds]);

    // Filter funds by selected year
    const filteredFunds = useMemo(() => {
        if (!funds?.data) return [];
        return funds.data.filter(
            (fund: Fund) => fund.source_year === selectedYear,
        );
    }, [funds, selectedYear]);

    // Set default fund when filtered funds change
    React.useEffect(() => {
        if (filteredFunds.length > 0 && !activeFundId) {
            setActiveFundId(filteredFunds[0].id);
        }
    }, [filteredFunds, activeFundId]);

    // Get current fund info
    const currentFund = filteredFunds.find((f: Fund) => f.id === activeFundId);

    // Filter PPMP items for current fund
    const fundPPMPItems = useMemo(() => {
        if (!ppmpItems?.data || !activeFundId) return [];
        return ppmpItems.data.filter(
            (item: PPMPProject) => item.fund_id === activeFundId,
        );
    }, [ppmpItems, activeFundId]);

    // Filter PPMP items based on search
    const filteredData = useMemo(() => {
        let filtered = fundPPMPItems;

        if (searchQuery) {
            filtered = filtered.filter(
                (project: PPMPProject) =>
                    project.general_description
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    project.project_type
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    project.funding_details?.some(
                        (detail: FundingDetail) =>
                            detail.quantity_size
                                ?.toLowerCase()
                                .includes(searchQuery.toLowerCase()) ||
                            detail.mode_of_procurement
                                ?.toLowerCase()
                                .includes(searchQuery.toLowerCase()),
                    ),
            );
        }

        // Sort by created_at to show first created project at the top
        return filtered.sort((a: PPMPProject, b: PPMPProject) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateA.getTime() - dateB.getTime();
        });
    }, [searchQuery, fundPPMPItems]);

    // Calculate total budget for current fund
    const totalBudget = useMemo(() => {
        let total = 0;
        fundPPMPItems.forEach((project: PPMPProject) => {
            project.funding_details?.forEach((detail: FundingDetail) => {
                total += parseFloat(String(detail.estimated_budget || 0));
            });
        });
        return total;
    }, [fundPPMPItems]);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        {/* Add PPMP Item Button */}
                        {currentFund && (
                            <Button
                                onClick={() => handleAddPPMP(currentFund)}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            >
                                <Plus className="h-4 w-4" />
                                Add PPMP Item
                            </Button>
                        )}

                        {/* Year Selection */}
                        <div className="flex items-center gap-2">
                            <label className="font-medium">Year:</label>
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(value) => {
                                    const newYear = parseInt(value);
                                    setSelectedYear(newYear);
                                    // Auto-select first fund when year changes
                                    const fundsForYear = funds?.data?.filter(
                                        (fund: Fund) =>
                                            fund.source_year === newYear,
                                    );
                                    if (
                                        fundsForYear &&
                                        fundsForYear.length > 0
                                    ) {
                                        setActiveFundId(fundsForYear[0].id);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[120px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    {availableYears.map((year) => (
                                        <SelectItem
                                            key={year as number}
                                            value={(year as number).toString()}
                                        >
                                            {year as number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fund Selection */}
                        <div className="flex items-center gap-2">
                            <label className="font-medium">Fund:</label>
                            <Select
                                value={activeFundId?.toString() || ''}
                                onValueChange={(value) => {
                                    setActiveFundId(parseInt(value));
                                }}
                            >
                                <SelectTrigger className="w-[250px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue>
                                        {currentFund
                                            ? currentFund.fund_name
                                            : 'Select a fund'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    {filteredFunds.map((fund: Fund) => (
                                        <SelectItem
                                            key={fund.id}
                                            value={fund.id.toString()}
                                        >
                                            {fund.fund_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Right side - Search and Export */}
                    <div className="flex items-center gap-2">
                        <SearchBar
                            search={searchQuery}
                            onSearchChange={setSearchQuery}
                            placeholder="Search PPMP items..."
                            className="w-[300px]"
                        />
                        <ExportPPMP
                            data={filteredData}
                            fundName={currentFund?.fund_name || ''}
                            year={selectedYear}
                        />
                    </div>
                </div>

                {/* Fund Info */}
                {currentFund && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Year:{' '}
                                    <span className="font-semibold">
                                        {selectedYear}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold">
                                    {currentFund.fund_name}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PPMP Table */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-center text-lg font-bold">
                        PROCUREMENT PROJECT MANAGEMENT PLAN (PPMP)
                    </CardTitle>
                    <CardDescription className="text-center">
                        Fiscal Year {selectedYear}
                    </CardDescription>
                </CardHeader>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                <TableHead
                                    className="border border-gray-200 p-2 text-center text-xs font-bold dark:border-neutral-700"
                                    colSpan={5}
                                >
                                    PROCUREMENT PROJECT DETAILS
                                </TableHead>
                                <TableHead
                                    className="border border-gray-200 p-2 text-center text-xs font-bold dark:border-neutral-700"
                                    colSpan={3}
                                >
                                    PROJECTED TIMELINE (MM/YYYY)
                                </TableHead>
                                <TableHead
                                    className="border border-gray-200 p-2 text-center text-xs font-bold dark:border-neutral-700"
                                    colSpan={2}
                                >
                                    FUNDING DETAILS
                                </TableHead>
                                <TableHead
                                    className="border border-gray-200 p-2 text-center text-xs font-bold dark:border-neutral-700"
                                    colSpan={3}
                                >
                                    OTHER COLUMNS
                                </TableHead>
                            </TableRow>
                            <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    General Description <br />
                                    and Objective of the Project <br /> to be
                                    Procured
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Type of Project to be Procured <br />{' '}
                                    (whether Goods, Infrastructure <br /> and
                                    Consulting Services)
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Quantity and Size of the Project <br /> to
                                    be Procured
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Recommended Mode <br /> of Procurement
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Pre-Procurement <br />
                                    Conference, if <br /> applicable (Yes/No)
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Start of Procurement <br />
                                    activity <br />
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    End of Procurement <br />
                                    activity <br />
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Delivery/
                                    <br />
                                    Implementation <br />
                                    Period
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Source of Funds
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Estimated Budget/Authorized
                                    <br /> Budgetary Allocation (PhP)
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    ATTACHED SUPPORTING
                                    <br /> DOCUMENTS
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    REMARKS
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-semibold dark:border-neutral-700">
                                    Actions
                                </TableHead>
                            </TableRow>
                            <TableRow className="bg-gray-200 dark:bg-gray-700">
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 1
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 2
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 3
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 4
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 5
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 6
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 7
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 8
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 9
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 10
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 11
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700">
                                    Column 12
                                </TableHead>
                                <TableHead className="border border-gray-200 p-1 text-center text-xs font-bold dark:border-neutral-700"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        className="border border-gray-200 p-8 text-center text-gray-500 dark:border-neutral-700"
                                        colSpan={13}
                                    >
                                        {activeFundId
                                            ? 'No PPMP items found for this fund. Click "Add PPMP Item" to get started.'
                                            : 'Please select a fund to view PPMP items.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {/* Grouped Projects with Subtotals */}
                                    {(() => {
                                        const groupedProjects = new Map();
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        let grandTotal = 0;

                                        // Group projects by description and type
                                        filteredData.forEach(
                                            (project: PPMPProject) => {
                                                const key = `${project.general_description}| ${project.project_type} `;
                                                if (!groupedProjects.has(key)) {
                                                    groupedProjects.set(
                                                        key,
                                                        [],
                                                    );
                                                }
                                                groupedProjects
                                                    .get(key)
                                                    .push(project);
                                            },
                                        );

                                        const rows: React.ReactElement[] = [];

                                        groupedProjects.forEach(
                                            (
                                                projectsInGroup: PPMPProject[],
                                                key: string,
                                            ) => {
                                                let groupSubtotal = 0;

                                                // Calculate group subtotal
                                                projectsInGroup.forEach(
                                                    (project: PPMPProject) => {
                                                        if (
                                                            project.funding_details &&
                                                            project
                                                                .funding_details
                                                                .length > 0
                                                        ) {
                                                            const projectSubtotal =
                                                                project.funding_details?.reduce(
                                                                    (
                                                                        total: number,
                                                                        detail: FundingDetail,
                                                                    ) =>
                                                                        total +
                                                                        parseFloat(
                                                                            String(
                                                                                detail.estimated_budget ||
                                                                                    0,
                                                                            ),
                                                                        ),
                                                                    0,
                                                                );
                                                            groupSubtotal +=
                                                                projectSubtotal;
                                                        }
                                                    },
                                                );

                                                grandTotal += groupSubtotal;

                                                // Add all project rows for this group FIRST
                                                projectsInGroup.forEach(
                                                    (project: PPMPProject) => {
                                                        const hasFundingDetails =
                                                            project.funding_details &&
                                                            project
                                                                .funding_details
                                                                .length > 0;

                                                        if (
                                                            !hasFundingDetails
                                                        ) {
                                                            // Show project without funding details
                                                            rows.push(
                                                                <TableRow
                                                                    key={
                                                                        project.id
                                                                    }
                                                                    className="hover:bg-gray-50 dark:hover:bg-neutral-800"
                                                                >
                                                                    <TableCell className="border border-gray-200 p-2 align-top text-sm dark:border-neutral-700">
                                                                        {
                                                                            project.general_description
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm dark:border-neutral-700">
                                                                        {
                                                                            project.project_type
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        No
                                                                        quantities
                                                                        added
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        N/A
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        N/A
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        N/A
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        N/A
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        N/A
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm dark:border-neutral-700">
                                                                        {project
                                                                            .fund
                                                                            ?.fund_name ||
                                                                            'Regular Fund'}
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-right text-sm font-medium text-gray-500 italic dark:border-neutral-700">
                                                                        No
                                                                        budget
                                                                        set
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        N/A
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-sm text-gray-500 italic dark:border-neutral-700">
                                                                        No
                                                                        remarks
                                                                    </TableCell>
                                                                    <TableCell className="border border-gray-200 p-2 text-center text-sm dark:border-neutral-700">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                                                                >
                                                                                    <MoreVertical className="h-3 w-3" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem
                                                                                    onClick={() =>
                                                                                        handleEditPPMP(
                                                                                            project,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Edit3 className="mr-2 h-3 w-3" />
                                                                                    Edit
                                                                                    Project
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() =>
                                                                                        handleDeletePPMP(
                                                                                            project,
                                                                                        )
                                                                                    }
                                                                                    className="text-red-600"
                                                                                >
                                                                                    <Trash2 className="mr-2 h-3 w-3" />
                                                                                    Delete
                                                                                    Project
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </TableCell>
                                                                </TableRow>,
                                                            );
                                                        } else {
                                                            // Show project with funding details and timelines
                                                            const totalRows =
                                                                project.funding_details?.reduce(
                                                                    (
                                                                        acc: number,
                                                                        detail: FundingDetail,
                                                                    ) =>
                                                                        acc +
                                                                        (detail
                                                                            .timelines
                                                                            ?.length ||
                                                                            1),
                                                                    0,
                                                                );

                                                            project.funding_details?.forEach(
                                                                (
                                                                    fundingDetail: FundingDetail,
                                                                    detailIndex: number,
                                                                ) => {
                                                                    const timelineCount =
                                                                        fundingDetail
                                                                            .timelines
                                                                            ?.length ||
                                                                        1;
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    const previousTimelineCount =
                                                                        detailIndex >
                                                                        0
                                                                            ? project
                                                                                  .funding_details?.[
                                                                                  detailIndex -
                                                                                      1
                                                                              ]
                                                                                  .timelines
                                                                                  ?.length ||
                                                                              1
                                                                            : 0;

                                                                    fundingDetail.timelines.forEach(
                                                                        (
                                                                            timeline: Timeline,
                                                                            timelineIndex: number,
                                                                        ) => {
                                                                            const isFirstRowForProject =
                                                                                detailIndex ===
                                                                                    0 &&
                                                                                timelineIndex ===
                                                                                    0;
                                                                            const isFirstRowForFundingDetail =
                                                                                timelineIndex ===
                                                                                0;

                                                                            const row =
                                                                                (
                                                                                    <TableRow
                                                                                        key={`project - ${project.id} -detail - ${detailIndex} -timeline - ${timelineIndex} `}
                                                                                        className="hover:bg-gray-50 dark:hover:bg-neutral-800"
                                                                                    >
                                                                                        {isFirstRowForProject && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-center align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    totalRows
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    project.general_description
                                                                                                }
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForProject && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-center align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    totalRows
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    project.project_type
                                                                                                }
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-center align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    fundingDetail.quantity_size
                                                                                                }
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-center align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                {fundingDetail.mode_of_procurement ||
                                                                                                    'N/A'}
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-center align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    fundingDetail.pre_procurement_conference
                                                                                                }
                                                                                            </TableCell>
                                                                                        )}
                                                                                        <TableCell className="border border-gray-200 p-2 text-center text-[0.6rem] dark:border-neutral-700">
                                                                                            {
                                                                                                timeline.start_procurement
                                                                                            }
                                                                                        </TableCell>
                                                                                        <TableCell className="border border-gray-200 p-2 text-center text-[0.6rem] dark:border-neutral-700">
                                                                                            {
                                                                                                timeline.end_procurement
                                                                                            }
                                                                                        </TableCell>
                                                                                        <TableCell className="border border-gray-200 p-2 text-center text-[0.6rem] dark:border-neutral-700">
                                                                                            {
                                                                                                timeline.delivery_period
                                                                                            }
                                                                                        </TableCell>
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-center align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                {project
                                                                                                    .fund
                                                                                                    ?.fund_name ||
                                                                                                    'Regular Fund'}
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-right align-middle text-sm font-medium dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                {formatCurrency(
                                                                                                    parseFloat(
                                                                                                        String(
                                                                                                            fundingDetail.estimated_budget ||
                                                                                                                0,
                                                                                                        ),
                                                                                                    ),
                                                                                                )}
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    fundingDetail.supporting_documents
                                                                                                }
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                {fundingDetail.remarks ||
                                                                                                    ''}
                                                                                            </TableCell>
                                                                                        )}
                                                                                        {isFirstRowForFundingDetail && (
                                                                                            <TableCell
                                                                                                className="border border-gray-200 p-2 text-center align-middle text-sm dark:border-neutral-700"
                                                                                                rowSpan={
                                                                                                    timelineCount
                                                                                                }
                                                                                            >
                                                                                                <DropdownMenu>
                                                                                                    <DropdownMenuTrigger
                                                                                                        asChild
                                                                                                    >
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            size="sm"
                                                                                                            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                                                                                        >
                                                                                                            <MoreVertical className="h-3 w-3" />
                                                                                                        </Button>
                                                                                                    </DropdownMenuTrigger>
                                                                                                    <DropdownMenuContent align="end">
                                                                                                        <DropdownMenuItem
                                                                                                            onClick={() =>
                                                                                                                handleEditFundingDetail(
                                                                                                                    project,
                                                                                                                    fundingDetail,
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            <Edit3 className="mr-2 h-3 w-3" />
                                                                                                            Edit
                                                                                                            Item
                                                                                                        </DropdownMenuItem>
                                                                                                        <DropdownMenuItem
                                                                                                            onClick={() =>
                                                                                                                handleDeleteFundingDetail(
                                                                                                                    fundingDetail.id,
                                                                                                                )
                                                                                                            }
                                                                                                            className="text-red-600"
                                                                                                        >
                                                                                                            <Trash2 className="mr-2 h-3 w-3" />
                                                                                                            Delete
                                                                                                            Item
                                                                                                        </DropdownMenuItem>
                                                                                                    </DropdownMenuContent>
                                                                                                </DropdownMenu>
                                                                                            </TableCell>
                                                                                        )}
                                                                                    </TableRow>
                                                                                );

                                                                            rows.push(
                                                                                row,
                                                                            );
                                                                        },
                                                                    );
                                                                },
                                                            );
                                                        }
                                                    },
                                                );

                                                // Add subtotal row AFTER all project rows in the group
                                                if (groupSubtotal > 0) {
                                                    const isHighlighted =
                                                        highlightedSubtotals.has(
                                                            key,
                                                        );
                                                    const firstProject =
                                                        projectsInGroup[0]; // Get first project to get project ID
                                                    rows.push(
                                                        <TableRow
                                                            key={`group - subtotal - ${key} `}
                                                            className={`font - semibold - colors transition ${
                                                                isHighlighted
                                                                    ? 'bg-green-200 hover:bg-green-300 dark:bg-green-900 dark:hover:bg-green-800'
                                                                    : 'bg-gray-50 hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                                                            } `}
                                                        >
                                                            <TableCell
                                                                className="border border-gray-200 p-2 text-right dark:border-neutral-700"
                                                                colSpan={9}
                                                            >
                                                                Subtotal:
                                                            </TableCell>
                                                            <TableCell className="border border-gray-200 p-2 text-right dark:border-neutral-700">
                                                                {formatCurrency(
                                                                    groupSubtotal,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="border border-gray-200 p-2 dark:border-neutral-700"></TableCell>
                                                            <TableCell className="border border-gray-200 p-2 dark:border-neutral-700"></TableCell>
                                                            <TableCell className="border border-gray-200 p-2 text-center dark:border-neutral-700">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        toggleSubtotalHighlight(
                                                                            key,
                                                                            firstProject.id,
                                                                        )
                                                                    }
                                                                    className={`h - 6 w - 6 p - 0 ${
                                                                        isHighlighted
                                                                            ? 'text-green-600 hover:text-green-700'
                                                                            : 'text-gray-400 hover:text-gray-500'
                                                                    } `}
                                                                    title={
                                                                        isHighlighted
                                                                            ? 'Status: FINAL '
                                                                            : 'Status: INDICATIVE '
                                                                    }
                                                                >
                                                                    <PenTool className="h-3 w-3" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>,
                                                    );
                                                }
                                            },
                                        );

                                        return rows;
                                    })()}

                                    {/* Grand Total */}
                                    <TableRow className="bg-gray-100 font-bold dark:bg-neutral-800">
                                        <TableCell
                                            className="border border-gray-200 p-2 text-right dark:border-neutral-700"
                                            colSpan={9}
                                        >
                                            TOTAL BUDGET:
                                        </TableCell>
                                        <TableCell className="border border-gray-200 p-2 text-right dark:border-neutral-700">
                                            {formatCurrency(totalBudget)}
                                        </TableCell>
                                        <TableCell
                                            className="border border-gray-200 p-2 dark:border-neutral-700"
                                            colSpan={3}
                                        ></TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add PPMP Dialog */}
            <Dialog
                open={isPPMPDialogOpen}
                onOpenChange={(open) => !open && setIsPPMPDialogOpen(false)}
            >
                <DialogContent className="mx-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Add PPMP - {currentFund?.fund_name} ({selectedYear})
                        </DialogTitle>
                        <DialogDescription>
                            {selectedExistingProject
                                ? `Add Item details to existing project: ${selectedExistingProject.general_description} `
                                : 'Create a new PPMP'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Project Selection - Only show if no existing project selected */}
                        {!selectedExistingProject && (
                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                                <table className="w-full table-fixed">
                                    <thead className="bg-gray-50 dark:bg-neutral-800">
                                        <tr>
                                            <th className="w-1/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                                Field
                                            </th>
                                            <th className="w-2/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                                Value
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-neutral-900">
                                        <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                            <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                Source of Funds
                                            </td>
                                            <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    {currentFund?.fund_name} (
                                                    {selectedYear})
                                                </div>
                                            </td>
                                        </tr>

                                        <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                            <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                Select Existing Item or Create
                                                New
                                            </td>
                                            <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                <Select
                                                    value={
                                                        ppmpFormData.general_description
                                                    }
                                                    onValueChange={(value) => {
                                                        if (
                                                            value === '__new__'
                                                        ) {
                                                            // Create new project - clear existing project selection
                                                            setSelectedExistingProject(
                                                                null,
                                                            );
                                                            setPpmpFormData({
                                                                ...ppmpFormData,
                                                                general_description:
                                                                    '',
                                                                project_type:
                                                                    '',
                                                            });
                                                        } else {
                                                            // Select existing project
                                                            const existingProject =
                                                                filteredData.find(
                                                                    (
                                                                        p: PPMPProject,
                                                                    ) =>
                                                                        p.id.toString() ===
                                                                        value,
                                                                );
                                                            if (
                                                                existingProject
                                                            ) {
                                                                setSelectedExistingProject(
                                                                    existingProject,
                                                                );
                                                                setPpmpFormData(
                                                                    {
                                                                        ...ppmpFormData,
                                                                        general_description:
                                                                            existingProject.general_description,
                                                                        project_type:
                                                                            existingProject.project_type,
                                                                    },
                                                                );
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose existing item or create new" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__new__">
                                                            + Create New Item
                                                        </SelectItem>
                                                        {filteredData.map(
                                                            (
                                                                project: PPMPProject,
                                                                index: number,
                                                            ) => (
                                                                <SelectItem
                                                                    key={
                                                                        project.id
                                                                    }
                                                                    value={
                                                                        project.id.toString()
                                                                    }
                                                                >
                                                                    {index + 1}. {project.general_description} ({project.project_type})
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                        </tr>

                                        {/* Show project details fields only when creating new project */}
                                        {!selectedExistingProject && (
                                            <>
                                                <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                    <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                        New General Description
                                                    </td>
                                                    <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                        {!isCustomDescription ? (
                                                            <Select
                                                                value={
                                                                    ppmpFormData.general_description
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    if (
                                                                        value ===
                                                                        'Others'
                                                                    ) {
                                                                        setIsCustomDescription(
                                                                            true,
                                                                        );
                                                                        setPpmpFormData(
                                                                            {
                                                                                ...ppmpFormData,
                                                                                general_description:
                                                                                    '',
                                                                            },
                                                                        );
                                                                    } else {
                                                                        setPpmpFormData(
                                                                            {
                                                                                ...ppmpFormData,
                                                                                general_description:
                                                                                    value,
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select expense category" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {expenseCategories.map(
                                                                        (
                                                                            category,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    category
                                                                                }
                                                                                value={
                                                                                    category
                                                                                }
                                                                            >
                                                                                {
                                                                                    category
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={
                                                                        ppmpFormData.general_description
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setPpmpFormData(
                                                                            {
                                                                                ...ppmpFormData,
                                                                                general_description:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    placeholder="Enter custom description"
                                                                    className="flex-1"
                                                                    required
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setIsCustomDescription(
                                                                            false,
                                                                        );
                                                                        setPpmpFormData(
                                                                            {
                                                                                ...ppmpFormData,
                                                                                general_description:
                                                                                    '',
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>

                                                <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                    <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                        Type of Project
                                                    </td>
                                                    <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                        <Select
                                                            value={
                                                                ppmpFormData.project_type
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                setPpmpFormData(
                                                                    {
                                                                        ...ppmpFormData,
                                                                        project_type:
                                                                            value,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select project type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Goods">
                                                                    Goods
                                                                </SelectItem>
                                                                <SelectItem value="Infrastructure">
                                                                    Infrastructure
                                                                </SelectItem>
                                                                <SelectItem value="Consulting Services">
                                                                    Consulting
                                                                    Services
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Show existing project info when selected */}
                        {selectedExistingProject && (
                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                                <table className="w-full table-fixed">
                                    <thead className="bg-gray-50 dark:bg-neutral-800">
                                        <tr>
                                            <th className="w-1/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                                Project Info
                                            </th>
                                            <th className="w-2/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-neutral-900">
                                        <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                            <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                General Description
                                            </td>
                                            <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                <div className="text-sm font-medium">
                                                    {
                                                        selectedExistingProject.general_description
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                            <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                Project Type
                                            </td>
                                            <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                <div className="text-sm font-medium">
                                                    {
                                                        selectedExistingProject.project_type
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                            <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                Change Project
                                            </td>
                                            <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedExistingProject(
                                                            null,
                                                        );
                                                        setPpmpFormData({
                                                            ...ppmpFormData,
                                                            general_description:
                                                                '',
                                                            project_type: '',
                                                        });
                                                    }}
                                                >
                                                    Select Different Project
                                                </Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Funding Details Section - Only show when existing project is selected */}
                        {selectedExistingProject && (
                            <>
                                {/* Quantity and Size Section */}
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                                    <div className="border-b border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                        <h3 className="text-sm font-semibold">
                                            Quantity and Size
                                        </h3>
                                    </div>
                                    <div className="bg-white dark:bg-neutral-900">
                                        <div className="p-3">
                                            {selectedExistingProject?.funding_details &&
                                            selectedExistingProject
                                                .funding_details.length > 0 ? (
                                                <div className="space-y-3">
                                                    <Select
                                                        value={
                                                            selectedExistingQuantity?.quantity_size ||
                                                            ''
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            if (
                                                                value ===
                                                                '__new__'
                                                            ) {
                                                                // Create new quantity
                                                                setSelectedExistingQuantity(
                                                                    null,
                                                                );
                                                                setFundingDetailsFormData(
                                                                    {
                                                                        ...fundingDetailsFormData,
                                                                        quantities:
                                                                            [
                                                                                {
                                                                                    quantity_size:
                                                                                        '',
                                                                                },
                                                                            ],
                                                                        mode_of_procurement:
                                                                            '',
                                                                        pre_procurement_conference:
                                                                            'No',
                                                                        estimated_budget:
                                                                            '',
                                                                        supporting_documents:
                                                                            '',
                                                                        remarks:
                                                                            '',
                                                                        timelines:
                                                                            [
                                                                                {
                                                                                    start_procurement:
                                                                                        '',
                                                                                    end_procurement:
                                                                                        '',
                                                                                    delivery_period:
                                                                                        '',
                                                                                },
                                                                            ],
                                                                    },
                                                                );
                                                            } else {
                                                                // Select existing quantity
                                                                const existingQuantity =
                                                                    selectedExistingProject.funding_details?.find(
                                                                        (
                                                                            detail: FundingDetail,
                                                                        ) =>
                                                                            detail.quantity_size ===
                                                                            value,
                                                                    );
                                                                if (
                                                                    existingQuantity
                                                                ) {
                                                                    setSelectedExistingQuantity(
                                                                        existingQuantity,
                                                                    );
                                                                    // Load the existing quantity data into the form
                                                                    setFundingDetailsFormData(
                                                                        {
                                                                            quantities:
                                                                                [
                                                                                    {
                                                                                        quantity_size:
                                                                                            existingQuantity.quantity_size,
                                                                                    },
                                                                                ],
                                                                            mode_of_procurement:
                                                                                existingQuantity.mode_of_procurement ||
                                                                                '',
                                                                            pre_procurement_conference:
                                                                                existingQuantity.pre_procurement_conference ||
                                                                                'No',
                                                                            estimated_budget:
                                                                                existingQuantity.estimated_budget?.toString() ||
                                                                                '',
                                                                            supporting_documents:
                                                                                existingQuantity.supporting_documents ||
                                                                                '',
                                                                            remarks:
                                                                                existingQuantity.remarks ||
                                                                                '',
                                                                            timelines:
                                                                                existingQuantity
                                                                                    .timelines
                                                                                    ?.length >
                                                                                0
                                                                                    ? existingQuantity.timelines
                                                                                    : [
                                                                                          {
                                                                                              start_procurement:
                                                                                                  '',
                                                                                              end_procurement:
                                                                                                  '',
                                                                                              delivery_period:
                                                                                                  '',
                                                                                          },
                                                                                      ],
                                                                        },
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select existing quantity or create new" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__new__">
                                                                + Add New Item
                                                            </SelectItem>
                                                            {selectedExistingProject.funding_details?.map(
                                                                (
                                                                    detail: FundingDetail,
                                                                ) => (
                                                                    <SelectItem
                                                                        key={
                                                                            detail.id
                                                                        }
                                                                        value={
                                                                            detail.quantity_size
                                                                        }
                                                                    >
                                                                        {
                                                                            detail.quantity_size
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>

                                                    {!selectedExistingQuantity && (
                                                        <Input
                                                            value={
                                                                fundingDetailsFormData
                                                                    .quantities[0]
                                                                    ?.quantity_size ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                updateQuantity(
                                                                    0,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="e.g., 5 trips, 500 liters, 1 person"
                                                            className="mt-2 w-full"
                                                            required
                                                        />
                                                    )}

                                                    {selectedExistingQuantity && (
                                                        <div className="mt-2 rounded border bg-gray-50 p-2 text-sm">
                                                            <strong>
                                                                Selected
                                                                Quantity:
                                                            </strong>{' '}
                                                            {
                                                                selectedExistingQuantity.quantity_size
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <Input
                                                    value={
                                                        fundingDetailsFormData
                                                            .quantities[0]
                                                            ?.quantity_size ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        updateQuantity(
                                                            0,
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., 5 trips, 500 liters, 1 person"
                                                    className="w-full"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Funding Details Table - Always show when existing project is selected */}
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                                    <table className="w-full table-fixed">
                                        <thead className="bg-gray-50 dark:bg-neutral-800">
                                            <tr>
                                                <th className="w-1/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                                    Field
                                                </th>
                                                <th className="w-2/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                                    Value
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-neutral-900">
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    className="border border-gray-200 bg-gray-100 p-2 text-center text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-800"
                                                >
                                                    Funding Details
                                                </td>
                                            </tr>

                                            <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                    Mode of Procurement
                                                </td>
                                                <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                    <Input
                                                        value={
                                                            fundingDetailsFormData.mode_of_procurement
                                                        }
                                                        onChange={(e) =>
                                                            setFundingDetailsFormData(
                                                                {
                                                                    ...fundingDetailsFormData,
                                                                    mode_of_procurement:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder="e.g., Public Bidding, Shopping, Direct Contracting"
                                                        className="w-full"
                                                        required
                                                    />
                                                </td>
                                            </tr>

                                            <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                    Pre-Procurement Conference
                                                </td>
                                                <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                    <Select
                                                        value={
                                                            fundingDetailsFormData.pre_procurement_conference
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            setFundingDetailsFormData(
                                                                {
                                                                    ...fundingDetailsFormData,
                                                                    pre_procurement_conference:
                                                                        value,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Yes">
                                                                Yes
                                                            </SelectItem>
                                                            <SelectItem value="No">
                                                                No
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                            </tr>

                                            <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                    Estimated Budget (PhP)
                                                </td>
                                                <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            fundingDetailsFormData.estimated_budget
                                                        }
                                                        onChange={(e) =>
                                                            setFundingDetailsFormData(
                                                                {
                                                                    ...fundingDetailsFormData,
                                                                    estimated_budget:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full"
                                                        required
                                                    />
                                                </td>
                                            </tr>

                                            <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                    Supporting Documents
                                                </td>
                                                <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                    <Input
                                                        value={
                                                            fundingDetailsFormData.supporting_documents
                                                        }
                                                        onChange={(e) =>
                                                            setFundingDetailsFormData(
                                                                {
                                                                    ...fundingDetailsFormData,
                                                                    supporting_documents:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder=""
                                                        className="w-full"
                                                        required
                                                    />
                                                </td>
                                            </tr>

                                            <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                                    Remarks
                                                </td>
                                                <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                                    <Input
                                                        value={
                                                            fundingDetailsFormData.remarks
                                                        }
                                                        onChange={(e) =>
                                                            setFundingDetailsFormData(
                                                                {
                                                                    ...fundingDetailsFormData,
                                                                    remarks:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder="Additional notes or requirements"
                                                        className="w-full"
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                        <h3 className="text-sm font-semibold">
                                            Projected Timeline (MM/YYYY)
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addTimeline}
                                            className="text-xs"
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            Add Timeline
                                        </Button>
                                    </div>
                                    <div className="bg-white dark:bg-neutral-900">
                                        <div className="space-y-3 p-3">
                                            {fundingDetailsFormData.timelines.map(
                                                (timeline, index) => (
                                                    <div
                                                        key={index}
                                                        className="rounded-lg border border-gray-200 p-3 dark:border-neutral-700"
                                                    >
                                                        <div className="mb-3 flex items-start justify-between">
                                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Timeline{' '}
                                                                {index + 1}
                                                            </h4>
                                                            {fundingDetailsFormData
                                                                .timelines
                                                                .length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        removeTimeline(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="border-red-200 text-red-600 hover:border-red-300 hover:text-red-700"
                                                                >
                                                                    <MinusCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                                            <div>
                                                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Start
                                                                    Procurement
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        timeline.start_procurement
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateTimeline(
                                                                            index,
                                                                            'start_procurement',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="January 2026"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    End
                                                                    Procurement
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        timeline.end_procurement
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateTimeline(
                                                                            index,
                                                                            'end_procurement',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="February 2026"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Delivery
                                                                    Period
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        timeline.delivery_period
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateTimeline(
                                                                            index,
                                                                            'delivery_period',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="March 2026"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsPPMPDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            onClick={
                                selectedExistingProject
                                    ? handleSubmitFundingDetails
                                    : handleSubmitPPMP
                            }
                            className="bg-[#1a473b] text-white hover:bg-[#1a473b]/90"
                            loading={isSubmitting}
                            loadingText="Processing..."
                        >
                            {(() => {
                                if (selectedExistingProject) {
                                    if (selectedExistingQuantity) {
                                        return 'Update Existing Details';
                                    } else {
                                        // Check if we're editing existing funding detail
                                        const existingDetail =
                                            selectedExistingProject.funding_details?.find(
                                                (detail: FundingDetail) =>
                                                    detail.quantity_size ===
                                                    fundingDetailsFormData
                                                        .quantities[0]
                                                        ?.quantity_size,
                                            );
                                        return existingDetail
                                            ? 'Update PPMP Details'
                                            : 'Add New';
                                    }
                                } else {
                                    return 'Add Item';
                                }
                            })()}
                        </LoadingButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit PPMP Item Dialog */}
            <Dialog
                open={isEditPPMPDialogOpen}
                onOpenChange={(open) => !open && setIsEditPPMPDialogOpen(false)}
            >
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Edit PPMP Project - {currentFund?.fund_name} (
                            {selectedYear})
                        </DialogTitle>
                        <DialogDescription>
                            Update PPMP project details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Main Group: General Description + Type of Project */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Project Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <Label htmlFor="edit_general_description">
                                            General Description and Objective
                                        </Label>
                                        <Input
                                            id="edit_general_description"
                                            name="general_description"
                                            value={
                                                ppmpFormData.general_description
                                            }
                                            onChange={(e) =>
                                                setPpmpFormData({
                                                    ...ppmpFormData,
                                                    general_description:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Official business travel to provincial offices for project monitoring"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit_project_type">
                                            Type of Project
                                        </Label>
                                        <Select
                                            value={ppmpFormData.project_type}
                                            onValueChange={(value) =>
                                                setPpmpFormData({
                                                    ...ppmpFormData,
                                                    project_type: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select project type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Goods">
                                                    Goods
                                                </SelectItem>
                                                <SelectItem value="Infrastructure">
                                                    Infrastructure
                                                </SelectItem>
                                                <SelectItem value="Consulting Services">
                                                    Consulting Services
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditPPMPDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            onClick={handleSubmitEditPPMP}
                            className="bg-[#1a473b] text-white hover:bg-[#1a473b]/90"
                            loading={isSubmitting}
                            loadingText="Updating..."
                        >
                            Update Project
                        </LoadingButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Funding Details Dialog */}
            <Dialog
                open={isFundingDetailsDialogOpen}
                onOpenChange={(open) =>
                    !open && setIsFundingDetailsDialogOpen(false)
                }
            >
                <DialogContent className="mx-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {(selectedPPMPItem?.funding_details?.length ?? 0) >
                            0
                                ? 'Edit'
                                : 'Add'}{' '}
                            Item Details -{' '}
                            {selectedPPMPItem?.general_description}
                        </DialogTitle>
                        <DialogDescription>
                            {(selectedPPMPItem?.funding_details?.length ?? 0) >
                            0
                                ? 'Edit'
                                : 'Add'}{' '}
                            quantities, timelines, and funding information for
                            this PPMP Item
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Table-style Edit Form */}
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                            <table className="w-full table-fixed">
                                <thead className="bg-gray-50 dark:bg-neutral-800">
                                    <tr>
                                        <th className="w-1/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                            Field
                                        </th>
                                        <th className="w-2/3 border border-gray-200 p-3 text-left text-sm font-semibold dark:border-neutral-700">
                                            Value
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-neutral-900">
                                    {/* Project Details */}
                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            Source of Funds
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Select
                                                value={
                                                    selectedPPMPItem?.fund_id?.toString() ||
                                                    ''
                                                }
                                                onValueChange={(value) =>
                                                    setSelectedPPMPItem(
                                                        (
                                                            prev: PPMPProject | null,
                                                        ) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      fund_id:
                                                                          parseInt(
                                                                              value,
                                                                          ),
                                                                  }
                                                                : null,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select fund" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredFunds.map(
                                                        (fund: Fund) => (
                                                            <SelectItem
                                                                key={fund.id}
                                                                value={fund.id.toString()}
                                                            >
                                                                {fund.fund_name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            General Description and Objective
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Input
                                                value={
                                                    selectedPPMPItem?.general_description ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setSelectedPPMPItem(
                                                        (
                                                            prev: PPMPProject | null,
                                                        ) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      general_description:
                                                                          e
                                                                              .target
                                                                              .value,
                                                                  }
                                                                : null,
                                                    )
                                                }
                                                placeholder="Enter general description"
                                                className="w-full"
                                            />
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            Type of Project
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Select
                                                value={
                                                    selectedPPMPItem?.project_type ||
                                                    ''
                                                }
                                                onValueChange={(value) =>
                                                    setSelectedPPMPItem(
                                                        (
                                                            prev: PPMPProject | null,
                                                        ) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      project_type:
                                                                          value,
                                                                  }
                                                                : null,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select project type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Goods">
                                                        Goods
                                                    </SelectItem>
                                                    <SelectItem value="Infrastructure">
                                                        Infrastructure
                                                    </SelectItem>
                                                    <SelectItem value="Consulting Services">
                                                        Consulting Services
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>

                                    {/* Quantity and Size Section */}
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="border border-gray-200 p-0 dark:border-neutral-700"
                                        >
                                            <div className="m-2 overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                                                <div className="border-b border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                                    <h3 className="text-sm font-semibold">
                                                        Quantity and Size
                                                    </h3>
                                                </div>
                                                <div className="bg-white p-3 dark:bg-neutral-900">
                                                    <Input
                                                        value={
                                                            fundingDetailsFormData
                                                                .quantities[0]
                                                                ?.quantity_size ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            updateQuantity(
                                                                0,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="e.g., 5 trips, 500 liters, 1 person"
                                                        className="w-full"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Separator */}
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="border border-gray-200 bg-gray-100 p-2 text-center text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-800"
                                        >
                                            Funding Details
                                        </td>
                                    </tr>

                                    {/* Funding Details Fields */}
                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            Mode of Procurement
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Input
                                                value={
                                                    fundingDetailsFormData.mode_of_procurement
                                                }
                                                onChange={(e) =>
                                                    setFundingDetailsFormData({
                                                        ...fundingDetailsFormData,
                                                        mode_of_procurement:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="e.g., Shopping, Direct Contracting, Bidding"
                                                className="w-full"
                                            />
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            Pre-Procurement Conference
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Select
                                                value={
                                                    fundingDetailsFormData.pre_procurement_conference
                                                }
                                                onValueChange={(value) =>
                                                    setFundingDetailsFormData({
                                                        ...fundingDetailsFormData,
                                                        pre_procurement_conference:
                                                            value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Yes">
                                                        Yes
                                                    </SelectItem>
                                                    <SelectItem value="No">
                                                        No
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            Estimated Budget (PhP)
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={
                                                    fundingDetailsFormData.estimated_budget
                                                }
                                                onChange={(e) =>
                                                    setFundingDetailsFormData({
                                                        ...fundingDetailsFormData,
                                                        estimated_budget:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="0.00"
                                                className="w-full"
                                            />
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            Supporting Documents
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Input
                                                value={
                                                    fundingDetailsFormData.supporting_documents
                                                }
                                                onChange={(e) =>
                                                    setFundingDetailsFormData({
                                                        ...fundingDetailsFormData,
                                                        supporting_documents:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder=""
                                                className="w-full"
                                            />
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                        <td className="border border-gray-200 p-3 text-sm font-medium dark:border-neutral-700">
                                            Remarks
                                        </td>
                                        <td className="border border-gray-200 p-3 dark:border-neutral-700">
                                            <Input
                                                value={
                                                    fundingDetailsFormData.remarks
                                                }
                                                onChange={(e) =>
                                                    setFundingDetailsFormData({
                                                        ...fundingDetailsFormData,
                                                        remarks: e.target.value,
                                                    })
                                                }
                                                placeholder="Additional notes or comments"
                                                className="w-full"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Timeline Section */}
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                            <div className="border-b border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Projected Timeline (MM/YYYY)
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addTimeline}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Timeline
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-neutral-900">
                                <div className="space-y-3 p-3">
                                    {fundingDetailsFormData.timelines.map(
                                        (timeline, index) => (
                                            <div
                                                key={index}
                                                className="rounded-lg border border-gray-200 p-3 dark:border-neutral-700"
                                            >
                                                <div className="mb-3 flex items-start justify-between">
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Timeline {index + 1}
                                                    </h4>
                                                    {fundingDetailsFormData
                                                        .timelines.length >
                                                        1 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeTimeline(
                                                                    index,
                                                                )
                                                            }
                                                            className="border-red-200 text-red-600 hover:border-red-300 hover:text-red-700"
                                                        >
                                                            <MinusCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                                    <div>
                                                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                            Start Procurement
                                                        </Label>
                                                        <Input
                                                            value={
                                                                timeline.start_procurement
                                                            }
                                                            onChange={(e) =>
                                                                updateTimeline(
                                                                    index,
                                                                    'start_procurement',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="01/2026"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                            End Procurement
                                                        </Label>
                                                        <Input
                                                            value={
                                                                timeline.end_procurement
                                                            }
                                                            onChange={(e) =>
                                                                updateTimeline(
                                                                    index,
                                                                    'end_procurement',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="02/2026"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                            Delivery Period
                                                        </Label>
                                                        <Input
                                                            value={
                                                                timeline.delivery_period
                                                            }
                                                            onChange={(e) =>
                                                                updateTimeline(
                                                                    index,
                                                                    'delivery_period',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="March 2026"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsFundingDetailsDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            onClick={handleSubmitFundingDetails}
                            className="bg-[#1a473b] text-white hover:bg-[#1a473b]/90"
                            loading={isSubmitting}
                            loadingText="Processing..."
                        >
                            {(() => {
                                if (selectedFundingDetail) {
                                    return 'Update Details';
                                } else if (selectedPPMPItem) {
                                    // Check if we're editing existing funding detail
                                    const existingDetail =
                                        selectedPPMPItem.funding_details?.find(
                                            (detail: FundingDetail) =>
                                                detail.quantity_size ===
                                                fundingDetailsFormData
                                                    .quantities[0]
                                                    ?.quantity_size,
                                        );
                                    return existingDetail
                                        ? 'Update Details'
                                        : 'Add Funding Details';
                                } else {
                                    return 'Add Details';
                                }
                            })()}
                        </LoadingButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title={deleteType === 'ppmp' ? 'Delete PPMP Item' : 'Delete Funding Detail'}
                message={deleteType === 'ppmp' 
                    ? 'Are you sure you want to delete this PPMP item? This action cannot be undone.'
                    : 'Are you sure you want to delete this funding detail? This action cannot be undone.'
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                isLoading={isSubmitting}
                loadingText="Deleting..."
                variant="destructive"
            />
        </div>
    );
}
