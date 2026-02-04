import { Button } from '@/components/ui/button';
import { usePopupAlert } from '@/components/ui/popup-alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, History, Save, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Document {
    id: number;
    title: string;
    content: string;
    category: string;
    status: 'draft' | 'for review' | 'approved' | 'rejected' | 'posted';
    created_at: string;
    updated_at: string;
    author: {
        id: number;
        name: string;
        email: string;
    };
    histories: Array<{
        id: number;
        action: string;
        user: {
            id: number;
            name: string;
            email: string;
        };
        created_at: string;
    }>;
}

interface PageProps {
    document?: Document;
    tab?: string;
    [key: string]: unknown;
}

export default function EditDocument() {
    const { props } = usePage<PageProps>();
    const document = props.document;
    const sourceTab = props.tab || 'writeup';
    
    // Initialize popup alert hook
    const { showSuccess, showError } = usePopupAlert();

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'posting',
        status: 'draft' as
            | 'draft'
            | 'for review'
            | 'approved'
            | 'rejected'
            | 'posted',
    });

    useEffect(() => {
        if (document) {
            setFormData({
                title: document.title,
                content: document.content,
                category: document.category,
                status: document.status,
            });
        }
    }, [document]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (document) {
            router.put(`/documents/${document.id}`, {
                ...formData,
                tab: sourceTab,
            }, {
                onSuccess: () => {
                    showSuccess("Document Updated", "Document has been successfully updated.");
                },
                onError: (errors) => {
                    showError("Update Failed", "Unable to update document. Please try again.");
                },
            });
        }
    };

    const handleCancel = () => {
        router.get('/writing', { tab: sourceTab });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Writing Management', href: '/writing' },
        { title: 'Edit Document', href: `/editdocument/${document?.id}` },
    ];

    if (!document) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Document" />
                <div className="space-y-6 px-4 py-6">
                    <div className="py-12 text-center">
                        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                            Document Not Found
                        </h1>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            The document you're trying to edit doesn't exist.
                        </p>
                        <Button
                            onClick={handleCancel}
                            className="bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Document" />
            <div className="space-y-6 px-4 py-6">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Edit Form - Left Side (2/3 width) */}
                    <div className="lg:col-span-2">
                        {/* Form */}
                        <div className="w-full max-w-none">
                            <form
                                onSubmit={handleSubmit}
                                className="w-full space-y-6"
                            >
                                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Title
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        title: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                placeholder="Enter document title"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        category: e.target
                                                            .value as
                                                            | 'posting'
                                                            | 'travel_report',
                                                    })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                required
                                            >
                                                <option value="posting">
                                                    Posting
                                                </option>
                                                <option value="travel_report">
                                                    Travel Report
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Status
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        status: e.target
                                                            .value as
                                                            | 'draft'
                                                            | 'for review'
                                                            | 'approved'
                                                            | 'rejected'
                                                            | 'posted',
                                                    })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                required
                                            >
                                                <option value="draft">
                                                    Draft
                                                </option>
                                                <option value="for review">
                                                    For Review
                                                </option>
                                                <option value="approved">
                                                    Approved
                                                </option>
                                                <option value="rejected">
                                                    Rejected
                                                </option>
                                                <option value="posted">
                                                    Posted
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Content
                                            </label>
                                            <textarea
                                                value={formData.content}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        content: e.target.value,
                                                    })
                                                }
                                                rows={12}
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                placeholder="Enter document content"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#163832] text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Document
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* History Sidebar - Right Side (1/3 width) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <History className="h-5 w-5 text-[#163832] dark:text-[#235347]" />
                                Document History
                            </h3>
                            <div className="max-h-[600px] space-y-3 overflow-y-auto">
                                {document.histories.map((history) => {
                                    const getActionDescription = (
                                        action: string,
                                        userName: string,
                                    ) => {
                                        switch (action) {
                                            case 'created':
                                                return `${userName} created this document`;
                                            case 'updated':
                                                return `${userName} updated this document`;
                                            case 'approved':
                                                return `${userName} approved this document`;
                                            case 'liked':
                                                return `${userName} liked your writeup`;
                                            case 'unliked':
                                                return `${userName} removed their like`;
                                            default:
                                                return `${userName} performed ${action} action`;
                                        }
                                    };

                                    return (
                                        <div
                                            key={history.id}
                                            className="border-b border-gray-200 pb-3 last:border-b-0 dark:border-neutral-700"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-medium ${
                                                            history.action ===
                                                            'created'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : history.action ===
                                                                    'updated'
                                                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                  : history.action ===
                                                                      'approved'
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                    : history.action ===
                                                                        'liked'
                                                                      ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                                                                      : history.action ===
                                                                          'unliked'
                                                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        }`}
                                                    >
                                                        {history.action
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            history.action.slice(
                                                                1,
                                                            )}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                                    {formatDate(
                                                        history.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                                                {getActionDescription(
                                                    history.action,
                                                    history.user.name,
                                                )}
                                            </div>
                                            {history.action === 'updated' && (
                                                <div className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Changes may include title,
                                                    content, category, or status
                                                    updates
                                                </div>
                                            )}
                                            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <User className="h-3 w-3" />
                                                <span>{history.user.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {document.histories.length === 0 && (
                                    <p className="py-4 text-center text-gray-500 dark:text-gray-500">
                                        No history available for this document.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
