import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePopupAlert } from '@/components/ui/popup-alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';

// Employee profile view/edit page component
export default function EmployeeView() {
    // Define types
    type EmploymentStatus = 'Regular' | 'COS' | 'Job Order' | 'Others';
    type Office =
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
    type CPMDSection =
        | ''
        | 'BIOCON section'
        | 'PFS section'
        | 'PHPS SECTION'
        | 'OC-Admin Support Unit'
        | 'OC-ICT Unit'
        | 'OC-Special Project'
        | 'Others';
    type Gender = 'Male' | 'Female';

    interface User {
        id: number;
        name: string;
        email: string;
        employee_id: string;
        position: string;
        employment_status: EmploymentStatus;
        office: Office;
        cpmd: CPMDSection;
        tin_number: string;
        landbank_number: string;
        gsis_number: string;
        address: string;
        date_of_birth: string;
        hiring_date: string;
        item_number: string;
        gender: Gender;
        mobile_number: string;
        contact_person: string;
        contact_person_number: string;
        [key: string]: unknown;
    }

    interface PageProps extends InertiaPageProps {
        user: User & {
            role?: string;
            profile_picture?: string;
            status?: 'active' | 'inactive';
        };
        auth: {
            user?: {
                id: number;
                role?: string;
                [key: string]: unknown;
            };
            [key: string]: unknown;
        };
    }

    // Grab server-provided user payload from Inertia page props
    const { props } = usePage<PageProps>();
    const { user, auth } = props;

    // Initialize popup alert hook
    const { showSuccess, showError } = usePopupAlert();

    interface FormData {
        name: string;
        email: string;
        employee_id: string;
        position: string;
        employment_status: 'Regular' | 'COS' | 'Job Order' | 'Others';
        office: 'CPMD' | 'Others';
        cpmd:
            | ''
            | 'Office of the Chief'
            | 'OC-Admin Support Unit'
            | 'OC-Special Project Unit'
            | 'OC-ICT Unit'
            | 'BIOCON Section'
            | 'PFS Section'
            | 'PHPS Section'
            | 'Others';
        tin_number: string;
        landbank_number: string;
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
        profile_picture?: File | null;
        remove_profile_picture?: boolean;
        _method?: string;
    }

    // Helper function to safely get string value with fallback
    const getStringValue = (
        value: unknown,
        defaultValue: string = '',
    ): string => {
        return typeof value === 'string' ? value : defaultValue;
    };

    // Helper function to safely get enum value with fallback
    const getEnumValue = <T extends string>(
        value: unknown,
        validValues: readonly T[],
        defaultValue: T,
    ): T => {
        return validValues.some((v) => v === value)
            ? (value as T)
            : defaultValue;
    };

    // Initialize form with user values
    const getInitialData = (): FormData => {
        // Define valid values for enums
        const employmentStatuses = [
            'Regular',
            'COS',
            'Job Order',
            'Others',
        ] as const;
        const offices = ['CPMD', 'Others'] as const;
        const cpmdSections = [
            '',
            'Office of the Chief',
            'OC-Admin Support Unit',
            'OC-Special Project Unit',
            'OC-ICT Unit',
            'BIOCON Section',
            'PFS Section',
            'PHPS Section',
            'Others',
        ] as const;
        const genders = ['Male', 'Female'] as const;
        const statuses = ['active', 'inactive'] as const;

        return {
            name: getStringValue(user?.name),
            email: getStringValue(user?.email),
            employee_id: getStringValue(user?.employee_id),
            position: getStringValue(user?.position),
            employment_status: getEnumValue(
                user?.employment_status,
                employmentStatuses,
                'Regular',
            ),
            office: getEnumValue(user?.office, offices, 'Others'),
            cpmd: getEnumValue(user?.cpmd, cpmdSections, ''),
            tin_number: getStringValue(user?.tin_number),
            landbank_number: getStringValue(user?.landbank_number),
            gsis_number: getStringValue(user?.gsis_number),
            address: getStringValue(user?.address),
            date_of_birth: getStringValue(user?.date_of_birth),
            hiring_date: getStringValue(user?.hiring_date),
            item_number: getStringValue(user?.item_number),
            gender: getEnumValue(user?.gender, genders, 'Male'),
            mobile_number: getStringValue(user?.mobile_number),
            contact_person: getStringValue(user?.contact_person),
            contact_number: getStringValue(user?.contact_number),
            status: getEnumValue(user?.status, statuses, 'inactive'),
            profile_picture: null,
            remove_profile_picture: false,
            _method: 'PUT',
        };
    };

    const initialData = getInitialData();

    // Inertia form helper for PUT updates with proper typing
    const { data, setData, post, put, processing, transform } = useForm({
        ...initialData,
    });

    // Transform data before submission to ensure correct types for backend
    useEffect(() => {
        transform((data) => ({
            ...data,
            remove_profile_picture: data.remove_profile_picture ? '1' : '0',
        }));
    }, [transform]);

    // Type assertion for setData to handle FormData keys
    const typedSetData = setData as <K extends keyof FormData>(
        key: K,
        value: FormData[K],
    ) => void;

    // Helper function to properly type setData calls
    const handleInputChange = <K extends keyof FormData>(
        field: K,
        value: FormData[K],
    ) => {
        typedSetData(field, value);
    };

    // Profile picture state
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle profile picture file selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('profile_picture', file);
            setData('remove_profile_picture', false);

            // Create a preview URL for the selected image
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle removal of profile picture
    const handleRemoveImage = () => {
        setData('profile_picture', null);
        setData('remove_profile_picture', true);
        setPreviewImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Get the URL for displaying the profile picture
    const getProfilePictureUrl = () => {
        if (previewImage) {
            return previewImage;
        }
        if (!data.remove_profile_picture && user?.profile_picture) {
            return `/storage/${user.profile_picture}`;
        }
        return null;
    };

    const isProtectedSuperadmin =
        auth?.user?.role !== 'superadmin' && user?.role === 'superadmin';

    // Type guard to ensure data is FormData
    const isFormData = (data: unknown): data is FormData => {
        return (
            typeof data === 'object' &&
            data !== null &&
            'name' in data &&
            'email' in data
            // Add other required fields as needed
        );
    };

    // Submit updated employee details
    const onSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isProtectedSuperadmin || !user?.id) {
            return;
        }

        // Ensure data is properly typed before submission
        if (!isFormData(data)) {
            console.error('Invalid form data');
            return;
        }

        const submitOptions = {
            onSuccess: () => {
                showSuccess(
                    'Employee Updated',
                    'Employee information has been successfully updated.',
                );
                // Navigate back to employee management after successful update
                router.get('/employees');
            },
            onError: (errors: Record<string, string>) => {
                showError(
                    'Update Failed',
                    'Unable to update employee. Please try again.',
                );
                // Handle errors
                console.error('Error updating employee:', errors);
            },
        };

        if (data.profile_picture) {
            // If there is a file, we must use POST with _method="PUT" (handled by data._method)
            // Inertia will automatically use FormData
            post(`/employees/${user.id}`, submitOptions);
        } else {
            // If no file, use standard PUT request (JSON)
            put(`/employees/${user.id}`, submitOptions);
        }
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

                            {/* Profile Picture Section */}
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <div className="flex h-45 w-45 items-center justify-center overflow-hidden rounded-full border-3 border-card bg-muted shadow-lg">
                                        {getProfilePictureUrl() ? (
                                            <img
                                                src={getProfilePictureUrl()!}
                                                className="h-full w-full object-cover"
                                                alt={user?.name}
                                            />
                                        ) : (
                                            <svg
                                                className="h-16 w-16 text-muted-foreground"
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
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="profile_picture"
                                        name="profile_picture"
                                    />
                                </div>
                                <div className="flex w-full flex-col space-y-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="w-full text-sm"
                                    >
                                        Upload Photo
                                    </Button>
                                    {(getProfilePictureUrl() ||
                                        (user?.profile_picture &&
                                            !data.remove_profile_picture)) && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleRemoveImage}
                                            className="w-full text-sm"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
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
                                                    handleInputChange(
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
                                                    handleInputChange(
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
                                                    handleInputChange(
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
                                                    handleInputChange(
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
                                            <Select
                                                value={data.employment_status}
                                                onValueChange={(value) =>
                                                    handleInputChange(
                                                        'employment_status',
                                                        value as FormData['employment_status'],
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select employment status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Regular">
                                                        Regular
                                                    </SelectItem>
                                                    <SelectItem value="COS">
                                                        COS
                                                    </SelectItem>
                                                    <SelectItem value="Job Order">
                                                        Job Order
                                                    </SelectItem>
                                                    <SelectItem value="Others">
                                                        Others
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                                        handleInputChange(
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
                                            <Select
                                                value={data.office}
                                                onValueChange={(val) => {
                                                    handleInputChange(
                                                        'office',
                                                        val as FormData['office'],
                                                    );
                                                    if (val !== 'CPMD') {
                                                        handleInputChange(
                                                            'cpmd',
                                                            'Others' as FormData['cpmd'],
                                                        );
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue>
                                                        {data.office ||
                                                            'Select office'}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CPMD">
                                                        CPMD
                                                    </SelectItem>
                                                    <SelectItem value="Others">
                                                        Others
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {data.office === 'CPMD' && (
                                            <div>
                                                <Label htmlFor="cpmd">
                                                    Section/Unit
                                                </Label>
                                                <Select
                                                    value={data.cpmd}
                                                    onValueChange={(value) =>
                                                        handleInputChange(
                                                            'cpmd',
                                                            value as FormData['cpmd'],
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue>
                                                            {data.cpmd ||
                                                                'Select section/unit'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Office of the Chief">
                                                            Office of the Chief
                                                        </SelectItem>
                                                        <SelectItem value="OC-Admin Support Unit">
                                                            OC-Admin Support
                                                            Unit
                                                        </SelectItem>
                                                        <SelectItem value="OC-Special Project Unit">
                                                            OC-Special Project
                                                            Unit
                                                        </SelectItem>
                                                        <SelectItem value="OC-ICT Unit">
                                                            OC-ICT Unit
                                                        </SelectItem>
                                                        <SelectItem value="BIOCON Section">
                                                            BIOCON Section
                                                        </SelectItem>
                                                        <SelectItem value="PFS Section">
                                                            PFS Section
                                                        </SelectItem>
                                                        <SelectItem value="PHPS Section">
                                                            PHPS Section
                                                        </SelectItem>
                                                        <SelectItem value="Others">
                                                            Others
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                    handleInputChange(
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
                                                    handleInputChange(
                                                        'tin_number',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="landbank_number">
                                                Landbank Number
                                            </Label>
                                            <Input
                                                id="landbank_number"
                                                value={data.landbank_number}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'landbank_number',
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
                                                    handleInputChange(
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
                                                    handleInputChange(
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
                                                    handleInputChange(
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
                                            <Select
                                                value={data.gender}
                                                onValueChange={(value) =>
                                                    handleInputChange(
                                                        'gender',
                                                        value as FormData['gender'],
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">
                                                        Male
                                                    </SelectItem>
                                                    <SelectItem value="Female">
                                                        Female
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="mobile_number">
                                                Mobile Number
                                            </Label>
                                            <Input
                                                id="mobile_number"
                                                value={data.mobile_number}
                                                onChange={(e) =>
                                                    handleInputChange(
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
                                                    handleInputChange(
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
                                                    handleInputChange(
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
