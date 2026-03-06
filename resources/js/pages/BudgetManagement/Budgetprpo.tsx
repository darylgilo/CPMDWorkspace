import CustomPagination from '@/components/CustomPagination';
import FormDialog, { type FormField } from '@/components/FormDialog';
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
    X,
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

interface FundTransaction {
    id: number;
    fund_id: number;
    doctrack_no: string;
    pr_no: string;
    specific_items: string;
    category: string;
    amount_pr: number;
    resolution_no: string;
    supplier: string;
    po_no: string;
    amount_po: number;
    balance: number;
    delivery_date?: string;
    dv_no?: string;
    amount_dv?: number;
    payment_date?: string;
    remarks?: string;
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
    fundTransactions: {
        data: FundTransaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search: string;
    perPage: number;
    [key: string]: unknown;
}

export default function BudgetAllocation() {
    const { showSuccess, showError, showDeleted, showWarning } =
        usePopupAlert();
    const { props, url } = usePage<PageProps>();
    const {
        funds,
        fundTransactions,
        search = '',
        perPage: perPageProp = 10,
    } = props;

    // Get URL parameters
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const urlYear = urlParams.get('year');
    const urlFundId = urlParams.get('fundId');

    // Category options matching the database enum
    const categoryOptions = [
        {
            value: 'Office Supplies and Materials',
            label: 'Office Supplies and Materials',
        },
        {
            value: 'Meals and Accommodation',
            label: 'Meals and Accommodation',
        },
        {
            value: 'Agricultural Supplies',
            label: 'Agricultural Supplies',
        },
        {
            value: 'Agricultural and Marine Supplies',
            label: 'Agricultural and Marine Supplies',
        },
        {
            value: 'Chemical and Filtering',
            label: 'Chemical and Filtering',
        },
        {
            value: 'ICT Supplies',
            label: 'ICT Supplies',
        },
        {
            value: 'ICT Office Supplies',
            label: 'ICT Office Supplies',
        },
        {
            value: 'Other Supplies',
            label: 'Other Supplies',
        },
        {
            value: 'Chemical and Filtering Suplies Expenses',
            label: 'Chemical and Filtering Suplies Expenses',
        },
        {
            value: 'Training Expenses',
            label: 'Training Expenses',
        },
        {
            value: 'Maintenance and Repair Expenses',
            label: 'Maintenance and Repair Expenses',
        },
        {
            value: 'Other Supplies and Materials',
            label: 'Other Supplies and Materials',
        },
        {
            value: 'Others',
            label: 'Others',
        },
    ];

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(funds?.current_page || 1);
    const [isEditTransactionDialogOpen, setIsEditTransactionDialogOpen] =
        useState(false);
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] =
        useState(false);
    const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
    const [selectedTransaction, setSelectedTransaction] =
        useState<FundTransaction | null>(null);
    const [activeFundId, setActiveFundId] = useState<number | 'all'>(
        urlFundId ? parseInt(urlFundId) : 'all',
    );
    const [selectedYear, setSelectedYear] = useState<number | 'all'>(
        urlYear ? parseInt(urlYear) : 'all',
    );
    const [sortField, setSortField] = useState<string>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // Initialize with first available year and fund immediately (only if not set from URL)
    React.useEffect(() => {
        if (funds?.data && funds.data.length > 0 && selectedYear === 'all') {
            const years = [
                ...new Set(funds.data.map((fund) => fund.source_year)),
            ].sort((a, b) => b - a);
            if (years.length > 0) {
                const firstYear = years[0];
                setSelectedYear(firstYear);

                const fundsForYear = funds.data.filter(
                    (fund) => fund.source_year === firstYear,
                );
                if (fundsForYear.length > 0 && activeFundId === 'all') {
                    setActiveFundId(fundsForYear[0].id);
                }
            }
        }
    }, [funds?.data, selectedYear, activeFundId]);

