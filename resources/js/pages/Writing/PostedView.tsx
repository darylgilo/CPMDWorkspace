import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react';

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
}

interface PageProps {
    document: Document;
    auth?: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Writing Management', href: '/writing' },
    { title: 'Posted', href: '/writing?tab=posted' },
    { title: 'View Document', href: '#' },
];

export default function PostedView() {
    const { props } = usePage<PageProps>();
    const { document } = props;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateForBlog = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            case 'for review':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'posted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={document.title} />
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.get('/writing?tab=posted')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    {/* Document Card */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                        {/* Card Header */}
                        <div className="border-b border-gray-200 p-8 dark:border-neutral-700">
                            <div className="mb-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(document.status)}`}
                                >
                                    {document.status.charAt(0).toUpperCase() +
                                        document.status.slice(1)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {document.category === 'posting'
                                        ? 'Posting'
                                        : 'Travel Report'}
                                </span>
                            </div>
                            <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                                {document.title}
                            </h1>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <User className="h-4 w-4" />
                                    <span>{document.author.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {formatDateForBlog(document.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-8">
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <div
                                    className="leading-relaxed text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{
                                        __html: document.content,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="border-t border-gray-200 bg-gray-50 p-8 dark:border-neutral-700 dark:bg-neutral-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Last updated: {formatDate(document.updated_at)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
