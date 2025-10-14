import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import HeadingSmall from '@/components/heading-small';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function EditUserManagement() {
    const pageProps = usePage().props as any;
    const { user, auth, errors } = pageProps;
    
    // Basic user fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin' | 'superadmin'>('user');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    
    // Profile information fields
    const [employee_id, setEmployeeId] = useState('');
    const [position, setPosition] = useState('');
    const [employment_status, setEmploymentStatus] = useState('Regular');
    const [office, setOffice] = useState('Others');
    const [cpmd, setCpmd] = useState('Others');
    const [tin_number, setTinNumber] = useState('');
    const [gsis_number, setGsisNumber] = useState('');
    const [address, setAddress] = useState('');
    const [date_of_birth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('Male');
    const [mobile_number, setMobileNumber] = useState('');
    const [contact_number, setContactNumber] = useState('');
    const [contact_person, setContactPerson] = useState('');
    
    // Profile picture and superadmin password
    const [profile_picture, setProfilePicture] = useState<File | undefined>(undefined);
    const [superadminPassword, setSuperadminPassword] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [removeProfilePicture, setRemoveProfilePicture] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    
    // References
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-populate form with existing user data if editing
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setRole(user.role || 'user');
            setStatus(user.status || 'active');
            setEmployeeId(user.employee_id || '');
            setPosition(user.position || '');
            setEmploymentStatus(user.employment_status || 'Regular');
            setOffice(user.office || 'Others');
            setCpmd(user.cpmd || 'Others');
            setTinNumber(user.tin_number || '');
            setGsisNumber(user.gsis_number || '');
            setAddress(user.address || '');
            setDateOfBirth(user.date_of_birth || '');
            setGender(user.gender || 'Male');
            setMobileNumber(user.mobile_number || '');
            setContactNumber(user.contact_number || '');
            setContactPerson(user.contact_person || '');
        }
    }, [user]);

    // Handle profile picture file selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            setRemoveProfilePicture(false); // Reset remove flag when new image is selected
            
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
        setProfilePicture(undefined);
        setPreviewImage(null);
        setRemoveProfilePicture(true); // Set flag to remove existing profile picture from server
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Get the URL for displaying the profile picture
    const getProfilePictureUrl = () => {
        if (previewImage) {
            return previewImage;
        }
        if (!removeProfilePicture && user?.profile_picture) {
            return `/storage/${user.profile_picture}`;
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        console.log('Form submission started');
        console.log('User ID:', user?.id);
        
        // Validate password confirmation
        if (password && password !== confirmPassword) {
            setPasswordError('Password and confirm password do not match');
            return;
        }
        
        // Validate password length if password is being changed
        if (password && password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }
        
        // If changing password, require superadmin password
        if (password && !superadminPassword) {
            setPasswordError('Please enter your password to confirm the user password change');
            return;
        }
        
        // For regular form submission, we'll use Inertia router
        console.log('Form validation passed, submitting...');
        
        // Create FormData for submission
        const formData = new FormData();
        
        // Add all form fields
        formData.append('_method', 'PUT');
        formData.append('name', name);
        formData.append('email', email);
        formData.append('role', role);
        formData.append('status', status);
        formData.append('employee_id', employee_id);
        formData.append('position', position);
        formData.append('employment_status', employment_status);
        formData.append('office', office);
        formData.append('cpmd', cpmd);
        formData.append('tin_number', tin_number);
        formData.append('gsis_number', gsis_number);
        formData.append('address', address);
        formData.append('date_of_birth', date_of_birth);
        formData.append('gender', gender);
        formData.append('mobile_number', mobile_number);
        formData.append('contact_number', contact_number);
        formData.append('contact_person', contact_person);
        
        // Add password fields if provided
        if (password) {
            formData.append('password', password);
            formData.append('confirm_password', confirmPassword);
            formData.append('superadmin_password', superadminPassword);
        }
        
        // Add profile picture if selected
        if (profile_picture) {
            formData.append('profile_picture', profile_picture);
        }
        
        // Add flag to remove existing profile picture
        if (removeProfilePicture) {
            formData.append('remove_profile_picture', '1');
        }
        
        // Debug: Log form data being sent
        console.log('Form data being sent:', {
            name, email, role, status, employee_id, position,
            password: password ? '***' : 'not provided',
            removeProfilePicture,
            profile_picture: profile_picture ? 'file selected' : 'no file'
        });
        
        // Submit using Inertia router with POST method (required for file uploads)
        router.post(`/superadmin/users/${user?.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Form submitted successfully');
                // Reset the remove flag after successful submission
                setRemoveProfilePicture(false);
                // Clear password fields
                setPassword('');
                setConfirmPassword('');
                setSuperadminPassword('');
                setPasswordError('');
            },
            onError: (errors) => {
                console.log('Form submission errors:', errors);
            }
        });
    };

    // Helper function to get error messages for form fields
    const getErrorMessage = (field: string) => {
        return errors?.[field] as string;
    };

    // Custom error message function for better user experience
    const getCustomErrorMessage = (field: string) => {
        const serverError = getErrorMessage(field);
        
        if (field === 'superadmin_password') {
            switch (serverError) {
                case 'Invalid superadmin password.':
                    return 'Your admin password is incorrect. Please try again.';
                case 'The superadmin password field is required.':
                    return 'Please enter your admin password to continue.';
                default:
                    return serverError;
            }
        }
        
        return serverError;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'User Management', href: '/superadmin/usermanagement' }, 
            { title: 'Edit User Profile', href: `/superadmin/usermanagement/${user?.id}/edit` }
        ]}>            
            <Head title="Edit User Profile" />
            <div className="p-4">
                {/* Main Content Layout - Profile Picture Card on Left, Form on Right */}
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left Side: Profile Picture Card */}
                    <div className="lg:w-80 order-1">
                        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                         
                            
                            {/* Profile Picture Section */}
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-card shadow-lg">
                                        {getProfilePictureUrl() ? (
                                            <img
                                                src={getProfilePictureUrl()!}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <svg
                                                className="w-16 h-16 text-muted-foreground"
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
                                <div className="flex flex-col space-y-2 w-full">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-sm w-full"
                                    >
                                        Upload Photo
                                    </Button>
                                    {(getProfilePictureUrl() || (user?.profile_picture && !removeProfilePicture)) && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleRemoveImage}
                                            className="text-sm w-full"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Main Form Card */}
                    <div className="flex-1 order-2">
                        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Edit User Profile</h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" id={`edit-user-form-${user?.id}`}>
                                
                                {/* Main Form Sections - Table-based Layout */}
                                <div className="space-y-8">
                                    
                                    {/* Personal Information Table */}
                                    <div className="space-y-4">
                                        <HeadingSmall title="Personal Information" description="" />
                                        <div className="border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {/*<TableHead className="w-1/3"></TableHead>*/}
                                                        {/*<TableHead className="w-2/3"></TableHead>*/}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="w-1/3 font-medium">Name *</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="name"
                                                                name="name"
                                                                type="text"
                                                                value={name}
                                                                onChange={(e) => setName(e.target.value)}
                                                                className="w-full"
                                                                required
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('name')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Employee ID No.</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="employee_id"
                                                                name="employee_id"
                                                                type="text"
                                                                value={employee_id}
                                                                onChange={(e) => setEmployeeId(e.target.value)}
                                                                className="w-full"
                                                                autoComplete="off"
                                                                autoCorrect="off"
                                                                autoCapitalize="off"
                                                                spellCheck="false"
                                                                placeholder="Employee ID"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('employee_id')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Position</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="position"
                                                                name="position"
                                                                type="text"
                                                                value={position}
                                                                onChange={(e) => setPosition(e.target.value)}
                                                                className="w-full"
                                                                placeholder="Position"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('position')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Employment Status</TableCell>
                                                        <TableCell>
                                                            <select
                                                                id="employment_status"
                                                                name="employment_status"
                                                                value={employment_status}
                                                                onChange={(e) => setEmploymentStatus(e.target.value)}
                                                                className="w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                            >
                                                                <option value="Regular">Regular</option>
                                                                <option value="COS">COS</option>
                                                                <option value="Job Order">Job Order</option>
                                                                <option value="Others">Others</option>
                                                            </select>
                                                            <InputError className="mt-1" message={getErrorMessage('employment_status')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Office</TableCell>
                                                        <TableCell>
                                                            <select
                                                                id="office"
                                                                name="office"
                                                                value={office}
                                                                onChange={(e) => setOffice(e.target.value)}
                                                                className="w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                            >
                                                                <option value="DO">DO</option>
                                                                <option value="ADO">ADO</option>
                                                                <option value="CPMD">CPMD</option>
                                                                <option value="AED">AED</option>
                                                                <option value="NSQCS">NSQCS</option>
                                                                <option value="NPQSD">NPQSD</option>
                                                                <option value="NSIC">NSIC</option>
                                                                <option value="CRPSD">CRPSD</option>
                                                                <option value="PPSSD">PPSSD</option>
                                                                <option value="ADMINISTRATIVE">ADMINISTRATIVE</option>
                                                                <option value="Others">Others</option>
                                                            </select>
                                                            <InputError className="mt-1" message={getErrorMessage('office')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    {office === 'CPMD' && (
                                                        <TableRow>
                                                            <TableCell className="font-medium">Section/Unit</TableCell>
                                                            <TableCell>
                                                                <select
                                                                    id="cpmd"
                                                                    name="cpmd"
                                                                    value={cpmd}
                                                                    onChange={(e) => setCpmd(e.target.value)}
                                                                    className="w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                                >
                                                                    <option value="BIOCON section">BIOCON section</option>
                                                                    <option value="PFS section">PFS section</option>
                                                                    <option value="PHPS SECTION">PHPS SECTION</option>
                                                                    <option value="OC-Admin Support Unit">OC-Admin Support Unit</option>
                                                                    <option value="OC-ICT Unit">OC-ICT Unit</option>
                                                                    <option value="OC-Special Project">OC-Special Project</option>
                                                                    <option value="Others">Others</option>
                                                                </select>
                                                                <InputError className="mt-1" message={getErrorMessage('cpmd')} />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Additional Details Table */}
                                    <div className="space-y-4">
                                        <HeadingSmall title="Additional Details" description="" />
                                        <div className="border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {/*<TableHead className="w-1/3"></TableHead>*/}
                                                        {/*<TableHead className="w-2/3"></TableHead>*/}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className=" 1/3 font-medium">TIN Number</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="tin_number"
                                                                name="tin_number"
                                                                type="text"
                                                                value={tin_number}
                                                                onChange={(e) => setTinNumber(e.target.value)}
                                                                className="w-full"
                                                                placeholder="TIN Number"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('tin_number')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">GSIS Number</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="gsis_number"
                                                                name="gsis_number"
                                                                type="text"
                                                                value={gsis_number}
                                                                onChange={(e) => setGsisNumber(e.target.value)}
                                                                className="w-full"
                                                                placeholder="GSIS Number"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('gsis_number')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Address</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="address"
                                                                name="address"
                                                                type="text"
                                                                value={address}
                                                                onChange={(e) => setAddress(e.target.value)}
                                                                className="w-full"
                                                                placeholder="Address"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('address')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Date of Birth</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="date_of_birth"
                                                                name="date_of_birth"
                                                                type="date"
                                                                value={date_of_birth}
                                                                onChange={(e) => setDateOfBirth(e.target.value)}
                                                                className="w-full"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('date_of_birth')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Gender</TableCell>
                                                        <TableCell>
                                                            <select
                                                                id="gender"
                                                                name="gender"
                                                                value={gender}
                                                                onChange={(e) => setGender(e.target.value)}
                                                                className="w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                            >
                                                                <option value="Male">Male</option>
                                                                <option value="Female">Female</option>
                                                            </select>
                                                            <InputError className="mt-1" message={getErrorMessage('gender')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Mobile Number</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="mobile_number"
                                                                name="mobile_number"
                                                                type="text"
                                                                value={mobile_number}
                                                                onChange={(e) => setMobileNumber(e.target.value)}
                                                                className="w-full"
                                                                placeholder="Mobile Number"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Emergency Contact & System Settings Table */}
                                    <div className="space-y-4">
                                        <HeadingSmall title="Emergency Contact & System Settings" description="" />
                                        <div className="border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {/*<TableHead className="w-1/3"></TableHead>*/}
                                                        {/*<TableHead className="w-2/3"></TableHead>*/}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="w-1/3 font-medium">Contact Person</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="contact_person"
                                                                name="contact_person"
                                                                type="text"
                                                                value={contact_person}
                                                                onChange={(e) => setContactPerson(e.target.value)}
                                                                className="w-full"
                                                                placeholder="Emergency Contact Person"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('contact_person')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Contact Number</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="contact_number"
                                                                name="contact_number"
                                                                type="text"
                                                                value={contact_number}
                                                                onChange={(e) => setContactNumber(e.target.value)}
                                                                className="w-full"
                                                                placeholder="Contact Number"
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('contact_number')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Email *</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id="email"
                                                                name="email"
                                                                type="email"
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                className="w-full"
                                                                required
                                                            />
                                                            <InputError className="mt-1" message={getErrorMessage('email')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Role</TableCell>
                                                        <TableCell>
                                                            <select
                                                                id="role"
                                                                name="role"
                                                                value={role}
                                                                onChange={(e) => setRole(e.target.value as any)}
                                                                className="w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                            >
                                                                <option value="user">User</option>
                                                                <option value="admin">Admin</option>
                                                                <option value="superadmin">Super Admin</option>
                                                            </select>
                                                            <InputError className="mt-1" message={getErrorMessage('role')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Status</TableCell>
                                                        <TableCell>
                                                            <select
                                                                id="status"
                                                                name="status"
                                                                value={status}
                                                                onChange={(e) => setStatus(e.target.value as any)}
                                                                className="w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                            >
                                                                <option value="active">Active</option>
                                                                <option value="inactive">Inactive</option>
                                                            </select>
                                                            <InputError className="mt-1" message={getErrorMessage('status')} />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>

                                {/* Line Separator */}
                                <div className="py-4">
                                    <Separator className="bg-gray-200 dark:bg-neutral-700" />
                                </div>

                                {/* Password Section */}
                                <div className="space-y-4">
                                    <HeadingSmall title="Password Management" description="Change user password (optional)" />
                                    
                                    {/* Combined Password Error Messages */}
                                    {(passwordError || getCustomErrorMessage('superadmin_password')) && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-800">
                                                        {passwordError || getCustomErrorMessage('superadmin_password')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="password">New Password</Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (passwordError) setPasswordError('');
                                                }}
                                                className="mt-1"
                                                autoComplete="new-password"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck="false"
                                                placeholder="Leave blank to keep current password"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave blank to keep the current password</p>
                                            <InputError className="mt-2" message={getErrorMessage('password')} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                name="confirm_password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (passwordError) setPasswordError('');
                                                }}
                                                className="mt-1"
                                                autoComplete="new-password"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck="false"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                    
                                    {password && (
                                        <div>
                                            <Label htmlFor="superadminPassword">Admin Password</Label>
                                            <Input
                                                id="superadminPassword"
                                                name="superadmin_password"
                                                type="password"
                                                value={superadminPassword}
                                                onChange={(e) => {
                                                    setSuperadminPassword(e.target.value);
                                                    if (passwordError) setPasswordError('');
                                                }}
                                                className="mt-1"
                                                placeholder="Enter your password to confirm"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter your password to confirm the user password change</p>
                                            
                                            
                                        </div>
                                    )}
                                </div>

                                {/* Line Separator */}
                                <div className="py-4">
                                    <Separator className="bg-gray-200 dark:bg-neutral-700" />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-4 pt-6">
                                    <Button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-70">
                                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => router.get('/superadmin/usermanagement')} 
                                        className="px-6 py-2"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