    // Form field configuration for fund transactions
    const transactionFormFields: FormField[] = [
        {
            name: 'doctrack_no',
            label: 'DocTrack No.',
            type: 'text',
            required: true,
            placeholder: 'e.g., DOC-i9240',
        },
        {
            name: 'pr_no',
            label: 'PR No.',
            type: 'text',
            required: true,
            placeholder: 'e.g., PR-2024-001',
        },
        {
            name: 'specific_items',
            label: 'Specific Items Included',
            type: 'text',
            required: true,
            gridCols: 1,
            placeholder: 'e.g., meals, biopesticide, etc.',
        },
        {
            name: 'category',
            label: 'Category',
            type: 'custom',
            required: true,
            options: categoryOptions,
            customRender: (value: string, onChange?: (value: string) => void) => {
                return !isCustomCategory ? (
                    <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category:
                        </label>
                        <Select
                            value={value}
                            onValueChange={(newValue: string) => {
                                if (newValue === 'Others') {
                                    setIsCustomCategory(true);
                                    onChange?.('');
                                } else {
                                    onChange?.(newValue);
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categoryOptions.map((option: { value: string; label: string }) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </>
                ) : (
                    <div className="flex flex-col gap-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Category:
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange?.(e.target.value)}
                                placeholder="Enter custom category"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsCustomCategory(false);
                                    onChange?.('');
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );
            },
        },
        {
            name: 'amount_pr',
            label: 'Amount of PR',
            type: 'number',
            required: true,
            step: '0.01',
            min: '0',
            placeholder: 'e.g., 5000.00',
        },
        {
            name: 'resolution_no',
            label: 'Resolution No.',
            type: 'text',
            required: true,
            placeholder: 'e.g., RES-2024-001',
            gridCols: 1,
        },
        {
            name: 'supplier',
            label: 'Supplier',
            type: 'text',
            required: true,
            placeholder: 'e.g., ABC Supplies Corp.',
            gridCols: 1,
        },
        {
            name: 'po_no',
            label: 'PO No.',
            type: 'text',
            required: true,
            placeholder: 'e.g., PO-2024-001',
        },
        {
            name: 'amount_po',
            label: 'Amount of PO',
            type: 'number',
            required: true,
            step: '0.01',
            min: '0',
            placeholder: 'e.g., 4500.00',
        },
        {
            name: 'delivery_date',
            label: 'Delivery Date',
            type: 'date',
            gridCols: 1,
            placeholder: 'e.g., 2024-12-31',
        },
        {
            name: 'dv_no',
            label: 'DV No.',
            type: 'text',
            placeholder: 'e.g., DV-2024-001',
        },
        {
            name: 'amount_dv',
            label: 'Amount of DV',
            type: 'number',
            step: '0.01',
            min: '0',
            placeholder: 'e.g., 4500.00',
        },
        {
            name: 'payment_date',
            label: 'Payment Date',
            type: 'date',
            gridCols: 1,
            placeholder: 'e.g., 2024-12-31',
        },
        {
            name: 'remarks',
            label: 'Remarks',
            type: 'text',
            gridCols: 2,
            placeholder: 'e.g., Additional notes or comments',
        },
    ];

    const [transactionFormData, setTransactionFormData] = useState({
        fund_id: '',
        doctrack_no: '',
        pr_no: '',
        specific_items: '',
        category: '',
        amount_pr: '',
        resolution_no: '',
        supplier: '',
        po_no: '',
        amount_po: '',
        delivery_date: '',
        dv_no: '',
        amount_dv: '',
        payment_date: '',
        remarks: '',
    });

    const resetTransactionForm = () => {
        setTransactionFormData({
            fund_id: '',
            doctrack_no: '',
            pr_no: '',
            specific_items: '',
            category: '',
            amount_pr: '',
            resolution_no: '',
            supplier: '',
            po_no: '',
            amount_po: '',
            delivery_date: '',
            dv_no: '',
            amount_dv: '',
            payment_date: '',
            remarks: '',
        });
        setSelectedTransaction(null);
        setIsCustomCategory(false);
    };

    const handleAddTransaction = (fund: Fund) => {
        setSelectedFund(fund);
        resetTransactionForm();
        setTransactionFormData((prev) => ({
            ...prev,
            fund_id: fund.id.toString(),
        }));
        setIsTransactionDialogOpen(true);
    };

    // Get fund from transaction
    const getFundFromTransaction = (
        transaction: FundTransaction,
    ): Fund | undefined => {
        return funds?.data.find((fund) => fund.id === transaction.fund_id);
    };

    const handleEditTransaction = (transaction: FundTransaction) => {
        setSelectedTransaction(transaction);
        setTransactionFormData({
            fund_id: transaction.fund_id.toString(),
            doctrack_no: transaction.doctrack_no,
            pr_no: transaction.pr_no,
            specific_items: transaction.specific_items,
            category: transaction.category,
            amount_pr: transaction.amount_pr.toString(),
            resolution_no: transaction.resolution_no,
            supplier: transaction.supplier,
            po_no: transaction.po_no,
            amount_po: transaction.amount_po.toString(),
            delivery_date: transaction.delivery_date
                ? new Date(transaction.delivery_date)
                      .toISOString()
                      .split('T')[0]
                : '',
            dv_no: transaction.dv_no || '',
            amount_dv: transaction.amount_dv?.toString() || '',
            payment_date: transaction.payment_date
                ? new Date(transaction.payment_date).toISOString().split('T')[0]
                : '',
            remarks: transaction.remarks || '',
        });
        setIsEditTransactionDialogOpen(true);
    };

    const handleDeleteTransaction = (id: number) => {
        if (
            window.confirm('Are you sure you want to delete this transaction?')
        ) {
            router.delete(`/fund-transactions/${id}`, {
                onSuccess: () => {
                    showDeleted(
                        'Transaction Deleted',
                        'Fund transaction has been successfully removed.',
                    );
                    router.get(
                        '/budgetmanagement',
                        {
                            tab: 'allocation',
                            search: searchValue,
                            perPage,
                            page: currentPage,
                            sort: sortField,
                            direction: sortDirection,
                            year: selectedYear,
                            fundId: activeFundId,
                        },
                        { preserveState: true },
                    );
                },
                onError: (errors) => {
                    showError(
                        'Delete Failed',
                        'Unable to delete transaction. Please try again.',
                    );
                    console.error('Error deleting transaction:', errors);
                },
            });
        }
    };

    const handleSubmitTransaction = (e: React.FormEvent) => {
        e.preventDefault();

        const formattedData = {
            ...transactionFormData,
            amount_pr: parseFloat(transactionFormData.amount_pr) || 0,
            amount_po: parseFloat(transactionFormData.amount_po) || 0,
            amount_dv: parseFloat(transactionFormData.amount_dv) || 0,
            delivery_date: transactionFormData.delivery_date
                ? new Date(transactionFormData.delivery_date)
                      .toISOString()
                      .split('T')[0]
                : null,
            payment_date: transactionFormData.payment_date
                ? new Date(transactionFormData.payment_date)
                      .toISOString()
                      .split('T')[0]
                : null,
        };

        router.post('/fund-transactions', formattedData, {
            onSuccess: () => {
                showSuccess(
                    'Transaction Added',
                    'New fund transaction has been successfully created.',
                );
                setIsTransactionDialogOpen(false);
                resetTransactionForm();
                setSelectedFund(null);
                router.get(
                    '/budgetmanagement',
                    {
                        tab: 'allocation',
                        search: searchValue,
                        perPage,
                        page: currentPage,
                        sort: sortField,
                        direction: sortDirection,
                        year: selectedYear,
                        fundId: activeFundId,
                    },
                    { preserveState: true },
                );
            },
            onError: (errors) => {
                showError(
                    'Add Failed',
                    'Unable to add transaction. Please try again.',
                );
                console.error('Error adding transaction:', errors);
            },
        });
    };

    const handleSubmitEditTransaction = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTransaction) return;

        const formattedData = {
            ...transactionFormData,
            amount_pr: parseFloat(transactionFormData.amount_pr) || 0,
            amount_po: parseFloat(transactionFormData.amount_po) || 0,
            amount_dv: parseFloat(transactionFormData.amount_dv) || 0,
            delivery_date: transactionFormData.delivery_date
                ? new Date(transactionFormData.delivery_date)
                      .toISOString()
                      .split('T')[0]
                : null,
            payment_date: transactionFormData.payment_date
                ? new Date(transactionFormData.payment_date)
                      .toISOString()
                      .split('T')[0]
                : null,
        };

        router.put(
            `/fund-transactions/${selectedTransaction.id}`,
            formattedData,
            {
                onSuccess: () => {
                    showSuccess(
                        'Transaction Updated',
                        'Fund transaction has been successfully updated.',
                    );
                    setIsEditTransactionDialogOpen(false);
                    resetTransactionForm();
                    setSelectedTransaction(null);
                    router.get(
                        '/budgetmanagement',
                        {
                            tab: 'allocation',
                            search: searchValue,
                            perPage,
                            page: currentPage,
                            sort: sortField,
                            direction: sortDirection,
                            year: selectedYear,
                            fundId: activeFundId,
                        },
                        { preserveState: true },
                    );
                },
                onError: (errors) => {
                    showError(
                        'Update Failed',
                        'Unable to update transaction. Please try again.',
                    );
                    console.error('Error updating transaction:', errors);
                },
            },
        );
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/budgetmanagement',
            {
                tab: 'allocation',
                search: searchValue,
                perPage,
                page,
                sort: sortField,
                direction: sortDirection,
                year: selectedYear,
                fundId: activeFundId,
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
                tab: 'allocation',
                search: searchValue,
                perPage,
                sort: field,
                direction: newDirection,
                page: 1,
                year: selectedYear,
                fundId: activeFundId,
            },
            { preserveState: true, replace: true },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get unique years from funds
    const availableYears = useMemo(() => {
        if (!funds?.data) return [];
        const years = [
            ...new Set(funds.data.map((fund) => fund.source_year)),
        ].sort((a, b) => b - a);
        return years;
    }, [funds]);

    // Filter funds based on selected year
    const filteredFunds = useMemo(() => {
        if (!funds?.data) return [];
        return funds.data.filter((fund) => fund.source_year === selectedYear);
    }, [funds, selectedYear]);

    // Initialize fund selection when year or filtered funds change
    React.useEffect(() => {
        if (
            filteredFunds.length > 0 &&
            (!activeFundId || !filteredFunds.find((f) => f.id === activeFundId))
        ) {
            setActiveFundId(filteredFunds[0].id);
        }
    }, [filteredFunds, activeFundId]);

    // Sync form data when edit dialog opens (only when opening, not continuously)
    React.useEffect(() => {
        if (
            isEditTransactionDialogOpen &&
            selectedTransaction &&
            !transactionFormData.doctrack_no
        ) {
            setTransactionFormData({
                fund_id: selectedTransaction.fund_id.toString(),
                doctrack_no: selectedTransaction.doctrack_no,
                pr_no: selectedTransaction.pr_no,
                specific_items: selectedTransaction.specific_items,
                category: selectedTransaction.category,
                amount_pr: selectedTransaction.amount_pr.toString(),
                resolution_no: selectedTransaction.resolution_no,
                supplier: selectedTransaction.supplier,
                po_no: selectedTransaction.po_no,
                amount_po: selectedTransaction.amount_po.toString(),
                delivery_date: selectedTransaction.delivery_date
                    ? new Date(selectedTransaction.delivery_date)
                          .toISOString()
                          .split('T')[0]
                    : '',
                dv_no: selectedTransaction.dv_no || '',
                amount_dv: selectedTransaction.amount_dv?.toString() || '',
                payment_date: selectedTransaction.payment_date
                    ? new Date(selectedTransaction.payment_date)
                          .toISOString()
                          .split('T')[0]
                    : '',
                remarks: selectedTransaction.remarks || '',
            });
        }
    }, [isEditTransactionDialogOpen, selectedTransaction]);

    // Filter transactions based on selected fund and year
    const filteredTransactions = useMemo(() => {
        if (!fundTransactions?.data) return [];

        let transactions = fundTransactions.data;

        // Filter by year (always applied since no 'all' option)
        const fundIdsForYear = filteredFunds.map((f) => f.id);
        transactions = transactions.filter((transaction) =>
            fundIdsForYear.includes(transaction.fund_id),
        );

        // Filter by fund if specific fund is selected
        if (activeFundId !== 'all') {
            transactions = transactions.filter(
                (transaction) => transaction.fund_id === activeFundId,
            );
        }

        return transactions;
    }, [fundTransactions, activeFundId, selectedYear, filteredFunds]);

    // Sort transactions
    const sortedTransactions = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => {
            let aValue = a[sortField as keyof FundTransaction];
            let bValue = b[sortField as keyof FundTransaction];

            if (
                sortField.includes('_date') ||
                sortField === 'created_at' ||
                sortField === 'updated_at'
            ) {
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
    }, [filteredTransactions, sortField, sortDirection]);

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

    // Get current fund info
    const currentFund = filteredFunds.find((f) => f.id === activeFundId);

    if (!funds) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">Loading fund data...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                {/* Fund Selection and Controls */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                            {/* Add Transaction Button */}
                            {currentFund && (
                                <Button
                                    onClick={() =>
                                        handleAddTransaction(currentFund)
                                    }
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
                                        // Auto-select first fund when year changes
                                        const fundsForYear = funds?.data.filter(
                                            (fund) =>
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
                                        {availableYears.map((year: number) => (
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
                                    value={activeFundId.toString()}
                                    onValueChange={(value) => {
                                        setActiveFundId(parseInt(value));
                                    }}
                                >
                                    <SelectTrigger className="w-[250px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                        <SelectValue>
                                            {currentFund?.fund_name ||
                                                'Select a fund'}
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
                                                tab: 'allocation',
                                                search: searchValue,
                                                perPage: newPerPage,
                                                year: selectedYear,
                                                fundId: activeFundId,
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
                                    placeholder="Search PRs, POs Status..."
                                    className="w-full md:max-w-md"
                                    searchRoute="/budgetmanagement"
                                    additionalParams={{
                                        tab: 'allocation',
                                        perPage,
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
                                        {currentFund.fund_name}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Transactions Table */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-neutral-800">
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('doctrack_no')
                                        }
                                    >
                                        <div className="flex items-center">
                                            DocTrack No.
                                            <SortIndicator field="doctrack_no" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('pr_no')}
                                    >
                                        <div className="flex items-center">
                                            PR No.
                                            <SortIndicator field="pr_no" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('specific_items')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Specific Items
                                            <SortIndicator field="specific_items" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center">
                                            Category
                                            <SortIndicator field="category" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('amount_pr')}
                                    >
                                        <div className="flex items-center">
                                            Amount PR
                                            <SortIndicator field="amount_pr" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('resolution_no')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Resolution No.
                                            <SortIndicator field="resolution_no" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('supplier')}
                                    >
                                        <div className="flex items-center">
                                            Supplier
                                            <SortIndicator field="supplier" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('po_no')}
                                    >
                                        <div className="flex items-center">
                                            PO No.
                                            <SortIndicator field="po_no" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('amount_po')}
                                    >
                                        <div className="flex items-center">
                                            Amount PO
                                            <SortIndicator field="amount_po" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('balance')}
                                    >
                                        <div className="flex items-center">
                                            Balance
                                            <SortIndicator field="balance" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('delivery_date')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Delivery Date
                                            <SortIndicator field="delivery_date" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('dv_no')}
                                    >
                                        <div className="flex items-center">
                                            DV No.
                                            <SortIndicator field="dv_no" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('amount_dv')}
                                    >
                                        <div className="flex items-center">
                                            Amount DV
                                            <SortIndicator field="amount_dv" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() =>
                                            handleSort('payment_date')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Payment Date
                                            <SortIndicator field="payment_date" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center">
                                            Date Added
                                            <SortIndicator field="created_at" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="group cursor-pointer font-semibold select-none hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        onClick={() => handleSort('remarks')}
                                    >
                                        <div className="flex items-center">
                                            Remarks
                                            <SortIndicator field="remarks" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTransactions.length > 0 ? (
                                    sortedTransactions.map(
                                        (transaction: FundTransaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>
                                                    {transaction.doctrack_no}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.pr_no}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.specific_items}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.category}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        transaction.amount_pr,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.resolution_no}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.supplier}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.po_no}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        transaction.amount_po,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold text-red-600 dark:text-red-400">
                                                    {formatCurrency(
                                                        transaction.amount_pr -
                                                            transaction.amount_po,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.delivery_date
                                                        ? formatDate(
                                                              transaction.delivery_date,
                                                          )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.dv_no || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.amount_dv
                                                        ? formatCurrency(
                                                              transaction.amount_dv,
                                                          )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.payment_date
                                                        ? formatDate(
                                                              transaction.payment_date,
                                                          )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        transaction.created_at,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.remarks || '-'}
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
                                                                        handleEditTransaction(
                                                                            transaction,
                                                                        )
                                                                    }
                                                                >
                                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDeleteTransaction(
                                                                            transaction.id,
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
                                        ),
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={17}
                                            className="h-16 text-center text-gray-500"
                                        >
                                            No data found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {sortedTransactions.length > 0 && (
                        <div className="mt-4">
                            <CustomPagination
                                currentPage={currentPage}
                                totalItems={sortedTransactions.length}
                                perPage={perPage}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Add Transaction Dialog */}
            <FormDialog
                isOpen={isTransactionDialogOpen}
                onOpenChange={(open) =>
                    !open && setIsTransactionDialogOpen(false)
                }
                title={`Source of Fund - ${selectedFund?.fund_name} (${selectedFund?.source_year || selectedYear})`}
                description="Add a new status PRs, POs to this fund"
                fields={transactionFormFields}
                formData={transactionFormData}
                onInputChange={(e) =>
                    setTransactionFormData({
                        ...transactionFormData,
                        [e.target.name]: e.target.value,
                    })
                }
                onSelectChange={(name, value) =>
                    setTransactionFormData({
                        ...transactionFormData,
                        [name]: value,
                    })
                }
                onSubmit={handleSubmitTransaction}
                submitButtonText="Add Status"
            />

            {/* Edit Transaction Dialog */}
            <FormDialog
                isOpen={isEditTransactionDialogOpen}
                onOpenChange={(open) =>
                    !open && setIsEditTransactionDialogOpen(false)
                }
                title={`Source of Fund - ${getFundFromTransaction(selectedTransaction || ({} as FundTransaction))?.fund_name || selectedFund?.fund_name} (${getFundFromTransaction(selectedTransaction || ({} as FundTransaction))?.source_year || selectedFund?.source_year || selectedYear})`}
                description="Update Status PRs, POs details"
                fields={transactionFormFields}
                formData={transactionFormData}
                onInputChange={(e) =>
                    setTransactionFormData({
                        ...transactionFormData,
                        [e.target.name]: e.target.value,
                    })
                }
                onSelectChange={(name, value) =>
                    setTransactionFormData({
                        ...transactionFormData,
                        [name]: value,
                    })
                }
                onSubmit={handleSubmitEditTransaction}
                submitButtonText="Update Transaction"
                isEdit={true}
            />
        </>
    );
}
