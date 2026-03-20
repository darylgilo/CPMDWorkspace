import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { MoreVertical, Search, FileText, Calendar, User, Eye } from 'lucide-react';
import RequestformTabs from './RequestformTabs';
import CustomPagination from '@/components/CustomPagination';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Requests',
        href: '/requests',
    },
];

interface FormResponse {
    id: number;
    field_id: string;
    field_type: string;
    field_label: string;
    value: any;
}

interface FormSubmission {
    id: number;
    form_id: number;
    user_id: number;
    submitter_name: string;
    submitter_email: string;
    status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
    notes: string;
    created_at: string;
    updated_at: string;
    request_id?: string;
    form: {
        id: number;
        title: string;
        description: string;
    };
    responses: FormResponse[];
}

interface RequestsProps {
    submissions?: FormSubmission[];
    currentPage?: number;
    perPage?: number;
    total?: number;
}

export default function Requests({ submissions = [], currentPage = 1, perPage = 10, total = 0 }: RequestsProps) {
    // Debug: Log the submissions data
    console.log('Submissions data:', submissions);
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'submitted':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
            case 'reviewed':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'submitted':
                return '🕐';
            case 'reviewed':
                return '👁️';
            case 'approved':
                return '✅';
            case 'rejected':
                return '❌';
            default:
                return '📋';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getSubmissionDescription = (responses: FormResponse[]) => {
        // Find the most relevant field to use as description
        const textFields = responses.filter(r => 
            r.field_type === 'text' || r.field_type === 'textarea'
        );
        
        if (textFields.length > 0) {
            const value = textFields[0].value;
            return typeof value === 'string' 
                ? (value.length > 100 ? value.substring(0, 100) + '...' : value)
                : String(value);
        }
        
        // Fallback to first response
        if (responses.length > 0) {
            const value = responses[0].value;
            return typeof value === 'string' ? value : String(value);
        }
        
        return 'No description available';
    };

    const getRequestId = (submission: FormSubmission) => {
        return submission.request_id || `REQ-${String(submission.id).padStart(4, '0')}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Requests" />
            <div className="flex h-full flex-col gap-4 p-4">
                <RequestformTabs activeTab="requests" />
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground border-none">My Requests</h1>
                        <p className="text-muted-foreground">Track the status of your submitted forms.</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            className="pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                    </div>
                </div>

                {submissions.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No requests yet</h3>
                        <p className="text-muted-foreground mb-4">You haven't submitted any forms yet.</p>
                        <Link href="/forms">
                            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg">
                                Browse Forms
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Ticket #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Form
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {submissions.map((submission: FormSubmission) => (
                                        <tr key={submission.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground text-blue-600">
                                                {getRequestId(submission)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">
                                                    {submission.form.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-muted-foreground max-w-xs truncate">
                                                    {getSubmissionDescription(submission.responses)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                                                    {submission.status.replace(/_/g, ' ').charAt(0).toUpperCase() + submission.status.replace(/_/g, ' ').slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(submission.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link href={`/requests/${submission.id}`}>
                                                    <button className="text-primary hover:text-primary/80 font-medium text-sm flex items-center justify-center p-2">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3 p-4">
                            {submissions.map((submission: FormSubmission) => (
                                <div key={submission.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 shadow-sm">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {getRequestId(submission)}
                                                </span>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                                                    {submission.status.replace(/_/g, ' ').charAt(0).toUpperCase() + submission.status.replace(/_/g, ' ').slice(1)}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {submission.form.title}
                                            </h3>
                                        </div>
                                        <Link href={`/requests/${submission.id}`}>
                                            <button className="text-primary hover:text-primary/80 p-2">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </Link>
                                    </div>

                                    {/* Description */}
                                    {getSubmissionDescription(submission.responses) !== 'No description available' && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                                {getSubmissionDescription(submission.responses)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Date */}
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(submission.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Pagination */}
                {submissions.length > 0 && (
                    <div className="mt-4">
                        <CustomPagination
                            currentPage={currentPage}
                            totalItems={total}
                            perPage={perPage}
                            onPageChange={(page) => {
                                // Navigate to new page with query parameter
                                const url = new URL(window.location.href);
                                url.searchParams.set('page', page.toString());
                                window.location.href = url.toString();
                            }}
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
