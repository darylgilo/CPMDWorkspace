import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FormSubmissionProps {
    submission: {
        id: number;
        form_title: string;
        user: string;
        submitter_email: string;
        issue: string;
        status: 'submitted' | 'in_progress' | 'resolved' | 'rejected';
        assigned_user?: string;
        priority: 'High' | 'Medium' | 'Normal' | 'Low';
        date: string;
        created_at: string;
    };
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Helpdesk Dashboard',
        href: '/helpdesk',
    },
    {
        title: 'Form Submission',
        href: '/helpdesk/submission',
    },
];

export default function FormSubmission({ submission, users }: FormSubmissionProps) {
    const [selectedStatus, setSelectedStatus] = useState(submission.status);
    const [assignedTo, setAssignedTo] = useState(submission.assigned_user || '');

    const handleStatusChange = (newStatus: string) => {
        router.patch(`/helpdesk/tickets/${submission.id}/status`, { status: newStatus }, {
            onSuccess: () => {
                setSelectedStatus(newStatus as any);
                router.reload();
            }
        });
    };

    const handleAssignment = (userId: string) => {
        router.patch(`/helpdesk/tickets/${submission.id}/assign`, { assigned_to: userId }, {
            onSuccess: () => {
                router.reload();
            }
        });
    };

    const statusColors = {
        submitted: 'bg-red-100 text-red-800',
        in_progress: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800',
        rejected: 'bg-gray-100 text-gray-800',
    };

    const priorityColors = {
        High: 'text-red-600',
        Medium: 'text-orange-600',
        Normal: 'text-blue-600',
        Low: 'text-gray-600',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Form Submission - ${submission.form_title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 border-none">Form Submission Details</h1>
                        <p className="text-gray-500">View and manage form submission information.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ticket ID</label>
                                <p className="text-gray-900 font-medium">#{submission.id}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Form Title</label>
                                <p className="text-gray-900">{submission.form_title}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Submitted By</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                        {submission.user[0]}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{submission.user}</div>
                                        <div className="text-xs text-gray-500">{submission.submitter_email}</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Issue Description</label>
                                <p className="text-gray-900 mt-1">{submission.issue}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Priority</label>
                                <p className={`font-medium mt-1 ${priorityColors[submission.priority as keyof typeof priorityColors]}`}>
                                    {submission.priority}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                                <p className="text-gray-900 mt-1">{new Date(submission.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Management</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Current Status</label>
                                <div className="mt-1">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColors[selectedStatus as keyof typeof statusColors]}`}>
                                        {selectedStatus.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Update Status</label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleStatusChange('in_progress')}
                                        disabled={selectedStatus === 'in_progress'}
                                    >
                                        In Progress
                                    </Button>
                                    <Button
                                        variant={selectedStatus === 'resolved' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleStatusChange('resolved')}
                                        disabled={selectedStatus === 'resolved'}
                                    >
                                        Resolved
                                    </Button>
                                    <Button
                                        variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleStatusChange('rejected')}
                                        disabled={selectedStatus === 'rejected'}
                                    >
                                        Rejected
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Assigned To</label>
                                {submission.assigned_user ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                            {submission.assigned_user[0]}
                                        </div>
                                        <span className="text-sm text-gray-900">{submission.assigned_user}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500">Unassigned</span>
                                )}
                                <select
                                    onChange={(e) => handleAssignment(e.target.value)}
                                    className="w-full mt-2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Assign to...</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/helpdesk')}
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
