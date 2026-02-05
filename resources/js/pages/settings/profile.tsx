import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useRef, useState, type ChangeEvent } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
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
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { showSuccess, showError, showInfo } = usePopupAlert();
    const { auth } = usePage<SharedData>().props;
    const [officeValue, setOfficeValue] = useState<string>(
        auth.user.office ?? 'CPMD',
    );
    const [cpmdValue, setCpmdValue] = useState<string>(auth.user.cpmd ?? '');
    const [employmentStatusValue, setEmploymentStatusValue] = useState<string>(
        auth.user.employment_status ?? 'Regular',
    );

    // Profile image preview and input ref
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [imgBroken, setImgBroken] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Return preview image if selected; otherwise, existing stored profile picture
    const getProfilePictureUrl = () => {
        if (imgBroken) return null;
        if (previewImage) return previewImage;
        const stored = (auth as unknown as Record<string, unknown>)?.user as
            | Record<string, unknown>
            | undefined;
        const profilePicture = stored?.profile_picture as string | undefined;
        if (!profilePicture) return null;
        if (
            profilePicture?.startsWith('http://') ||
            profilePicture?.startsWith('https://')
        )
            return profilePicture;
        if (profilePicture?.startsWith('/')) return profilePicture; // already absolute path
        if (profilePicture?.startsWith('storage/')) return `/${profilePicture}`; // already in storage folder
        return `/storage/${profilePicture}`;
    };

    // Handle local file selection to create a preview
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgBroken(false);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreviewImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your personal and contact information"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                                {/* Left Column - User Info */}
                                <div className="space-y-6 lg:col-span-1">
                                    <div className="space-y-4 text-center">
                                        {/* Profile picture display container */}
                                        <div className="relative">
                                            <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-muted shadow-lg">
                                                {/* Display profile picture if available, otherwise show default avatar icon */}
                                                {getProfilePictureUrl() ? (
                                                    <img
                                                        src={
                                                            getProfilePictureUrl()!
                                                        }
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                        onError={() =>
                                                            setImgBroken(true)
                                                        }
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
                                            {/* Hidden file input for profile picture upload */}
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

                                        <div className="space-y-2">
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-medium">
                                                    Employee ID
                                                </span>
                                                <div className="font-semibold text-foreground">
                                                    {auth.user.employee_id ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-medium">
                                                    Name
                                                </span>
                                                <div className="font-semibold text-foreground">
                                                    {auth.user.name || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-medium">
                                                    Position
                                                </span>
                                                <div className="font-semibold text-foreground">
                                                    {auth.user.position ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-medium">
                                                    Employment Status
                                                </span>
                                                <div className="font-semibold text-foreground">
                                                    {auth.user
                                                        .employment_status ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-medium">
                                                    Hiring Date
                                                </span>
                                                <div className="font-semibold text-foreground">
                                                    {auth.user.hiring_date ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Form Fields */}
                                <div className="space-y-6 lg:col-span-3">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                        {/* Column 1 */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">
                                                    Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    defaultValue={
                                                        auth.user.name
                                                    }
                                                    name="name"
                                                    required
                                                    autoComplete="name"
                                                    placeholder="Full name"
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    defaultValue={
                                                        auth.user.email
                                                    }
                                                    name="email"
                                                    required
                                                    autoComplete="username"
                                                    placeholder="Email address"
                                                />
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="employee_id">
                                                    Employee ID No.
                                                </Label>
                                                <Input
                                                    id="employee_id"
                                                    defaultValue={
                                                        auth.user.employee_id ??
                                                        ''
                                                    }
                                                    name="employee_id"
                                                    placeholder="Employee ID"
                                                />
                                                <InputError
                                                    message={errors.employee_id}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="position">
                                                    Position
                                                </Label>
                                                <Input
                                                    id="position"
                                                    defaultValue={
                                                        auth.user.position ?? ''
                                                    }
                                                    name="position"
                                                    placeholder="Job position"
                                                />
                                                <InputError
                                                    message={errors.position}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="employment_status">
                                                    Employment Status
                                                </Label>
                                                <Select
                                                    name="employment_status"
                                                    value={
                                                        employmentStatusValue
                                                    }
                                                    onValueChange={(value) =>
                                                        setEmploymentStatusValue(
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
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
                                                <InputError
                                                    message={
                                                        errors.employment_status
                                                    }
                                                />
                                            </div>
                                            {employmentStatusValue ===
                                                'Regular' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="item_number">
                                                        Item Number
                                                    </Label>
                                                    <Input
                                                        id="item_number"
                                                        defaultValue={`${auth.user.item_number ?? ''}`}
                                                        name="item_number"
                                                        placeholder="Item Number"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.item_number
                                                        }
                                                    />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="office">
                                                    Office
                                                </Label>
                                                <Select
                                                    name="office"
                                                    value={officeValue}
                                                    onValueChange={(value) =>
                                                        setOfficeValue(value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select office" />
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
                                                <InputError
                                                    message={errors.office}
                                                />
                                            </div>
                                            {officeValue === 'CPMD' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="cpmd">
                                                        Section/Unit
                                                    </Label>
                                                    <Select
                                                        name="cpmd"
                                                        value={cpmdValue}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            setCpmdValue(value)
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select CPMD section" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Office of the Chief">
                                                                Office of the
                                                                Chief
                                                            </SelectItem>
                                                            <SelectItem value="OC-Admin Support Unit">
                                                                OC-Admin Support
                                                                Unit
                                                            </SelectItem>
                                                            <SelectItem value="OC-Special Project Unit">
                                                                OC-Special
                                                                Project Unit
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
                                                    <InputError
                                                        message={errors.cpmd}
                                                    />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="hiring_date">
                                                    Hiring Date
                                                </Label>
                                                <Input
                                                    id="hiring_date"
                                                    type="date"
                                                    defaultValue={`${auth.user.hiring_date ?? ''}`}
                                                    name="hiring_date"
                                                />
                                                <InputError
                                                    message={errors.hiring_date}
                                                />
                                            </div>
                                        </div>

                                        {/* Column 2 */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="tin_number">
                                                    TIN Number
                                                </Label>
                                                <Input
                                                    id="tin_number"
                                                    defaultValue={auth.user.tin_number ?? ''}
                                                    name="tin_number"
                                                    placeholder="TIN number"
                                                />
                                                <InputError
                                                    message={errors.tin_number}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="landbank_number">
                                                    Landbank Number
                                                </Label>
                                                <Input
                                                    id="landbank_number"
                                                    defaultValue={auth.user.landbank_number ?? ''}
                                                    name="landbank_number"
                                                    placeholder="Landbank number"
                                                />
                                                <InputError
                                                    message={errors.landbank_number}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gsis_number">
                                                    GSIS Number
                                                </Label>
                                                <Input
                                                    id="gsis_number"
                                                    defaultValue={auth.user.gsis_number ?? ''}
                                                    name="gsis_number"
                                                    placeholder="GSIS number"
                                                />
                                                <InputError
                                                    message={errors.gsis_number}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address">
                                                    Address
                                                </Label>
                                                <Input
                                                    id="address"
                                                    defaultValue={
                                                        auth.user.address ?? ''
                                                    }
                                                    name="address"
                                                    placeholder="Home address"
                                                />
                                                <InputError
                                                    message={errors.address}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="date_of_birth">
                                                    Date of Birth
                                                </Label>
                                                <Input
                                                    id="date_of_birth"
                                                    type="date"
                                                    defaultValue={
                                                        auth.user
                                                            .date_of_birth ?? ''
                                                    }
                                                    name="date_of_birth"
                                                />
                                                <InputError
                                                    message={
                                                        errors.date_of_birth
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender">
                                                    Gender
                                                </Label>
                                                <Select
                                                    name="gender"
                                                    defaultValue={
                                                        auth.user.gender ??
                                                        'Male'
                                                    }
                                                >
                                                    <SelectTrigger>
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
                                                <InputError
                                                    message={errors.gender}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mobile_number">
                                                    Mobile Number
                                                </Label>
                                                <Input
                                                    id="mobile_number"
                                                    defaultValue={
                                                        auth.user
                                                            .mobile_number ?? ''
                                                    }
                                                    name="mobile_number"
                                                    placeholder="Mobile number"
                                                />
                                                <InputError
                                                    message={
                                                        errors.mobile_number
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* Column 3 - Emergency */}
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-lg font-medium">
                                                    In case of emergency
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Contact information
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_person">
                                                    Contact Person
                                                </Label>
                                                <Input
                                                    id="contact_person"
                                                    defaultValue={
                                                        auth.user
                                                            .contact_person ??
                                                        ''
                                                    }
                                                    name="contact_person"
                                                    placeholder="Emergency contact person"
                                                />
                                                <InputError
                                                    message={
                                                        errors.contact_person
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_number">
                                                    Contact Number
                                                </Label>
                                                <Input
                                                    id="contact_number"
                                                    defaultValue={
                                                        auth.user
                                                            .contact_number ??
                                                        ''
                                                    }
                                                    name="contact_number"
                                                    placeholder="Contact number"
                                                />
                                                <InputError
                                                    message={
                                                        errors.contact_number
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at ===
                                            null && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Your email address is
                                                    unverified.{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                    >
                                                        Click here to resend the
                                                        verification email.
                                                    </Link>
                                                </p>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <div className="mt-2 text-sm font-medium text-green-600">
                                                        A new verification link
                                                        has been sent to your
                                                        email address.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    <div className="flex items-center gap-4">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                        >
                                            Save
                                        </Button>

                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-neutral-600">
                                                Saved
                                            </p>
                                        </Transition>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
