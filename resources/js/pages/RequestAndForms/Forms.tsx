import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList, FileText, HardDrive, UserPlus, Search, Users, Settings, Package, AlertTriangle } from 'lucide-react';
import RequestformTabs from './RequestformTabs';
import { useState, useMemo } from 'react';

// Icon mapping for forms
const iconMap = {
    HardDrive,
    ClipboardList,
    Users,
    Settings,
    Package,
    AlertTriangle,
    FileText,
};

// Icon color mapping
const iconColorMap = {
    HardDrive: 'text-blue-500 dark:text-blue-400',
    ClipboardList: 'text-green-500 dark:text-green-400',
    Users: 'text-orange-500 dark:text-orange-400',
    Settings: 'text-gray-500 dark:text-gray-400',
    Package: 'text-yellow-500 dark:text-yellow-400',
    AlertTriangle: 'text-red-500 dark:text-red-400',
    FileText: 'text-purple-500 dark:text-purple-400',
};

// Icon background mapping
const iconBgMap = {
    HardDrive: 'bg-blue-50 dark:bg-blue-950/20',
    ClipboardList: 'bg-green-50 dark:bg-green-950/20',
    Users: 'bg-orange-50 dark:bg-orange-950/20',
    Settings: 'bg-gray-50 dark:bg-gray-950/20',
    Package: 'bg-yellow-50 dark:bg-yellow-950/20',
    AlertTriangle: 'bg-red-50 dark:bg-red-950/20',
    FileText: 'bg-purple-50 dark:bg-purple-950/20',
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Forms',
        href: '/forms',
    },
];

interface Form {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'archived';
    fields: any[];
    submissions_count: number;
    user: {
        name: string;
    };
    icon?: string;
    created_at: string;
    updated_at: string;
}

interface FormsProps {
    forms: Form[];
}

export default function Forms({ forms }: FormsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Only show active forms that users can fill out
    const availableForms = forms.filter(form => form.status === 'active');
    
    // Filter forms based on search term
    const filteredForms = useMemo(() => {
        if (!searchTerm.trim()) {
            return availableForms;
        }
        
        const searchLower = searchTerm.toLowerCase();
        return availableForms.filter(form => 
            form.title.toLowerCase().includes(searchLower) ||
            form.description?.toLowerCase().includes(searchLower)
        );
    }, [availableForms, searchTerm]);

    const getFormIcon = (iconName?: string) => {
        return iconMap[iconName as keyof typeof iconMap] || FileText;
    };

    const getFormColor = (iconName?: string) => {
        return iconColorMap[iconName as keyof typeof iconColorMap] || iconColorMap.FileText;
    };

    const getFormBg = (iconName?: string) => {
        return iconBgMap[iconName as keyof typeof iconBgMap] || iconBgMap.FileText;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Available Forms" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <RequestformTabs activeTab="forms" />
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground border-none">Available Forms</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">Select a form below to submit a new request.</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search forms..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                    {searchTerm && (
                        <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                            Found {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''} matching "{searchTerm}"
                        </div>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredForms.map((form) => {
                        const Icon = getFormIcon(form.icon);
                        const color = getFormColor(form.icon);
                        const bg = getFormBg(form.icon);
                        
                        return (
                            <div
                                key={form.id}
                                className="group relative flex flex-col items-start rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm transition-all hover:shadow-md"
                            >
                                <div className={`mb-3 sm:mb-4 rounded-lg p-2 sm:p-3 ${bg}`}>
                                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
                                </div>
                                <h3 className="mb-2 text-sm sm:text-lg font-semibold text-foreground">{form.title}</h3>
                                <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground">{form.description || 'No description available'}</p>
                                <Link
                                    href={`/forms/${form.id}`}
                                    className="mt-auto inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
                                >
                                    <span className="hidden sm:inline">Fill out form</span>
                                    <span className="sm:hidden">Fill Form</span>
                                    <svg
                                        className="ml-1 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        );
                    })}
                </div>
                
                {filteredForms.length === 0 && (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            {searchTerm ? 'No matching forms found' : 'No available forms'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm 
                                ? `No forms match your search for "${searchTerm}". Try different keywords.` 
                                : 'There are currently no active forms available to fill out.'
                            }
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
