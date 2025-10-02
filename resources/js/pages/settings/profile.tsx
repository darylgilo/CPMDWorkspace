import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your personal, employment, and contact information"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* Basic Information Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Basic Information</h3>
                                    
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.email}
                                        />
                                    </div>

                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at === null && (
                                            <div>
                                                <p className="-mt-4 text-sm text-muted-foreground">
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
                                                        A new verification link has
                                                        been sent to your email
                                                        address.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                </div>

                                {/* Employment Information Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Employment Information</h3>
                                    
                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_id">Employee ID</Label>
                                        <Input
                                            id="employee_id"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.employee_id ?? ''}
                                            name="employee_id"
                                            placeholder="Employee ID"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.employee_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="position">Position</Label>
                                        <Input
                                            id="position"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.position ?? ''}
                                            name="position"
                                            placeholder="Job position"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.position}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="employment_status">Employment Status</Label>
                                        <Select name="employment_status" defaultValue={auth.user.employment_status ?? 'Regular'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employment status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Regular">Regular</SelectItem>
                                                <SelectItem value="COS">COS</SelectItem>
                                                <SelectItem value="Job Order">Job Order</SelectItem>
                                                <SelectItem value="Others">Others</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            className="mt-2"
                                            message={errors.employment_status}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="office">Office</Label>
                                        <Select name="office" defaultValue={auth.user.office ?? 'Others'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select office" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DO">DO</SelectItem>
                                                <SelectItem value="ADO">ADO</SelectItem>
                                                <SelectItem value="CPMD">CPMD</SelectItem>
                                                <SelectItem value="AED">AED</SelectItem>
                                                <SelectItem value="NSQCS">NSQCS</SelectItem>
                                                <SelectItem value="NPQSD">NPQSD</SelectItem>
                                                <SelectItem value="NSIC">NSIC</SelectItem>
                                                <SelectItem value="CRPSD">CRPSD</SelectItem>
                                                <SelectItem value="PPSSD">PPSSD</SelectItem>
                                                <SelectItem value="ADMINISTRATIVE">ADMINISTRATIVE</SelectItem>
                                                <SelectItem value="Others">Others</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            className="mt-2"
                                            message={errors.office}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="cpmd">CPMD Section</Label>
                                        <Select name="cpmd" defaultValue={auth.user.cpmd ?? 'Others'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select CPMD section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BIOCON section">BIOCON section</SelectItem>
                                                <SelectItem value="PFS section">PFS section</SelectItem>
                                                <SelectItem value="PHPS SECTION">PHPS SECTION</SelectItem>
                                                <SelectItem value="OC-Admin Support Unit">OC-Admin Support Unit</SelectItem>
                                                <SelectItem value="OC-ICT Unit">OC-ICT Unit</SelectItem>
                                                <SelectItem value="OC-Special Project">OC-Special Project</SelectItem>
                                                <SelectItem value="Others">Others</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            className="mt-2"
                                            message={errors.cpmd}
                                        />
                                    </div>
                                </div>

                                {/* Personal Information Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Personal Information</h3>
                                    
                                    <div className="grid gap-2">
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.date_of_birth ?? ''}
                                            name="date_of_birth"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.date_of_birth}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select name="gender" defaultValue={auth.user.gender ?? 'Male'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            className="mt-2"
                                            message={errors.gender}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.address ?? ''}
                                            name="address"
                                            placeholder="Home address"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.address}
                                        />
                                    </div>
                                </div>

                                {/* Contact Information Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Contact Information</h3>
                                    
                                    <div className="grid gap-2">
                                        <Label htmlFor="mobile_number">Mobile Number</Label>
                                        <Input
                                            id="mobile_number"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.mobile_number ?? ''}
                                            name="mobile_number"
                                            placeholder="Mobile number"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.mobile_number}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_number">Contact Number</Label>
                                        <Input
                                            id="contact_number"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.contact_number ?? ''}
                                            name="contact_number"
                                            placeholder="Contact number"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.contact_number}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_person">Contact Person</Label>
                                        <Input
                                            id="contact_person"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.contact_person ?? ''}
                                            name="contact_person"
                                            placeholder="Emergency contact person"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.contact_person}
                                        />
                                    </div>
                                </div>

                                {/* Government Information Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Government Information</h3>
                                    
                                    <div className="grid gap-2">
                                        <Label htmlFor="gsis_number">GSIS Number</Label>
                                        <Input
                                            id="gsis_number"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.gsis_number ?? ''}
                                            name="gsis_number"
                                            placeholder="GSIS number"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.gsis_number}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="tin_number">TIN Number</Label>
                                        <Input
                                            id="tin_number"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.tin_number ?? ''}
                                            name="tin_number"
                                            placeholder="TIN number"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.tin_number}
                                        />
                                    </div>
                                </div>

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
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
