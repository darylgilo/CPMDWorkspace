import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { DollarSign, Wallet, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import child components
// Budget Management System - Main index with tabs
import SourceofFund from './SourceofFund';
import BudgetAllocation from './BudgetAllocation';
import TravelExpenses from './TravelExpenses';
import BudgetReports from './BudgetReports';

interface TravelExpense {
    id: number;
    doctrack_no: string;
    name: string;
    date_of_travel: string;
    destination: string;
    purpose: string;
    amount: number;
    source_of_fund: string;
    status: 'pending' | 'approved' | 'rejected';
    remarks: string | null;
    created_at: string;
}

interface PageProps {
    activeTab?: string;
    travelExpenses?: {
        data: TravelExpense[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters?: {
        search?: string;
    };
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Budget Management', href: '/budgetmanagement' },
];

const navItems: Array<Omit<NavItem, 'href'> & { href: string }> = [
    {
        title: 'Source of Fund',
        href: '#source',
        icon: Wallet,
    },
    {
        title: 'PRs, POs Status ',
        href: '#allocation',
        icon: DollarSign,
    },
    {
        title: 'TEV Status',
        href: '#travel-expenses',
        icon: Receipt,
    },
    {
        title: 'Reports',
        href: '#reports',
        icon: Receipt,
    },
];

export default function BudgetManagementIndex() {
    const props = usePage<PageProps>().props;
    const { activeTab: activeTabProp = 'source' } = props;
    const [activeTab, setActiveTab] = useState(activeTabProp);

    // Sync state with prop changes when navigating between tabs
    useEffect(() => {
        setActiveTab(activeTabProp);
    }, [activeTabProp]);

    const handleTabChange = (tab: string) => {
        // Use Inertia router to navigate with query parameters
        router.get(
            '/budgetmanagement',
            { tab },
            { preserveState: true, replace: true },
        );
    };

    // Handle browser back/forward buttons and initial hash navigation
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (
            hash &&
            (hash === 'source' || hash === 'allocation' || hash === 'travel-expenses' || hash === 'reports')
        ) {
            // If there's a hash in the URL, navigate to that tab using query params
            router.get(
                '/budgetmanagement',
                { tab: hash },
                { preserveState: true, replace: true },
            );
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Budget Management" />
            <div className="space-y-6 px-4 py-6">
                {/* Header Navigation */}
                <div className="border-b border-gray-200 dark:border-neutral-700">
                    <nav className="flex space-x-2">
                        {navItems.map((item, index) => {
                            const isActive =
                                activeTab === item.href.substring(1);
                            return (
                                <Button
                                    key={`${item.href}-${index}`}
                                    variant="ghost"
                                    className={cn(
                                        'rounded-none px-4 py-3 font-medium transition-colors',
                                        'border-b-2 border-transparent',
                                        'hover:bg-transparent hover:text-foreground',
                                        'focus-visible:ring-0 focus-visible:ring-offset-0',
                                        {
                                            'border-primary text-foreground':
                                                isActive,
                                            'text-muted-foreground hover:border-b-accent':
                                                !isActive,
                                        },
                                    )}
                                    onClick={() =>
                                        handleTabChange(item.href.substring(1))
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        {item.icon && (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        {item.title}
                                    </div>
                                </Button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="w-full">
                    <section className="w-full">
                        {/* Tab Content */}
                        <div className="tab-content">
                            {activeTab === 'source' && <SourceofFund />}
                            {activeTab === 'allocation' && <BudgetAllocation />}
                            {activeTab === 'travel-expenses' && <TravelExpenses />}
                            {activeTab === 'reports' && <BudgetReports />}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
