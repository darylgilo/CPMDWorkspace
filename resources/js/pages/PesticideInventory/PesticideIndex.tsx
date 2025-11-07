import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Package, TruckIcon } from 'lucide-react';

// Import child components
import PesticideInventory from './Pesticide';
import Distribution from './Distribution';

interface PageProps {
    activeTab?: string;
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesticide Management', href: '/pesticidesindex' },
];

export default function PesticideIndex() {
    const { props } = usePage<PageProps>();
    const { activeTab: activeTabProp = 'inventory' } = props;

    const [activeTab, setActiveTab] = useState(activeTabProp);

    // Sync state with prop changes when navigating between tabs
    useEffect(() => {
        setActiveTab(activeTabProp);
    }, [activeTabProp]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        // Pure client-side tab switching - no server request
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pesticide Management" />
            <div className="flex flex-col gap-4 p-4">
                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-700">
                    <button
                        onClick={() => handleTabChange('inventory')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                            activeTab === 'inventory'
                                ? 'border-b-2 border-[#163832] text-[#163832] dark:border-[#235347] dark:text-[#DAF1DE]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        <Package className="h-4 w-4" />
                        Inventory
                    </button>
                    <button
                        onClick={() => handleTabChange('distribution')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                            activeTab === 'distribution'
                                ? 'border-b-2 border-[#163832] text-[#163832] dark:border-[#235347] dark:text-[#DAF1DE]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        <TruckIcon className="h-4 w-4" />
                        Distribution
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'inventory' && <PesticideInventory />}
                    {activeTab === 'distribution' && <Distribution />}
                </div>
            </div>
        </AppLayout>
    );
}
