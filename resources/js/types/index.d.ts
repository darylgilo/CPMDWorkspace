import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface Section {
    id: number;
    name: string;
    code: string;
    office: string;
    display_order: number;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    sections?: Section[];
    SECTIONS_BY_OFFICE?: Record<string, string[]>;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    profile_picture?: string | null;
    profile_picture_url?: string | null;
    section_id?: number | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;

    // Employment Information
    employee_id?: string | null;
    position?: string | null;
    employment_status?: string | null;
    item_number?: string | null;
    office?: string | null;
    cpmd?: string | null;

    // Personal Information
    hiring_date?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    address?: string | null;

    // Contact Information
    mobile_number?: string | null;
    contact_number?: string | null;
    contact_person?: string | null;

    // Government Information
    gsis_number?: string | null;
    landbank_number?: string | null;
    tin_number?: string | null;

    // Additional fields
    role?: string | null;
    status?: string | null;
    last_login_at?: string | null;

    [key: string]: unknown; // This allows for additional properties...
}
