import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import { login } from '@/routes';
import { Form, Head, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AuthLayout from '@/layouts/auth-layout';

// Sections interface
interface Section {
    id: number;
    name: string;
    code: string;
    office: string;
    display_order: number;
}

interface PageProps {
    [key: string]: unknown;
    sections?: Section[];
    SECTIONS_BY_OFFICE?: Record<string, string[]>;
}

export default function Register() {
    // Get sections from backend
    const { props } = usePage<PageProps>();
    const { sections, SECTIONS_BY_OFFICE: fallbackSections } = props;

    // State for office and section
    const [office, setOffice] = useState<string>('');
    const [sectionId, setSectionId] = useState<string>('');

    // Office options
    const officeOptions = [
        'DO', 'ADO RDPSS', 'ADO RS', 'PMO', 'BIOTECH', 'NSIC', 'ADMINISTRATIVE', 
        'CPMD', 'CRPSD', 'AED', 'PPSSD', 'NPQSD', 'NSQCS', 'Baguio BPI center', 
        'Davao BPI center', 'Guimaras BPI center', 'La Granja BPI center', 
        'Los Baños BPI center', 'Others'
    ];

    // Group sections by office
    const sectionsByOffice = (() => {
        if (sections && sections.length > 0) {
            const grouped: Record<string, string[]> = {};
            sections.forEach(section => {
                if (!grouped[section.office]) {
                    grouped[section.office] = [];
                }
                grouped[section.office].push(section.name);
            });
            return grouped;
        }
        return fallbackSections || {};
    })();

    // Get available sections based on selected office
    const availableSections = sectionsByOffice[office] || [];

    // Reset section when office changes
    useEffect(() => {
        setSectionId('');
    }, [office]);
    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />
            
            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-3"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Enter Surname, Firstname, Lastname"
                                    className="uppercase placeholder:normal-case"
                                    style={{ textTransform: 'uppercase' }}
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="Enter your Email Address"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="office">Office</Label>
                                    <Select name="office" value={office} onValueChange={setOffice} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your office" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {officeOptions.map((officeOption) => (
                                                <SelectItem key={officeOption} value={officeOption}>
                                                    {officeOption}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.office} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="section_id">Section</Label>
                                    <Select 
                                        name="section_id" 
                                        value={sectionId} 
                                        onValueChange={setSectionId} 
                                        required
                                        disabled={!office}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={office ? "Select your section" : "Select office first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSections.map((sectionName, index) => (
                                                <SelectItem key={index} value={sectionName}>
                                                    {sectionName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.section_id} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Enter Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm your Password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-[#163832] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 md:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                tabIndex={7}
                                data-test="register-user-button"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={8}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
