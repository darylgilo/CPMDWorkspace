import AppLayout from '@/layouts/app-layout';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    BarChart3, 
    Edit3, 
    Eye, 
    FileText, 
    MoreVertical, 
    Plus, 
    Trash2,
    Users,
    Archive,
    Copy,
    Download
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import HelpdeskTabs from './HelpdeskTabs';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Form Management', href: '/form-management' },
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
    created_at: string;
    updated_at: string;
}

interface FormManagementProps {
    forms: Form[];
}

export default function FormManagement({ forms }: FormManagementProps) {
    const [processing, setProcessing] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'archived':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const handleUnarchive = async (formId: number) => {
        if (confirm('Are you sure you want to unarchive this form? It will become active again.')) {
            setProcessing(formId);
            try {
                await router.post(`/forms/${formId}/publish`, {}, {
                    onSuccess: () => {
                        // Forms will be automatically refreshed by Inertia
                    },
                    onError: (errors) => {
                        console.error('Unarchive failed:', errors);
                        alert('Failed to unarchive form. Please try again.');
                    },
                });
            } finally {
                setProcessing(null);
            }
        }
    };

    const handleDelete = async (formId: number) => {
        setDeleteId(formId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        
        setProcessing(deleteId);
        setShowDeleteConfirm(false);
        try {
            await router.delete(`/forms/${deleteId}`, {
                onSuccess: () => {
                    // Forms will be automatically refreshed by Inertia
                },
                onError: (errors) => {
                    console.error('Delete failed:', errors);
                    alert('Failed to delete form. Please try again.');
                },
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleArchive = async (formId: number) => {
        setProcessing(formId);
        try {
            await router.post(`/forms/${formId}/archive`, {}, {
                onSuccess: () => {
                    // Forms will be automatically refreshed by Inertia
                },
                onError: (errors) => {
                    console.error('Archive failed:', errors);
                    alert('Failed to archive form. Please try again.');
                },
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleDuplicate = async (formId: number) => {
        setProcessing(formId);
        try {
            await router.post(`/forms/${formId}/duplicate`, {}, {
                onSuccess: () => {
                    // Forms will be automatically refreshed by Inertia
                },
                onError: (errors) => {
                    console.error('Duplicate failed:', errors);
                    alert('Failed to duplicate form. Please try again.');
                },
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleExport = async (formId: number) => {
        setProcessing(formId);
        try {
            const response = await fetch(`/forms/${formId}/export`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `form-${formId}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export form. Please try again.');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Management" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <HelpdeskTabs activeTab="forms-mgmt" />
                
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 border-none dark:text-gray-100">Form Management</h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Manage and organize your forms</p>
                    </div>
                    <Link href="/forms/create">
                        <Button className="bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white gap-1 sm:gap-2 text-xs sm:text-sm">
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Create New Form</span>
                            <span className="sm:hidden">New Form</span>
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border bg-white p-4 sm:p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="rounded-lg bg-blue-50 p-2 sm:p-3">
                                <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Forms</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{forms.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-lg border bg-white p-4 sm:p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="rounded-lg bg-green-50 p-2 sm:p-3">
                                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Active Forms</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {forms.filter(f => f.status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-lg border bg-white p-4 sm:p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="rounded-lg bg-purple-50 p-2 sm:p-3">
                                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Submissions</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {forms.reduce((sum, form) => sum + form.submissions_count, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Forms Cards */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {forms.map((form) => (
                        <div key={form.id} className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow dark:border-neutral-700 dark:bg-neutral-900">
                            <div className="mb-2 sm:mb-3 flex items-center justify-between">
                                <div className="rounded-lg bg-green-50 p-1 sm:p-1.5 text-green-700">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(form.status)}`}>
                                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                                </span>
                            </div>
                            
                            <h3 className="mb-2 text-sm sm:text-base font-bold text-gray-900 truncate dark:text-gray-100">{form.title}</h3>
                            <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-gray-500 line-clamp-2 dark:text-gray-400">
                                {form.description || 'No description provided'}
                            </div>
                            
                            <div className="mb-3 sm:mb-4 flex flex-col gap-1 sm:gap-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Fields:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{form.fields?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Submissions:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{form.submissions_count}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Created by:</span>
                                    <span className="font-medium text-gray-900 truncate dark:text-gray-100">{form.user?.name || 'Unknown'}</span>
                                </div>
                            </div>

                            <div className="mt-auto border-t border-gray-100 pt-2 sm:pt-3 dark:border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(form.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-1">
                                        <Link href={`/forms/${form.id}/edit`}>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                                                <Edit3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            </Button>
                                        </Link>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                                                    <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                                                    <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleExport(form.id)}>
                                                    <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                                                    Export
                                                </DropdownMenuItem>
                                                {form.status === 'archived' ? (
                                                    <DropdownMenuItem onClick={() => handleUnarchive(form.id)}>
                                                        <Archive className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                                                        Unarchive
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleArchive(form.id)}>
                                                        <Archive className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(form.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {forms.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                        <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4 dark:text-gray-500" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No forms yet</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 dark:text-gray-400">Create your first form to get started</p>
                        <Link href="/forms/create">
                            <Button className="bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Create Form</span>
                                <span className="sm:hidden">Create</span>
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
            
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Form"
                message="Are you sure you want to delete this form? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                isLoading={processing !== null}
                loadingText="Deleting..."
                variant="destructive"
            />
        </AppLayout>
    );
}
