import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status?: string;
    profile_picture?: string;
    position?: string;
    employment_status?: string;
    hiring_date?: string;
    office?: string;
    cpmd?: string;
    employee_id?: string;
    item_number?: string;
    gender?: string;
    tin_number?: string;
    landbank_number?: string;
    gsis_number?: string;
    address?: string;
    date_of_birth?: string;
    mobile_number?: string;
    contact_person?: string | null;
    contact_number?: string | null;
    [key: string]: unknown;
}

interface EmployeeDirectoryViewProps extends PageProps {
    auth: {
        user?: User;
    };
    user: User | null;
    [key: string]: unknown;
}

// Read-only employee profile view for the directory
export default function EmployeeDirectoryView() {
    const { props } = usePage<EmployeeDirectoryViewProps>();
    const { user } = props;

    if (!user) {
        return (
            <AppLayout
                breadcrumbs={[
                    { title: 'Employee Directory', href: '/directory' },
                    { title: 'Employee Not Found', href: '#' },
                ]}
            >
                <div className="flex h-64 items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Employee not found or you don't have permission to view
                        this profile.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Employee Directory', href: '/directory' },
                {
                    title: user?.name || 'Employee',
                    href: `/directory/${user?.id}`,
                },
            ]}
        >
            <Head title={user?.name ? `${user.name} • Employee` : 'Employee'} />

            <div className="p-4">
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Left: profile summary card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-1 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex flex-col items-center gap-3">
                            <div className="mt-1 text-xs">
                                <span
                                    className={`${user?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'} rounded-full px-2 py-0.5`}
                                >
                                    {user?.status || '—'}
                                </span>
                            </div>
                            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-muted dark:border-neutral-700">
                                {user?.profile_picture ? (
                                    <img
                                        src={`/storage/${user.profile_picture}`}
                                        className="h-full w-full object-cover"
                                        alt={user?.name}
                                    />
                                ) : (
                                    <svg
                                        className="h-12 w-12 text-muted-foreground"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {user?.name}
                                </div>
                                <div className="text-base text-gray-500 dark:text-neutral-400">
                                    {user?.position || '—'}
                                </div>
                                <div className="mt-4 space-y-2 text-center">
                                    <div className="text-sm text-gray-500 dark:text-neutral-400">
                                        Employment Status
                                    </div>
                                    <div className="text-base text-gray-900 dark:text-gray-100">
                                        {user?.employment_status || '—'}
                                    </div>
                                    <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400">
                                        Hiring Date
                                    </div>
                                    <div className="text-base text-gray-900 dark:text-gray-100">
                                        {user?.hiring_date || '—'}
                                    </div>
                                    <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400">
                                        Office
                                    </div>
                                    <div className="text-base text-gray-900 dark:text-gray-100">
                                        {user.office || 'No office assigned'}
                                    </div>
                                    {user.position && (
                                        <p className="text-sm text-muted-foreground">
                                            {user.position}
                                        </p>
                                    )}
                                    {user?.office === 'CPMD' && (
                                        <>
                                            <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400">
                                                Section/Unit
                                            </div>
                                            <div className="text-base text-gray-900 dark:text-gray-100">
                                                {user?.cpmd || '—'}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: details display */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                Personal Information
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                Additional Details
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                Emergency Contact
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div className="space-y-4">
                                <div className="text-sm text-gray-500 dark:text-neutral-400">
                                    Name
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.name || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Email
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.email || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Employee ID No.
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.employee_id || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Position
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.position || '—'}
                                </div>
                                {user?.employment_status === 'Regular' && (
                                    <>
                                        <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                            Item Number
                                        </div>
                                        <div className="text-base text-gray-900 dark:text-gray-100">
                                            {user?.item_number || '—'}
                                        </div>
                                    </>
                                )}
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Gender
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.gender || '—'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-sm text-gray-500 dark:text-neutral-400">
                                    Hiring Date
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.hiring_date || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    TIN Number
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.tin_number || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Landbank Number
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.landbank_number || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    GSIS Number
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.gsis_number || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Address
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.address || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Date of Birth
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.date_of_birth || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Mobile Number
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.mobile_number || '—'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-sm text-gray-500 dark:text-neutral-400">
                                    Contact Person
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.contact_person || '—'}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 dark:text-neutral-400">
                                    Contact Number
                                </div>
                                <div className="text-base text-gray-900 dark:text-gray-100">
                                    {user?.contact_number || '—'}
                                </div>
                            </div>
                        </div>
                        <div className="py-6">
                            <Separator className="bg-gray-200 dark:bg-neutral-700" />
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => router.get('/directory')}
                                className="inline-flex w-fit max-w-fit shrink-0 items-center gap-2 rounded-md bg-[#163832] px-3 py-2 whitespace-nowrap text-white hover:bg-[#163832]/90 sm:self-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            >
                                Back to directory
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
