import CustomPagination from '@/components/CustomPagination';
import FormDialog, { type FormField } from '@/components/FormDialog';
import SearchBar from '@/components/SearchBar';
import SimpleStatistic from '@/components/SimpleStatistic';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
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
import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    DollarSign,
    Edit3,
    MapPin,
    MoreVertical,
    Plus,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState, type ReactElement } from 'react';

interface TravelExpense {
    id: number;
    doctrack_no: string;
    name: string;
    date_of_travel: string;
    destination: string;
    purpose: string;
    amount: number;
    fund_id: number | null;
    ppmp_project_id: number | null;
    ppmp_funding_detail_id: number | null;
    fund?: {
        id: number;
        fund_name: string;
    };
    ppmp_project?: {
        id: number;
        general_description: string;
        project_type: string;
    };
    ppmp_funding_detail?: {
        id: number;
        estimated_budget: number;
        quantity_size: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    remarks: string | null;
    created_at: string;
}

interface PageProps {
    travelExpenses: {
        data: TravelExpense[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search: string;
    perPage: number;
    expenseAnalytics: {
        totalExpenses: number;
        totalAmount: number;
        pendingCount: number;
        approvedCount: number;
        rejectedCount: number;
        totalByYear: Array<{
            year: number;
            count: number;
            total: number;
        }>;
    };
    funds: {
        data: Array<{
            id: number;
            fund_name: string;
            source_year: number;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    ppmpItems?: Array<{
        id: number;
        general_description: string;
        project_type: string;
        funding_details: Array<{
            id: number;
            estimated_budget: number;
            timelines: Array<Record<string, unknown>>;
        }>;
        fund_id: number;
    }>;
    [key: string]: unknown;
}

export default function TravelExpenses() {
    const { showSuccess, showError, showDeleted, showWarning } =
        usePopupAlert();
    const { props, url } = usePage<PageProps>();
    const {
        travelExpenses,
        search = '',
        perPage: perPageProp = 10,
        expenseAnalytics: analytics,
        funds,
        ppmpItems = [],
    } = props;

    // Get URL parameters
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const urlYear = urlParams.get('year');
    const urlFundId = urlParams.get('fundId');

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(
        travelExpenses?.current_page || 1,
    );
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedExpense, setSelectedExpense] =
        useState<TravelExpense | null>(null);
    const [sortField, setSortField] = useState<string>('date_of_travel');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedYear, setSelectedYear] = useState<number>(
        urlYear ? parseInt(urlYear) : 2026,
    );
    const [selectedFundId, setSelectedFundId] = useState<number | null>(
        urlFundId ? parseInt(urlFundId) : null,
    );

    // Add loading state to track when all required data is available
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Initialize with first available year and fund immediately (only if not set from URL)
    useEffect(() => {
        if (funds?.data && funds.data.length > 0 && !urlYear) {
            const years = [
                ...new Set(funds.data.map((fund) => fund.source_year)),
            ].sort((a, b) => b - a);
            if (years.length > 0) {
                const firstYear = years[0];
                setSelectedYear(firstYear);

                const fundsForYear = funds.data.filter(
                    (fund) => fund.source_year === firstYear,
                );
                if (fundsForYear.length > 0 && !urlFundId) {
                    setSelectedFundId(fundsForYear[0].id);
                }
            }
        }
    }, [funds?.data, urlYear, urlFundId]);

    // Track when all required data is loaded
    useEffect(() => {
        if (travelExpenses && funds?.data && analytics) {
            setIsDataLoading(false);
        }
    }, [travelExpenses, funds?.data, analytics]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Create PPMP project options for dropdown
    const ppmpProjectOptions = useMemo(() => {
        if (!ppmpItems || !Array.isArray(ppmpItems)) return [];

        // Filter projects that are travel-related and have funding details
        const travelProjects = ppmpItems.filter((item) => {
            const isTravelRelated =
                item.general_description === 'Travelling Expenses - Local' ||
                item.general_description === 'Travelling Expenses - Foreign';
            const itemMatchesFund = selectedFundId
                ? item.fund_id === selectedFundId
                : true;
            const hasFundingDetails =
                item.funding_details && item.funding_details.length > 0;
            return isTravelRelated && itemMatchesFund && hasFundingDetails;
        });

        // Create options with remaining balance information
        const options = travelProjects.map((item) => {
            const totalBudget =
                item.funding_details?.reduce(
                    (sum, detail) =>
                        sum + (Number(detail.estimated_budget) || 0),
                    0,
                ) || 0;

            // Calculate current expenses for this project (only approved expenses)
            const currentExpenses = (travelExpenses?.data || [])
                .filter(
                    (expense) =>
                        expense.ppmp_project_id === item.id &&
                        expense.status === 'approved',
                )
                .reduce(
                    (sum, expense) => sum + (Number(expense.amount) || 0),
                    0,
                );

            const remainingBalance = totalBudget - currentExpenses;

            return {
                value: item.id.toString(),
                label: `${item.general_description} - ${formatCurrency(remainingBalance)}`,
                project: item,
            };
        });

        return options;
    }, [ppmpItems, selectedFundId, travelExpenses]);

    const fundYears = useMemo(() => {
        if (!funds?.data || !Array.isArray(funds.data)) return [];
        return [...new Set(funds.data.map((fund) => fund.source_year))].sort(
            (a, b) => b - a,
        );
    }, [funds?.data]);

    const filteredFunds = useMemo(() => {
        if (!funds?.data || !Array.isArray(funds.data)) return [];
        return funds.data.filter((fund) => fund.source_year === selectedYear);
    }, [funds?.data, selectedYear]);

    useEffect(() => {
        if (
            filteredFunds &&
            Array.isArray(filteredFunds) &&
            filteredFunds.length > 0 &&
            (!selectedFundId ||
                !filteredFunds.find((f) => f.id === selectedFundId))
        ) {
            setSelectedFundId(filteredFunds[0].id);
        }
    }, [filteredFunds, selectedFundId]);

    const currentFund = useMemo(() => {
        if (!selectedFundId) return null;
        return filteredFunds.find((fund) => fund.id === selectedFundId) || null;
    }, [filteredFunds, selectedFundId]);

    const expenseFormFields: FormField[] = useMemo(
        () => [
            {
                name: 'doctrack_no',
                label: 'Document Tracking No.',
                type: 'text',
                required: true,
                placeholder: 'e.g., DOC-2024-001',
            },
            {
                name: 'name',
                label: 'Traveler Name',
                type: 'text',
                required: true,
                placeholder: 'e.g., Juan Dela Cruz',
            },
            {
                name: 'date_of_travel',
                label: 'Date of Travel',
                type: 'date',
                required: true,
            },
            {
                name: 'destination',
                label: 'Destination',
                type: 'text',
                required: true,
                placeholder: 'e.g., Manila, Philippines',
            },
            {
                name: 'purpose',
                label: 'Purpose',
                type: 'text',
                required: true,
                placeholder: 'e.g., Project meeting',
            },
            {
                name: 'ppmp_project_id',
                label: 'Travel Type',
                type: 'select',
                required: true,
                options: ppmpProjectOptions,
                placeholder: 'Select a Travel Type',
            },
            {
                name: 'amount',
                label: 'Amount',
                type: 'number',
                required: true,
                step: '0.01',
                min: '0',
            },
            {
                name: 'fund_id',
                label: 'Source of Fund',
                type: 'select',
                required: false,
                options: filteredFunds
                    ? filteredFunds.map((fund) => ({
                          value: fund.id.toString(),
                          label: `${fund.fund_name} (${fund.source_year})`,
                      }))
                    : [],
                placeholder: 'Select fund',
            },
            {
                name: 'status',
                label: 'Status',
                type: 'select',
                required: true,
                options: [
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                ],
                placeholder: 'Select status',
            },
            {
                name: 'remarks',
                label: 'Remarks',
                type: 'text',
                required: false,
                placeholder: 'Additional notes...',
            },
        ],
        [filteredFunds, ppmpProjectOptions],
    );

    const [formData, setFormData] = useState({
        doctrack_no: '',
        name: '',
        date_of_travel: '',
        destination: '',
        purpose: '',
        ppmp_project_id: '',
        ppmp_funding_detail_id: '',
        amount: '',
        fund_id: '',
        status: 'pending',
        remarks: '',
    });

    const resetForm = () => {
        setFormData({
            doctrack_no: '',
            name: '',
            date_of_travel: '',
            destination: '',
            purpose: '',
            ppmp_project_id: '',
            ppmp_funding_detail_id: '',
            amount: '',
            fund_id: '',
            status: 'pending',
            remarks: '',
        });
    };

    const handleAdd = () => {
        resetForm();
        if (selectedFundId) {
            setFormData((prev) => ({
                ...prev,
                fund_id: selectedFundId.toString(),
            }));
        }
        setIsAddDialogOpen(true);
    };

    const handleEdit = (expense: TravelExpense) => {
        setSelectedExpense(expense);
        setFormData({
            doctrack_no: expense.doctrack_no,
            name: expense.name,
            date_of_travel: expense.date_of_travel
                ? new Date(expense.date_of_travel).toISOString().split('T')[0]
                : '',
            destination: expense.destination,
            purpose: expense.purpose,
            ppmp_project_id: expense.ppmp_project_id?.toString() || '',
            ppmp_funding_detail_id:
                expense.ppmp_funding_detail_id?.toString() || '',
            amount: expense.amount.toString(),
            fund_id: expense.fund_id?.toString() || '',
            status: expense.status,
            remarks: expense.remarks || '',
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (
            window.confirm(
                'Are you sure you want to delete this travel expense?',
            )
        ) {
            setIsSubmitting(true);
            router.delete(`/travel-expenses/${id}`, {
                onSuccess: () => {
                    showDeleted(
                        'Travel Expense Deleted',
                        'Travel expense has been successfully removed.',
                    );
                    router.get(
                        '/budgetmanagement',
                        {
                            tab: 'travel-expenses',
                            search: searchValue,
                            perPage,
                            page: currentPage,
                            sort: sortField,
                            direction: sortDirection,
                            year: selectedYear,
                            fundId: selectedFundId,
                        },
                        { preserveState: true },
                    );
                },
                onError: (errors) => {
                    console.error('Error deleting travel expense:', errors);
                    showError(
                        'Delete Failed',
                        'Unable to delete travel expense. Please try again.',
                    );
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    // Get fund from expense
    const getFundFromExpense = (expense: TravelExpense) => {
        return funds?.data.find((fund) => fund.id === expense.fund_id);
    };

    const handleSubmitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const amount = parseFloat(formData.amount) || 0;
        const ppmpProjectId = parseInt(formData.ppmp_project_id) || null;

        // Find the selected PPMP project to check budget
        const selectedProject = ppmpProjectOptions.find(
            (option) => option.value === formData.ppmp_project_id,
        )?.project;

        if (selectedProject) {
            const totalBudget =
                selectedProject.funding_details?.reduce(
                    (sum, detail) =>
                        sum + (Number(detail.estimated_budget) || 0),
                    0,
                ) || 0;

            // Calculate current expenses for this project
            const currentExpenses = filteredExpenses
                .filter(
                    (expense) => expense.ppmp_project_id === selectedProject.id,
                )
                .reduce((sum, expense) => sum + expense.amount, 0);

            const remainingBalance = totalBudget - currentExpenses;

            if (amount > remainingBalance) {
                showError(
                    'Insufficient Balance',
                    `Available balance: ${formatCurrency(remainingBalance)}`,
                );
                setIsSubmitting(false);
                return;
            }
        }

        const formattedData = {
            ...formData,
            amount: amount,
            ppmp_project_id: ppmpProjectId,
        };

        router.post('/travel-expenses', formattedData, {
            onSuccess: () => {
                showSuccess(
                    'Travel Expense Added',
                    'New travel expense has been successfully created.',
                );
                setIsAddDialogOpen(false);
                resetForm();
                router.get(
                    '/budgetmanagement',
                    {
                        tab: 'travel-expenses',
                        search: searchValue,
                        perPage,
                        page: currentPage,
                        sort: sortField,
                        direction: sortDirection,
                        year: selectedYear,
                        fundId: selectedFundId,
                    },
                    { preserveState: true },
                );
            },
            onError: (errors) => {
                showError(
                    'Add Failed',
                    'Unable to add travel expense. Please try again.',
                );
                console.error('Error adding travel expense:', errors);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (selectedExpense) {
            const amount = parseFloat(formData.amount) || 0;
            const ppmpProjectId = parseInt(formData.ppmp_project_id) || null;

            // Find the selected PPMP project to check budget
            const selectedProject = ppmpProjectOptions.find(
                (option) => option.value === formData.ppmp_project_id,
            )?.project;

            if (selectedProject) {
                const totalBudget =
                    selectedProject.funding_details?.reduce(
                        (sum, detail) =>
                            sum + (Number(detail.estimated_budget) || 0),
                        0,
                    ) || 0;

                // Calculate current expenses for this project (excluding the current expense)
                const currentExpenses = filteredExpenses
                    .filter(
                        (expense) =>
                            expense.ppmp_project_id === selectedProject.id &&
                            expense.id !== selectedExpense.id,
                    )
                    .reduce((sum, expense) => sum + expense.amount, 0);

                const remainingBalance = totalBudget - currentExpenses;

                if (amount > remainingBalance) {
                    showError(
                        'Insufficient Balance',
                        `Available balance: ${formatCurrency(remainingBalance)}`,
                    );
                    setIsSubmitting(false);
                    return;
                }
            }

            const formattedData = {
                ...formData,
                amount: amount,
                ppmp_project_id: ppmpProjectId,
            };

            router.put(
                `/travel-expenses/${selectedExpense.id}`,
                formattedData,
                {
                    onSuccess: () => {
                        showSuccess(
                            'Travel Expense Updated',
                            'Travel expense has been successfully updated.',
                        );
                        setIsEditDialogOpen(false);
                        resetForm();
                        setSelectedExpense(null);
                        router.get(
                            '/budgetmanagement',
                            {
                                tab: 'travel-expenses',
                                search: searchValue,
                                perPage,
                                page: currentPage,
                                sort: sortField,
                                direction: sortDirection,
                                year: selectedYear,
                                fundId: selectedFundId,
                            },
                            { preserveState: true },
                        );
                    },
                    onError: (errors) => {
                        showError(
                            'Update Failed',
                            'Unable to update travel expense. Please try again.',
                        );
                        console.error('Error updating travel expense:', errors);
                    },
                    onFinish: () => setIsSubmitting(false),
                },
            );
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/budgetmanagement',
            {
                tab: 'travel-expenses',
                search: searchValue,
                perPage,
                page,
                sort: sortField,
                direction: sortDirection,
                year: selectedYear,
                fundId: selectedFundId,
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
                tab: 'travel-expenses',
                search: searchValue,
                perPage,
                sort: field,
                direction: newDirection,
                page: 1,
                year: selectedYear,
                fundId: selectedFundId,
            },
            { preserveState: true, replace: true },
        );
    };

    const filteredExpenses = useMemo(() => {
        if (!travelExpenses?.data) return [];

        let expenses = travelExpenses.data;

        // Filter by year (based on fund's source_year)
        const fundIdsForYear = filteredFunds.map((f) => f.id);
        expenses = expenses.filter(
            (expense) =>
                expense.fund_id && fundIdsForYear.includes(expense.fund_id),
        );

        // Filter by specific fund if selected
        if (selectedFundId) {
            expenses = expenses.filter(
                (expense) => expense.fund_id === selectedFundId,
            );
        }

        return expenses;
    }, [travelExpenses, selectedFundId, filteredFunds]);

    const sortedExpenses = useMemo(() => {
        if (!filteredExpenses) return [];

        return [...filteredExpenses].sort((a, b) => {
            let aValue = a[sortField as keyof TravelExpense];
            let bValue = b[sortField as keyof TravelExpense];

            if (sortField.includes('_date') || sortField === 'date_of_travel') {
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
    }, [filteredExpenses, sortField, sortDirection]);

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

    const getStatusBadge = (status: string) => {
        const baseClasses =
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
        switch (status) {
            case 'approved':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
            case 'pending':
            default:
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
        }
    };

    // Calculate PPMP local travel subtotal separately for statistics
    const ppmpLocalSubtotal = useMemo(() => {
        const ppmpTravelExpenses = ppmpItems.filter((item) => {
            const isLocalTravelExpense =
                item.general_description === 'Travelling Expenses - Local';
            const itemMatchesFund = selectedFundId
                ? item.fund_id === selectedFundId
                : true;
            return isLocalTravelExpense && itemMatchesFund;
        });

        return ppmpTravelExpenses.reduce((sum, item) => {
            const itemTotal =
                item.funding_details?.reduce(
                    (total, detail) =>
                        total + (Number(detail.estimated_budget) || 0),
                    0,
                ) || 0;
            return sum + itemTotal;
        }, 0);
    }, [ppmpItems, selectedFundId]);

    // Calculate PPMP foreign travel subtotal separately for statistics
    const ppmpForeignSubtotal = useMemo(() => {
        const ppmpTravelExpenses = ppmpItems.filter((item) => {
            const isForeignTravelExpense =
                item.general_description === 'Travelling Expenses - Foreign';
            const itemMatchesFund = selectedFundId
                ? item.fund_id === selectedFundId
                : true;
            return isForeignTravelExpense && itemMatchesFund;
        });

        return ppmpTravelExpenses.reduce((sum, item) => {
            const itemTotal =
                item.funding_details?.reduce(
                    (total, detail) =>
                        total + (Number(detail.estimated_budget) || 0),
                    0,
                ) || 0;
            return sum + itemTotal;
        }, 0);
    }, [ppmpItems, selectedFundId]);

    // Calculate remaining balance for each travel type (PPMP Budget - TEV Expenses)
    const travelBalances = useMemo(() => {
        // Get PPMP budget allocations from subtotals
        const ppmpTravelExpenses = ppmpItems.filter((item) => {
            const isTravelExpense =
                item.general_description === 'Travelling Expenses - Local' ||
                item.general_description === 'Travelling Expenses - Foreign';
            const itemMatchesFund = selectedFundId
                ? item.fund_id === selectedFundId
                : true;
            return isTravelExpense && itemMatchesFund;
        });

        const ppmpLocalBudget = ppmpTravelExpenses
            .filter(
                (item) =>
                    item.general_description === 'Travelling Expenses - Local',
            )
            .reduce((sum, item) => {
                const itemTotal =
                    item.funding_details?.reduce(
                        (total, detail) =>
                            total + (Number(detail.estimated_budget) || 0),
                        0,
                    ) || 0;
                return sum + itemTotal;
            }, 0);

        const ppmpForeignBudget = ppmpTravelExpenses
            .filter(
                (item) =>
                    item.general_description ===
                    'Travelling Expenses - Foreign',
            )
            .reduce((sum, item) => {
                const itemTotal =
                    item.funding_details?.reduce(
                        (total, detail) =>
                            total + (Number(detail.estimated_budget) || 0),
                        0,
                    ) || 0;
                return sum + itemTotal;
            }, 0);

        // Calculate TEV expenses for each travel type (only approved expenses are deducted from balance)
        const tevLocalExpenses = filteredExpenses
            .filter(
                (expense) =>
                    expense.ppmp_project?.general_description ===
                        'Travelling Expenses - Local' &&
                    expense.status === 'approved',
            )
            .reduce((sum, expense) => sum + Number(expense.amount), 0);

        const tevForeignExpenses = filteredExpenses
            .filter(
                (expense) =>
                    expense.ppmp_project?.general_description ===
                        'Travelling Expenses - Foreign' &&
                    expense.status === 'approved',
            )
            .reduce((sum, expense) => sum + Number(expense.amount), 0);

        // Debug logging
        console.log('Balance Debug:', {
            ppmpItemsCount: ppmpItems.length,
            ppmpLocalBudget,
            ppmpForeignBudget,
            tevLocalExpenses,
            tevForeignExpenses,
            localBalance: ppmpLocalBudget - tevLocalExpenses,
            foreignBalance: ppmpForeignBudget - tevForeignExpenses,
            filteredExpenses: filteredExpenses.map((e) => ({
                id: e.id,
                amount: e.amount,
                status: e.status,
                project_desc: e.ppmp_project?.general_description,
            })),
            ppmpLocalItems: ppmpTravelExpenses
                .filter(
                    (item) =>
                        item.general_description ===
                        'Travelling Expenses - Local',
                )
                .map((item) => ({
                    id: item.id,
                    description: item.general_description,
                    fund_id: item.fund_id,
                    funding_details_count: item.funding_details?.length || 0,
                    total_budget:
                        item.funding_details?.reduce(
                            (sum, detail) =>
                                sum + (Number(detail.estimated_budget) || 0),
                            0,
                        ) || 0,
                })),
        });

        // Balance = PPMP Budget Allocation - TEV Expenses
        return {
            local: ppmpLocalBudget - tevLocalExpenses,
            foreign: ppmpForeignBudget - tevForeignExpenses,
            total:
                ppmpLocalBudget +
                ppmpForeignBudget -
                (tevLocalExpenses + tevForeignExpenses),
        };
    }, [filteredExpenses, ppmpItems, selectedFundId]);

    // Calculate total amount from all expenses in the table for the Total Amount display
    const totalExpensesAmount = useMemo(() => {
        return filteredExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0,
        );
    }, [filteredExpenses]);

    // Show loading state while data is being fetched
    if (isDataLoading || !travelExpenses || !funds?.data || !analytics) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">Loading travel expense data...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                {/* Analytics Dashboard */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <SimpleStatistic
                        label="Total Amount"
                        value={formatCurrency(totalExpensesAmount || 0)}
                        icon={DollarSign}
                    />
                    <SimpleStatistic
                        label="Local Travel Expenses"
                        value={formatCurrency(ppmpLocalSubtotal || 0)}
                        icon={DollarSign}
                        subtitle={`Balance: ${formatCurrency(travelBalances.local || 0)}`}
                    />
                    <SimpleStatistic
                        label="Foreign Travel Expenses"
                        value={formatCurrency(ppmpForeignSubtotal || 0)}
                        icon={DollarSign}
                        subtitle={`Balance: ${formatCurrency(travelBalances.foreign || 0)}`}
                    />
                    <SimpleStatistic
                        label="Pending"
                        value={analytics?.pendingCount || 0}
                        icon={Calendar}
                    />
                </div>

                {/* Controls Section */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                            {/* Add Expense Button */}
                            {currentFund && (
                                <Button
                                    onClick={handleAdd}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Status
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
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                        {fundYears.map((year: number) => (
                                            <SelectItem
                                                key={year}
                                                value={year.toString()}
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Fund Selection */}
                            <div className="flex items-center gap-2">
                                <label className="font-medium">Fund:</label>
                                <Select
                                    value={selectedFundId?.toString() || ''}
                                    onValueChange={(value) => {
                                        const newFundId = parseInt(value);
                                        setSelectedFundId(newFundId);
                                    }}
                                >
                                    <SelectTrigger className="w-[250px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                        <SelectValue>
                                            {selectedFundId
                                                ? filteredFunds.find(
                                                      (f) =>
                                                          f.id ===
                                                          selectedFundId,
                                                  )?.fund_name ||
                                                  'Select a fund'
                                                : 'Select a fund'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                        {filteredFunds.map((fund) => (
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

                        {/* Search and Per Page */}
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                            <div className="flex items-center gap-2">
                                <label className="font-medium">Show:</label>
                                <Select
                                    value={perPage.toString()}
                                    onValueChange={(value) => {
                                        const newPerPage = parseInt(value);
                                        setPerPage(newPerPage);
                                        router.get(
                                            '/budgetmanagement',
                                            {
                                                tab: 'travel-expenses',
                                                search: searchValue,
                                                perPage: newPerPage,
                                                year: selectedYear,
                                                fundId: selectedFundId,
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
                            <div className="flex w-full items-center gap-2 md:w-auto">
                                <SearchBar
                                    search={searchValue}
                                    onSearchChange={setSearchValue}
                                    placeholder="Search TEV..."
                                    className="w-full md:max-w-md"
                                    searchRoute="/budgetmanagement"
                                    additionalParams={{
                                        tab: 'travel-expenses',
                                        perPage: perPage,
                                    }}
                                />
                            </div>
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
                                        TEV {currentFund.fund_name}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Travel Expenses Table */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="overflow-x-auto">
                        <Table className="w-full border-collapse">
                            <TableHeader>
                                <TableRow className="border-b border-gray-200 dark:border-neutral-700">
                                    <TableHead
                                        className="cursor-pointer px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                        onClick={() =>
                                            handleSort('doctrack_no')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Doc Track No.
                                            <SortIndicator field="doctrack_no" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Name
                                            <SortIndicator field="name" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                        onClick={() =>
                                            handleSort('date_of_travel')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Date of Travel
                                            <SortIndicator field="date_of_travel" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                        onClick={() =>
                                            handleSort('destination')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Destination
                                            <SortIndicator field="destination" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
                                        Purpose
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('fund_name')}
                                    >
                                        <div className="flex items-center">
                                            Source of Fund
                                            <SortIndicator field="fund_name" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('amount')}
                                    >
                                        <div className="flex items-center">
                                            Amount
                                            <SortIndicator field="amount" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer px-4 py-3 text-left font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status
                                            <SortIndicator field="status" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-center font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedExpenses.length > 0 ? (
                                    sortedExpenses.map((expense) => (
                                        <TableRow
                                            key={expense.id}
                                            className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                                        >
                                            <TableCell className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {expense.doctrack_no}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="text-gray-900 dark:text-white">
                                                    {expense.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center text-gray-900 dark:text-white">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                                    {new Date(
                                                        expense.date_of_travel,
                                                    ).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center text-gray-900 dark:text-white">
                                                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                                                    {expense.destination}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div
                                                    className="max-w-xs truncate text-gray-900 dark:text-white"
                                                    title={expense.purpose}
                                                >
                                                    {expense.purpose}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {expense.fund?.fund_name ||
                                                        'No fund assigned'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(
                                                        expense.amount,
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Select
                                                    value={expense.status}
                                                    onValueChange={(value) => {
                                                        const updatedData = {
                                                            ...expense,
                                                            status: value,
                                                        };
                                                        router.put(
                                                            `/travel-expenses/${expense.id}`,
                                                            updatedData,
                                                            {
                                                                onSuccess:
                                                                    () => {
                                                                        router.get(
                                                                            '/budgetmanagement',
                                                                            {
                                                                                tab: 'travel-expenses',
                                                                                search: searchValue,
                                                                                perPage,
                                                                                page: currentPage,
                                                                                sort: sortField,
                                                                                direction:
                                                                                    sortDirection,
                                                                                year: selectedYear,
                                                                                fundId: selectedFundId,
                                                                            },
                                                                            {
                                                                                preserveState: true,
                                                                            },
                                                                        );
                                                                    },
                                                                onError: (
                                                                    errors,
                                                                ) => {
                                                                    console.error(
                                                                        'Error updating status:',
                                                                        errors,
                                                                    );
                                                                },
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className={`h-8 w-24 border-0 ${getStatusBadge(expense.status)} cursor-pointer hover:opacity-80`}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">
                                                            Pending
                                                        </SelectItem>
                                                        <SelectItem value="approved">
                                                            Approved
                                                        </SelectItem>
                                                        <SelectItem value="rejected">
                                                            Rejected
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <span className="sr-only">
                                                                Open menu
                                                            </span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleEdit(
                                                                    expense,
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit3 className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleDelete(
                                                                    expense.id,
                                                                )
                                                            }
                                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                        >
                                            No travel expenses found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {sortedExpenses.length} of{' '}
                            {filteredExpenses.length} results
                        </div>
                        <CustomPagination
                            currentPage={travelExpenses.current_page}
                            totalItems={travelExpenses.total}
                            perPage={travelExpenses.per_page}
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
                onInputChange={(e) =>
                    setFormData({
                        ...formData,
                        [e.target.name]: e.target.value,
                    })
                }
                onSelectChange={(name, value) =>
                    setFormData({ ...formData, [name]: value })
                }
                fields={expenseFormFields}
                title={`Add Travel Expense - ${currentFund?.fund_name || 'Select Fund'} (${currentFund?.source_year || selectedYear})`}
                description="Add a new travel expense record"
                submitButtonText="Add Status"
                isLoading={isSubmitting}
                loadingText="Adding..."
            />

            {/* Edit Dialog */}
            <FormDialog
                isOpen={isEditDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedExpense(null);
                        resetForm();
                    }
                    setIsEditDialogOpen(open);
                }}
                onSubmit={handleSubmitEdit}
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
                fields={expenseFormFields}
                title={`Edit Travel Expense - ${getFundFromExpense(selectedExpense || ({} as TravelExpense))?.fund_name || currentFund?.fund_name || 'No Fund'} (${getFundFromExpense(selectedExpense || ({} as TravelExpense))?.source_year || currentFund?.source_year || selectedYear})`}
                description="Edit travel expense record"
                submitButtonText="Update Expense"
                isEdit={true}
                isLoading={isSubmitting}
                loadingText="Updating..."
            />
        </>
    );
}

// Add layout to the component
TravelExpenses.layout = (page: ReactElement) => <AppLayout children={page} />;
