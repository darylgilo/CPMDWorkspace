import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
    section_id?: number | null;
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
    users?: {
        data: User[];
        [key: string]: unknown;
    };
    sections?: Array<{
        id: number;
        name: string;
        code: string;
        office: string;
        display_order: number;
    }>;
    [key: string]: unknown;
}

// Read-only employee profile view for the directory
export default function EmployeeDirectoryView() {
    const { props } = usePage<EmployeeDirectoryViewProps>();
    const { user, users = { data: [] }, sections } = props;

    // State for filters
    const [office, setOffice] = useState<string>('');
    const [cpmd, setCpmd] = useState<string>('');
    const [status, setStatus] = useState<string>('');

    // Define sections for each office
    const officeSections: Record<string, string[]> = {
        'CPMD': [
            'Office of the Chief',
            'OC-Admin Support Unit',
            'OC-Special Project Unit',
            'OC-ICT Unit',
            'BIOCON Section',
            'PFS Section',
            'PHPS Section',
            'Others'
        ],
        'DO': [
            'Office of the Director',
            'Admin Support Unit',
            'Planning Unit',
            'Others'
        ],
        'ADO RDPSS': [
            'Office of the ADO',
            'RDPSS Unit',
            'Admin Support',
            'Others'
        ],
        'ADO RS': [
            'Office of the ADO',
            'Research Services',
            'Admin Support',
            'Others'
        ],
        'PMO': [
            'Project Management',
            'Monitoring Unit',
            'Admin Support',
            'Others'
        ],
        'BIOTECH': [
            'Biotechnology Unit',
            'Research Lab',
            'Admin Support',
            'Others'
        ],
        'NSIC': [
            'Office of the Chief',
            'Information Center',
            'Admin Support',
            'Others'
        ],
        'ADMINISTRATIVE': [
            'HR Unit',
            'Finance Unit',
            'General Services',
            'Others'
        ],
        'CRPSD': [
            'Office of the Chief',
            'Crop Research',
            'Admin Support',
            'Others'
        ],
        'AED': [
            'Office of the Chief',
            'Extension Services',
            'Admin Support',
            'Others'
        ],
        'PPSSD': [
            'Office of the Chief',
            'Plant Services',
            'Admin Support',
            'Others'
        ],
        'NPQSD': [
            'Office of the Chief',
            'Quality Services',
            'Admin Support',
            'Others'
        ],
        'NSQCS': [
            'Office of the Chief',
            'Quality Control',
            'Admin Support',
            'Others'
        ],
        'Others': [
            'General',
            'Support',
            'Others'
        ]
    };

    // Use backend sections or fallback to hardcoded sections
    const sectionsByOffice = useMemo(() => {
        if (sections && sections.length > 0) {
            const grouped: Record<string, { id: number; name: string }[]> = {};
            sections.forEach((section: { id: number; name: string; code: string; office: string; display_order: number }) => {
                if (!grouped[section.office]) {
                    grouped[section.office] = [];
                }
                grouped[section.office].push({ id: section.id, name: section.name });
            });
            return grouped;
        }
        // Convert fallback to object format
        const fallbackGrouped: Record<string, { id: number; name: string }[]> = {};
        Object.entries(officeSections).forEach(([office, sections]) => {
            fallbackGrouped[office] = sections.map((name, index) => ({ id: index + 1, name }));
        });
        return fallbackGrouped;
    }, [sections]);

    // Get current office sections
    const currentOfficeSections: { id: number; name: string }[] = office && office !== 'all' ? sectionsByOffice[office] || [] : [];

    // Get URL parameters on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setOffice(urlParams.get('office') || '');
        setCpmd(urlParams.get('cpmd') || '');
        setStatus(urlParams.get('status') || '');
    }, []);

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
                {/* Back Button and Filters */}
                <div className="mb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            onClick={() => router.get('/directory')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        {/* Filters */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select
                                value={office || 'all'}
                                onValueChange={(val) => {
                                    const newValue = val === 'all' ? '' : val;
                                    const params = new URLSearchParams(window.location.search);
                                    if (newValue) {
                                        params.set('office', newValue);
                                    } else {
                                        params.delete('office');
                                    }
                                    params.delete('cpmd'); // Reset section when office changes
                                    router.get(`/directory?${params.toString()}`);
                                }}
                            >
                                <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue placeholder="All Offices" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem
                                        value="all"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        All Offices
                                    </SelectItem>
                                    <SelectItem
                                        value="DO"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        DO
                                    </SelectItem>
                                    <SelectItem
                                        value="ADO RDPSS"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        ADO RDPSS
                                    </SelectItem>
                                    <SelectItem
                                        value="ADO RS"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        ADO RS
                                    </SelectItem>
                                    <SelectItem
                                        value="PMO"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        PMO
                                    </SelectItem>
                                    <SelectItem
                                        value="BIOTECH"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        BIOTECH
                                    </SelectItem>
                                    <SelectItem
                                        value="NSIC"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        NSIC
                                    </SelectItem>
                                    <SelectItem
                                        value="ADMINISTRATIVE"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        ADMINISTRATIVE
                                    </SelectItem>
                                    <SelectItem
                                        value="CPMD"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        CPMD
                                    </SelectItem>
                                    <SelectItem
                                        value="CRPSD"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        CRPSD
                                    </SelectItem>
                                    <SelectItem
                                        value="AED"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        AED
                                    </SelectItem>
                                    <SelectItem
                                        value="PPSSD"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        PPSSD
                                    </SelectItem>
                                    <SelectItem
                                        value="NPQSD"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        NPQSD
                                    </SelectItem>
                                    <SelectItem
                                        value="NSQCS"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        NSQCS
                                    </SelectItem>
                                    <SelectItem
                                        value="Others"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        Others
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={cpmd || 'all'}
                                onValueChange={(val) => {
                                    const newValue = val === 'all' ? '' : val;
                                    const params = new URLSearchParams(window.location.search);
                                    if (newValue) {
                                        params.set('cpmd', newValue);
                                    } else {
                                        params.delete('cpmd');
                                    }
                                    router.get(`/directory?${params.toString()}`);
                                }}
                                disabled={!office || office === 'all'}
                            >
                                <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950 disabled:opacity-50">
                                    <SelectValue placeholder={office && office !== 'all' ? "All Sections" : "Select office first"} />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem
                                        value="all"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        All Sections
                                    </SelectItem>
                                    {currentOfficeSections.map((section: { id: number; name: string }) => (
                                        <SelectItem
                                            key={section.id}
                                            value={section.name}
                                            className="cursor-pointer hover:bg-[#1a4d3e]"
                                        >
                                            {section.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={status || 'all'}
                                onValueChange={(val) => {
                                    const newValue = val === 'all' ? '' : val;
                                    const params = new URLSearchParams(window.location.search);
                                    if (newValue) {
                                        params.set('status', newValue);
                                    } else {
                                        params.delete('status');
                                    }
                                    router.get(`/directory?${params.toString()}`);
                                }}
                            >
                                <SelectTrigger className="w-full border-gray-300 sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue placeholder="Employment Status" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem
                                        value="all"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        Employment Status
                                    </SelectItem>
                                    <SelectItem
                                        value="Regular"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        Regular
                                    </SelectItem>
                                    <SelectItem
                                        value="COS"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        COS (Contract of Service)
                                    </SelectItem>
                                    <SelectItem
                                        value="Job Order"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        Job Order
                                    </SelectItem>
                                    <SelectItem
                                        value="Others"
                                        className="cursor-pointer hover:bg-[#1a4d3e]"
                                    >
                                        Others
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
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
                                    {user?.office === 'CPMD' && (
                                        <>
                                            <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400">
                                                Section/Unit
                                            </div>
                                            <div className="text-base text-gray-900 dark:text-gray-100">
                                                {user?.section_id ? sections?.find(s => s.id === user.section_id)?.name || '—' : '—'}
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
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
