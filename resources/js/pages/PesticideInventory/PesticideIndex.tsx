import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Package, TruckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import child components
import Distribution from './Distribution';
import PesticideInventory from './Pesticide';

interface PageProps {
    activeTab?: string;
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesticide Management', href: '/pesticidesindex' },
];

const navItems: Array<Omit<NavItem, 'href'> & { href: string }> = [
    {
        title: 'Inventory',
        href: '#inventory',
        icon: Package,
    },
    {
        title: 'Distribution',
        href: '#distribution',
        icon: TruckIcon,
    },
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
        // Update the URL hash without causing a page reload
        window.history.pushState({}, '', `#${tab}`);
    };

    // Handle browser back/forward buttons
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1);
            if (hash && (hash === 'inventory' || hash === 'distribution')) {
                setActiveTab(hash);
            }
        };

        window.addEventListener('popstate', handleHashChange);
        return () => window.removeEventListener('popstate', handleHashChange);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pesticide Management" />
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
                            {activeTab === 'inventory' && (
                                <PesticideInventory />
                            )}
                            {activeTab === 'distribution' && <Distribution />}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
