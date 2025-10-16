import { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import HeadingSmall from '@/components/heading-small';
import { Separator } from '@/components/ui/separator';

export default function AddUserManagement() {
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
    const [hiring_date, setHiringDate] = useState('');
    const [gender, setGender] = useState('Male');
    const [mobile_number, setMobileNumber] = useState('');
    const [contact_number, setContactNumber] = useState('');
    const [contact_person, setContactPerson] = useState('');
    const [item_number, setItemNumber] = useState('');
    
    // Profile picture
    const [profile_picture, setProfilePicture] = useState<File | undefined>(undefined);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    
    // References
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle profile picture file selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        // Validate password confirmation
        if (password !== confirmPassword) {
            setPasswordError('Password and confirm password do not match');
            return;
        }
        
        // Validate password length
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }
        
        setIsSubmitting(true);
        
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add all form fields to FormData
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
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
        formData.append('hiring_date', hiring_date);
        formData.append('item_number', item_number);
        formData.append('gender', gender);
        formData.append('mobile_number', mobile_number);
        formData.append('contact_number', contact_number);
        formData.append('contact_person', contact_person);
        
        if (profile_picture) {
            formData.append('profile_picture', profile_picture);
        }
        
        router.post('/superadmin/users', formData, {
            onFinish: () => setIsSubmitting(false),
            onSuccess: () => {
                router.get('/superadmin/usermanagement');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'User Management', href: '/superadmin/usermanagement' }, { title: 'Add User Account', href: '/superadmin/usermanagement/create' }]}>            
            <Head title="Add User" />
            <div className="p-4">
                {/* Main Content Layout - Profile Picture Card on Left, Form on Right */}
                <div className="flex flex-col lg:flex-row gap-4">
                    
                    {/* Left Side: Profile Picture Card */}
                    <div className="lg:w-80 order-1">
                        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                            
                            
                            {/* Profile Picture Section */}
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <div className="w-45 h-45 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-card shadow-lg">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Profile Preview"
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
                                    {previewImage && (
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
                            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Add New User</h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Main Form Sections - Organized Grid Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    
                                    {/* Column 1: Personal Information */}
                                    <div className="space-y-6">
                                        <HeadingSmall title="Personal Information" description="" />
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="name">Name *</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="mt-1"
                                                    required
                                                    placeholder="Full name"
                                                />
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="employee_id">Employee ID No.</Label>
                                                <Input
                                                    id="employee_id"
                                                    name="employee_id"
                                                    type="text"
                                                    value={employee_id}
                                                    onChange={(e) => setEmployeeId(e.target.value)}
                                                    className="mt-1"
                                                    autoComplete="off"
                                                    placeholder="Employee ID"
                                                />
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="position">Position</Label>
                                                <Input
                                                    id="position"
                                                    name="position"
                                                    type="text"
                                                    value={position}
                                                    onChange={(e) => setPosition(e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Position"
                                                />
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="employment_status">Employment Status</Label>
                                                <select
                                                    id="employment_status"
                                                    name="employment_status"
                                                    value={employment_status}
                                                    onChange={(e) => setEmploymentStatus(e.target.value)}
                                                    className="mt-1 block w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                >
                                                    <option value="Regular">Regular</option>
                                                    <option value="COS">COS</option>
                                                    <option value="Job Order">Job Order</option>
                                                    <option value="Others">Others</option>
                                                </select>
                                            </div>
                                            {employment_status === 'Regular' && (
                                                <div>
                                                    <Label htmlFor="item_number">Item Number</Label>
                                                    <Input
                                                        id="item_number"
                                                        name="item_number"
                                                        type="text"
                                                        value={item_number}
                                                        onChange={(e) => setItemNumber(e.target.value)}
                                                        className="mt-1"
                                                        placeholder="Item Number"
                                                    />
                                                </div>
                                            )}
                                            
                                            <div>
                                                <Label htmlFor="office">Office</Label>
                                                <select
                                                    id="office"
                                                    name="office"
                                                    value={office}
                                                    onChange={(e) => setOffice(e.target.value)}
                                                    className="mt-1 block w-full border border-input rounded px-3 py-2 bg-background text-foreground"
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
                                            </div>
                                            
                                            {office === 'CPMD' && (
                                                <div>
                                                    <Label htmlFor="cpmd">Section/Unit</Label>
                                                    <select
                                                        id="cpmd"
                                                        name="cpmd"
                                                        value={cpmd}
                                                        onChange={(e) => setCpmd(e.target.value)}
                                                        className="mt-1 block w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                    >
                                                        <option value="BIOCON section">BIOCON section</option>
                                                        <option value="PFS section">PFS section</option>
                                                        <option value="PHPS SECTION">PHPS SECTION</option>
                                                        <option value="OC-Admin Support Unit">OC-Admin Support Unit</option>
                                                        <option value="OC-ICT Unit">OC-ICT Unit</option>
                                                        <option value="OC-Special Project">OC-Special Project</option>
                                                        <option value="Others">Others</option>
                                                    </select>
                                                </div>
                                            )}
                                            <div>
                                                <Label htmlFor="hiring_date">Hiring Date</Label>
                                                <Input
                                                    id="hiring_date"
                                                    name="hiring_date"
                                                    type="date"
                                                    value={hiring_date}
                                                    onChange={(e) => setHiringDate(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Additional Details */}
                                    <div className="space-y-6">
                                        <HeadingSmall title="Additional Details" description="" />
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="tin_number">TIN Number</Label>
                                                <Input
                                                    id="tin_number"
                                                    name="tin_number"
                                                    type="text"
                                                    value={tin_number}
                                                    onChange={(e) => setTinNumber(e.target.value)}
                                                    className="mt-1"
                                                    placeholder="TIN Number"
                                                />
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="gsis_number">GSIS Number</Label>
                                                <Input
                                                    id="gsis_number"
                                                    name="gsis_number"
                                                    type="text"
                                                    value={gsis_number}
                                                    onChange={(e) => setGsisNumber(e.target.value)}
                                                    className="mt-1"
                                                    placeholder="GSIS Number"
                                                />
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="address">Address</Label>
                                                <Input
                                                    id="address"
                                                    name="address"
                                                    type="text"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Address"
                                                />
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="date_of_birth">Date of Birth</Label>
                                                <Input
                                                    id="date_of_birth"
                                                    name="date_of_birth"
                                                    type="date"
                                                    value={date_of_birth}
                                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="gender">Gender</Label>
                                                <select
                                                    id="gender"
                                                    name="gender"
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value)}
                                                    className="mt-1 block w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="mobile_number">Mobile Number</Label>
                                                <Input
                                                    id="mobile_number"
                                                    name="mobile_number"
                                                    type="text"
                                                    value={mobile_number}
                                                    onChange={(e) => setMobileNumber(e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Mobile Number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Emergency Contact & System Settings */}
                                    <div className="space-y-8">
                                        {/* Emergency Contact Section */}
                                        <div className="space-y-6">
                                            <HeadingSmall title="Emergency Contact" description="" />
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="contact_person">Contact Person</Label>
                                                    <Input
                                                        id="contact_person"
                                                        name="contact_person"
                                                        type="text"
                                                        value={contact_person}
                                                        onChange={(e) => setContactPerson(e.target.value)}
                                                        className="mt-1"
                                                        placeholder="Emergency Contact Person"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor="contact_number">Contact Number</Label>
                                                    <Input
                                                        id="contact_number"
                                                        name="contact_number"
                                                        type="text"
                                                        value={contact_number}
                                                        onChange={(e) => setContactNumber(e.target.value)}
                                                        className="mt-1"
                                                        placeholder="Contact Number"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* System Settings Section */}
                                        <div className="space-y-6">
                                            <HeadingSmall title="System Settings" description="" />
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="email">Email *</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="mt-1"
                                                        required
                                                        placeholder="Email address"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor="role">Role *</Label>
                                                    <select
                                                        id="role"
                                                        name="role"
                                                        value={role}
                                                        onChange={(e) => setRole(e.target.value as any)}
                                                        className="mt-1 block w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="superadmin">Super Admin</option>
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor="status">Status *</Label>
                                                    <select
                                                        id="status"
                                                        name="status"
                                                        value={status}
                                                        onChange={(e) => setStatus(e.target.value as any)}
                                                        className="mt-1 block w-full border border-input rounded px-3 py-2 bg-background text-foreground"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Line Separator */}
                                <div className="py-4">
                                    <Separator className="bg-gray-200 dark:bg-neutral-700" />
                                </div>

                                {/* Password Section */}
                                <div className="space-y-4">
                                    <HeadingSmall title="Password Management" description="Set user password" />
                                    
                                    {/* Password Error Message */}
                                    {passwordError && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-800">{passwordError}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="password">New Password *</Label>
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
                                                required
                                                autoComplete="new-password"
                                                placeholder="Enter new password"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 8 characters</p>
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
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
                                                required
                                                autoComplete="new-password"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Line Separator */}
                                <div className="py-4">
                                    <Separator className="bg-gray-200 dark:bg-neutral-700" />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-4 pt-6">
                                    <Button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white disabled:opacity-70">
                                        {isSubmitting ? 'Creating...' : 'Create User'}
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

