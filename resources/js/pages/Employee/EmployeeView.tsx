import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';

// Employee profile view/edit page component
export default function EmployeeView() {
    // Grab server-provided user payload from Inertia page props
    const pageProps = usePage().props as any;
    const { user, auth } = pageProps;

    interface FormData {
        name: string;
        email: string;
        employee_id: string;
        position: string;
        employment_status: 'Regular' | 'COS' | 'Job Order' | 'Others';
        office:
            | 'DO'
            | 'ADO'
            | 'CPMD'
            | 'AED'
            | 'NSQCS'
            | 'NPQSD'
            | 'NSIC'
            | 'CRPSD'
            | 'PPSSD'
            | 'ADMINISTRATIVE'
            | 'Others';
        cpmd:
            | ''
            | 'BIOCON section'
            | 'PFS section'
            | 'PHPS SECTION'
            | 'OC-Admin Support Unit'
            | 'OC-ICT Unit'
            | 'OC-Special Project'
            | 'Others';
        tin_number: string;
        gsis_number: string;
        address: string;
        date_of_birth: string;
        hiring_date: string;
        item_number: string;
        gender: 'Male' | 'Female';
        mobile_number: string;
        contact_person: string;
        contact_number: string;
        status: 'active' | 'inactive';
    }

    // Initialize form with user values
    const initialData: FormData = {
        name: user?.name || '',
        email: user?.email || '',
        employee_id: user?.employee_id || '',
        position: user?.position || '',
        employment_status: (user?.employment_status ||
            'Regular') as FormData['employment_status'],
        office: (user?.office || 'Others') as FormData['office'],
        cpmd: (user?.cpmd || '') as FormData['cpmd'],
        tin_number: user?.tin_number || '',
        gsis_number: user?.gsis_number || '',
        address: user?.address || '',
        date_of_birth: user?.date_of_birth || '',
        hiring_date: user?.hiring_date || '',
        item_number: user?.item_number || '',
        gender: (user?.gender || 'Male') as FormData['gender'],
        mobile_number: user?.mobile_number || '',
        contact_person: user?.contact_person || '',
        contact_number: user?.contact_number || '',
        status: (user?.status || 'inactive') as FormData['status'],
    };

    // Inertia form helper for PUT updates
    const { data, setData, put, processing, errors } =
        useForm<FormData>(initialData);

    const isProtectedSuperadmin =
        auth?.user?.role !== 'superadmin' && user?.role === 'superadmin';

    // Submit updated employee details
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isProtectedSuperadmin) return;
        put(`/employees/${user?.id}`);
    };

    // Reset form back to initial user values and navigate back to employees list
    const onCancel = () => {
        setData(initialData);
        router.get('/employees');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Employee Management', href: '/employees' },
                {
                    title: user?.name || 'Employee',
                    href: `/employees/${user?.id}`,
                },
            ]}
        >
            <Head title={user?.name ? `${user.name} • Employee` : 'Employee'} />

            <div className="p-4">
                {/* Back to employees list */}
                {/*
        <button
          onClick={() => router.get('/employees')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded border bg-white hover:bg-gray-50 text-gray-900 border-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-gray-100 dark:border-neutral-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </button>
        */}

                {/* Main layout: left static profile card, right editable form */}
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
                                        {user?.office || '—'}
                                    </div>
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

                    {/* Right: editable details form */}
                    <form
                        onSubmit={onSubmit}
                        className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                                {/* Column 1: Personal Information */}
                                <div className="space-y-6">
                                    <HeadingSmall
                                        title="Personal Information"
                                        description=""
                                    />
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="employee_id">
                                                Employee ID No.
                                            </Label>
                                            <Input
                                                id="employee_id"
                                                value={data.employee_id}
                                                onChange={(e) =>
                                                    setData(
                                                        'employee_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="position">
                                                Position
                                            </Label>
                                            <Input
                                                id="position"
                                                value={data.position}
                                                onChange={(e) =>
                                                    setData(
                                                        'position',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="employment_status">
                                                Employment Status
                                            </Label>
                                            <select
                                                id="employment_status"
                                                value={data.employment_status}
                                                onChange={(e) =>
                                                    setData(
                                                        'employment_status',
                                                        e.target
                                                            .value as FormData['employment_status'],
                                                    )
                                                }
                                                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-foreground"
                                            >
                                                <option value="Regular">
                                                    Regular
                                                </option>
                                                <option value="COS">COS</option>
                                                <option value="Job Order">
                                                    Job Order
                                                </option>
                                                <option value="Others">
                                                    Others
                                                </option>
                                            </select>
                                        </div>
                                        {data.employment_status ===
                                            'Regular' && (
                                            <div>
                                                <Label htmlFor="item_number">
                                                    Item Number
                                                </Label>
                                                <Input
                                                    id="item_number"
                                                    value={data.item_number}
                                                    onChange={(e) =>
                                                        setData(
                                                            'item_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <Label htmlFor="office">
                                                Office
                                            </Label>
                                            <select
                                                id="office"
                                                value={data.office}
                                                onChange={(e) => {
                                                    const val = e.target
                                                        .value as FormData['office'];
                                                    setData('office', val);
                                                    if (val !== 'CPMD') {
                                                        setData(
                                                            'cpmd',
                                                            'Others' as FormData['cpmd'],
                                                        );
                                                    }
                                                }}
                                                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-foreground"
                                            >
                                                <option value="DO">DO</option>
                                                <option value="ADO">ADO</option>
                                                <option value="CPMD">
                                                    CPMD
                                                </option>
                                                <option value="AED">AED</option>
                                                <option value="NSQCS">
                                                    NSQCS
                                                </option>
                                                <option value="NPQSD">
                                                    NPQSD
                                                </option>
                                                <option value="NSIC">
                                                    NSIC
                                                </option>
                                                <option value="CRPSD">
                                                    CRPSD
                                                </option>
                                                <option value="PPSSD">
                                                    PPSSD
                                                </option>
                                                <option value="ADMINISTRATIVE">
                                                    ADMINISTRATIVE
                                                </option>
                                                <option value="Others">
                                                    Others
                                                </option>
                                            </select>
                                        </div>
                                        {data.office === 'CPMD' && (
                                            <div>
                                                <Label htmlFor="cpmd">
                                                    Section/Unit
                                                </Label>
                                                <select
                                                    id="cpmd"
                                                    value={data.cpmd}
                                                    onChange={(e) =>
                                                        setData(
                                                            'cpmd',
                                                            e.target
                                                                .value as FormData['cpmd'],
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-foreground"
                                                >
                                                    <option value="BIOCON section">
                                                        BIOCON section
                                                    </option>
                                                    <option value="PFS section">
                                                        PFS section
                                                    </option>
                                                    <option value="PHPS SECTION">
                                                        PHPS SECTION
                                                    </option>
                                                    <option value="OC-Admin Support Unit">
                                                        OC-Admin Support Unit
                                                    </option>
                                                    <option value="OC-ICT Unit">
                                                        OC-ICT Unit
                                                    </option>
                                                    <option value="OC-Special Project">
                                                        OC-Special Project
                                                    </option>
                                                    <option value="Others">
                                                        Others
                                                    </option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Additional Details */}
                                <div className="space-y-6">
                                    <HeadingSmall
                                        title="Additional Details"
                                        description=""
                                    />
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="hiring_date">
                                                Hiring Date
                                            </Label>
                                            <Input
                                                id="hiring_date"
                                                type="date"
                                                value={data.hiring_date}
                                                onChange={(e) =>
                                                    setData(
                                                        'hiring_date',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="tin_number">
                                                TIN Number
                                            </Label>
                                            <Input
                                                id="tin_number"
                                                value={data.tin_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'tin_number',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="gsis_number">
                                                GSIS Number
                                            </Label>
                                            <Input
                                                id="gsis_number"
                                                value={data.gsis_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'gsis_number',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="address">
                                                Address
                                            </Label>
                                            <Input
                                                id="address"
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="date_of_birth">
                                                Date of Birth
                                            </Label>
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                value={data.date_of_birth}
                                                onChange={(e) =>
                                                    setData(
                                                        'date_of_birth',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="gender">
                                                Gender
                                            </Label>
                                            <select
                                                id="gender"
                                                value={data.gender}
                                                onChange={(e) =>
                                                    setData(
                                                        'gender',
                                                        e.target
                                                            .value as FormData['gender'],
                                                    )
                                                }
                                                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-foreground"
                                            >
                                                <option value="Male">
                                                    Male
                                                </option>
                                                <option value="Female">
                                                    Female
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="mobile_number">
                                                Mobile Number
                                            </Label>
                                            <Input
                                                id="mobile_number"
                                                value={data.mobile_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'mobile_number',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Emergency Contact */}
                                <div className="space-y-6">
                                    <HeadingSmall
                                        title="Emergency Contact"
                                        description=""
                                    />
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="contact_person">
                                                Contact Person
                                            </Label>
                                            <Input
                                                id="contact_person"
                                                value={data.contact_person}
                                                onChange={(e) =>
                                                    setData(
                                                        'contact_person',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="contact_number">
                                                Contact Number
                                            </Label>
                                            <Input
                                                id="contact_number"
                                                value={data.contact_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'contact_number',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="py-2">
                                <Separator className="bg-gray-200 dark:bg-neutral-700" />
                            </div>
                            {/* Form actions */}
                            <div className="flex justify-start gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || isProtectedSuperadmin
                                    }
                                    className="inline-flex w-fit max-w-fit shrink-0 items-center gap-2 rounded-md bg-[#163832] px-3 py-2 whitespace-nowrap text-white hover:bg-[#163832]/90 sm:self-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                >
                                    {processing
                                        ? 'Updating...'
                                        : 'Update Employee'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                        {/* hidden to satisfy validation when not directly editable in UI */}
                        <input
                            type="hidden"
                            name="status"
                            value={data.status}
                        />
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
