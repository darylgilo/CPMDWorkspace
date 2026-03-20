import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    ChevronLeft, 
    Download,
    FileText,
    Calendar,
    User,
    Mail,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    notes?: string;
    request_id?: string;
    created_at: string;
    updated_at: string;
    form: {
        id: number;
        title: string;
        description?: string;
        fields: Array<{
            id: string;
            type: string;
            label: string;
            required: boolean;
            options?: string[];
        }>;
    };
    user: {
        id: number;
        name: string;
        email: string;
    };
    responses: FormResponse[];
}

interface HelpdeskFormViewProps {
    submission: FormSubmission;
}

export default function HelpdeskFormView({ submission }: HelpdeskFormViewProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Helpdesk Dashboard',
            href: '/helpdesk',
        },
        {
            title: 'Form Submission',
            href: `/helpdesk/submission/${submission.id}`,
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'submitted':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
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
                return <Clock className="h-4 w-4" />;
            case 'reviewed':
                return <CheckCircle className="h-4 w-4" />;
            case 'approved':
                return <CheckCircle className="h-4 w-4" />;
            case 'rejected':
                return <XCircle className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const formatValue = (value: any, fieldType: string) => {
        if (value === null || value === undefined || value === '') {
            return <span className="text-gray-400 italic">Not provided</span>;
        }

        if (fieldType === 'file' && Array.isArray(value)) {
            return (
                <div className="space-y-2">
                    {value.map((file: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <Download className="h-4 w-4 text-gray-400" />
                            <span>{file.filename}</span>
                            <span className="text-gray-500 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (fieldType === 'textarea') {
            return <div className="whitespace-pre-wrap">{value}</div>;
        }

        if (fieldType === 'checkbox' && Array.isArray(value)) {
            return value.join(', ');
        }

        if (fieldType === 'checkbox' && typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return <div>{value}</div>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Form Submission - ${submission.form.title}`} />
            
            <div className="flex h-full flex-col bg-gray-50 dark:bg-black overflow-y-auto">
                <div className="mx-auto max-w-4xl w-full py-12 px-6">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.history.back()}
                        className="mb-8 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <div className="rounded-xl border bg-white shadow-sm dark:bg-neutral-800 dark:border-neutral-700 overflow-hidden">
                        {/* Header */}
                        <div className="bg-[#163832] p-8 text-white dark:bg-[#235347]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">{submission.form.title}</h1>
                                    <p className="mt-2 opacity-90">{submission.form.description || 'Form submission details'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono">{submission.request_id || `REQ-${String(submission.id).padStart(4, '0')}`}</div>
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)} mt-2`}>
                                        <span className="mr-1">{getStatusIcon(submission.status)}</span>
                                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Submission Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <User className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Submitted By</p>
                                            <p className="font-medium">
                                                {submission.user?.name || submission.submitter_name || 'Unknown User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Submitted On</p>
                                            <p className="font-medium">{formatDate(submission.created_at)}</p>
                                        </div>
                                    </div>
                                    {submission.updated_at !== submission.created_at && (
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500">Last Updated</p>
                                                <p className="font-medium">{formatDate(submission.updated_at)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Responses */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Form Responses
                                </h2>
                                
                                {submission.responses.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg dark:bg-neutral-800">
                                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">No responses provided</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {submission.form.fields.map((field) => {
                                            const response = submission.responses.find(r => r.field_id === field.id);
                                            return (
                                                <div key={field.id} className="border-b border-gray-200 pb-4 last:border-b-0 dark:border-neutral-700">
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    <div className="text-gray-900 dark:text-gray-100">
                                                        {response ? formatValue(response.value, response.field_type) : (
                                                            <span className="text-gray-400 italic">Not provided</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes */}
                            {submission.notes && (
                                <div className="mt-8 p-4 bg-gray-50 rounded-lg dark:bg-neutral-800">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Notes</h3>
                                    <p className="text-gray-900 dark:text-gray-100">{submission.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-700 flex justify-end">
                                <Button 
                                    variant="outline"
                                    onClick={() => window.print()}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
