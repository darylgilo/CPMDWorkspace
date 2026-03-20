import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CheckCircle, Clock, Eye, Filter, ListFilter, MoreHorizontal, Search, User, Users, ChevronDown, Plus, ChevronUp, X } from 'lucide-react';
import HelpdeskTabs from './HelpdeskTabs';
import StatusDropdown from '@/components/StatusDropdown';
import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

/* ───── Avatar stack ───── */
function AvatarStack({
    assignees,
    users,
    onAdd,
}: {
    assignees: number[] | null;
    users: User[];
    onAdd?: () => void;
}) {
    const list = assignees ?? [];
    const visible = list.slice(0, 6);
    const overflow = list.length - visible.length;

    const colors = ['#163832', '#1a4d3e', '#235347', '#2a6358', '#0f766e'];
    const getUserData = (id: number | string) => users.find((u) => String(u.id) === String(id));

    return (
        <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
                {visible.map((uid, i) => {
                    const userData = getUserData(uid);
                    const name = userData?.name ?? `#${uid}`;
                    const avatar = userData?.avatar || userData?.profile_picture_url;
                    const initial = name.charAt(0).toUpperCase();

                    return (
                        <div
                            key={uid}
                            title={name}
                            className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white text-xs font-bold text-white dark:border-neutral-900"
                            style={{ background: colors[i % colors.length] }}
                        >
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{initial}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {overflow > 0 && (
                <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                    +{overflow}
                </span>
            )}
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-700"
                    title="Assign member"
                >
                    <Plus className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

interface Ticket {
    id: string;
    user: string;
    avatar: string | null;
    profile_picture?: string | null;
    issue: string;
    status: string;
    assigned: string | null;
    assigned_user_id: number | null;
    date: string;
    priority: string;
    form_id?: number;
    submission_id?: number;
    assignees?: number[] | null;
}

interface Stats {
    total: number;
    unassigned: number;
    in_progress: number;
    resolved: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    profile_picture_url?: string | null;
}

interface HelpdeskProps {
    tickets: Ticket[];
    stats: Stats;
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Helpdesk Dashboard',
        href: '/helpdesk',
    },
];

const statsConfig = [
    { name: 'Total Tickets', value: 'total', icon: ListFilter, color: 'text-gray-600', bg: 'bg-gray-50' },
    { name: 'Unassigned', value: 'unassigned', icon: User, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'In Progress', value: 'in_progress', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Resolved', value: 'resolved', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
];

const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    'resolved': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
};

const priorityColors = {
    low: 'text-gray-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
};

const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'in_progress', label: 'In Progress', icon: Eye },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle },
];

/* ───── Avatar Component ───── */
function UserAvatar({ user, size = 'sm' }: { user: User | null; size?: 'xs' | 'sm' | 'md' }) {
    if (!user) return null;

    const sizeClasses = {
        xs: 'h-5 w-5 text-[8px]',
        sm: 'h-6 w-6 text-[10px]',
        md: 'h-8 w-8 text-xs'
    };

    const colors = ['#163832', '#1a4d3e', '#235347', '#2a6358', '#0f766e'];
    const colorIndex = user.id % colors.length;
    const initial = user.name.charAt(0).toUpperCase();

    return (
        <div
            title={user.name}
            className={`inline-flex items-center justify-center overflow-hidden rounded-full border-2 border-white font-bold text-white dark:border-neutral-900 ${sizeClasses[size]}`}
            style={{ background: colors[colorIndex] }}
        >
            {user.profile_picture_url || user.avatar ? (
                <img
                    src={(user.profile_picture_url || user.avatar) as string}
                    alt={user.name}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span>{initial}</span>
            )}
        </div>
    );
}

export default function Helpdesk({ tickets, stats, users }: HelpdeskProps) {
    const [statusDropdown, setStatusDropdown] = useState<number | null>(null);
    const [assignmentDropdown, setAssignmentDropdown] = useState<number | null>(null);
    const [assignmentModal, setAssignmentModal] = useState<number | null>(null);
    const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
    const assignButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
    const [sortField, setSortField] = useState('id');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.status-dropdown') && !target.closest('.status-button')) {
                setStatusDropdown(null);
            }
            if (!target.closest('.assignment-dropdown') && !target.closest('.assignment-button')) {
                setAssignmentDropdown(null);
            }
        };

        if (statusDropdown !== null || assignmentDropdown !== null) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [statusDropdown, assignmentDropdown]);

    const handleStatusClick = (submissionId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        const button = buttonRefs.current[submissionId];
        if (button) {
            const rect = button.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX
            });
        }
        setStatusDropdown(submissionId);
    };

    const handleStatusChange = (submissionId: number, newStatus: string) => {
        router.patch(`/helpdesk/submission/${submissionId}/status`, { status: newStatus }, {
            onSuccess: () => {
                setStatusDropdown(null);
            },
            onError: (errors) => {
                console.error('Error updating status:', errors);
            }
        });
    };

    const handleAssignmentClick = (submissionId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        const button = assignButtonRefs.current[submissionId];
        if (button) {
            const rect = button.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX
            });
        }
        setAssignmentDropdown(submissionId);
    };

    const handleAssignmentModal = (submissionId: number) => {
        const ticket = tickets.find(t => t.submission_id === submissionId);
        if (ticket) {
            setSelectedAssignees(ticket.assignees || (ticket.assigned_user_id ? [ticket.assigned_user_id] : []));
            setAssignmentModal(submissionId);
            setUserSearch('');
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const handleAssignmentChange = (submissionId: number, assignedUserIds: number[]) => {
        router.patch(`/helpdesk/submission/${submissionId}/assignment`, { 
            assignees: assignedUserIds.length > 0 ? assignedUserIds : null,
            assigned_to: assignedUserIds.length > 0 ? assignedUserIds[0] : null
        }, {
            onSuccess: () => {
                setAssignmentModal(null);
            },
            onError: (errors) => {
                console.error('Error updating assignment:', errors);
            }
        });
    };

    const handleSort = (field: string) => {
        const dir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(dir);
    };

    const sortedTickets = [...tickets].sort((a, b) => {
        const av = a[sortField as keyof Ticket];
        const bv = b[sortField as keyof Ticket];
        if (typeof av === 'string' && typeof bv === 'string')
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        if (typeof av === 'number' && typeof bv === 'number')
            return sortDir === 'asc' ? av - bv : bv - av;
        return 0;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Helpdesk Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <HelpdeskTabs activeTab="dashboard" />
                <div className="flex flex-col justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 border-none dark:text-gray-100">Helpdesk Management</h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Manage and resolve employee requests and tickets.</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statsConfig.map((stat) => (
                        <div key={stat.name} className="flex items-center rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                            <div className={`mr-3 sm:mr-4 rounded-lg p-2 sm:p-3 ${stat.bg}`}>
                                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats[stat.value as keyof Stats]}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 sm:gap-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="border-b border-gray-200 p-3 sm:p-4 dark:border-neutral-700">
                        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">Show:</span>
                                <select className="h-7 w-[60px] border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100 rounded-md border">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">entries</span>
                            </div>
                            
                            <div className="relative flex-1 max-w-sm w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tickets, users..."
                                    className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                                    <tr>
                                        <th 
                                            className="px-4 sm:px-6 py-3 sm:py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                                            onClick={() => handleSort('id')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Ticket #
                                                {sortField === 'id' ? (
                                                    sortDir === 'asc' ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-4 sm:px-6 py-3 sm:py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                                            onClick={() => handleSort('user')}
                                        >
                                            <div className="flex items-center gap-1">
                                                User
                                                {sortField === 'user' ? (
                                                    sortDir === 'asc' ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-4 sm:px-6 py-3 sm:py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                                            onClick={() => handleSort('issue')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Form Type
                                                {sortField === 'issue' ? (
                                                    sortDir === 'asc' ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-4 sm:px-6 py-3 sm:py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Status
                                                {sortField === 'status' ? (
                                                    sortDir === 'asc' ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-4 sm:px-6 py-3 sm:py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                                            onClick={() => handleSort('priority')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Priority
                                                {sortField === 'priority' ? (
                                                    sortDir === 'asc' ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-4 sm:px-6 py-3 sm:py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                                            onClick={() => handleSort('assigned')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Assignees
                                                {sortField === 'assigned' ? (
                                                    sortDir === 'asc' ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-left hidden lg:table-cell">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    {sortedTickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors dark:hover:bg-neutral-800/50">
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[#163832] dark:text-[#4ade80]">{ticket.id}</td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[10px] sm:text-xs font-bold text-white dark:bg-neutral-700">
                                                        {ticket.avatar || ticket.profile_picture ? (
                                                            <img
                                                                src={ticket.avatar || ticket.profile_picture || ''}
                                                                alt={ticket.user}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600 dark:text-gray-300">{ticket.user[0]}</span>
                                                            )}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{ticket.user}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{ticket.date}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <div className="line-clamp-1 max-w-[120px] sm:max-w-[200px] font-medium text-gray-900 dark:text-gray-100">{ticket.issue}</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <StatusDropdown
                                                    value={ticket.status}
                                                    options={statusOptions}
                                                    onChange={(newStatus) => {
                                                        if (ticket.submission_id) {
                                                            handleStatusChange(ticket.submission_id, newStatus);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-xs font-semibold capitalize ${
                                                    ticket.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                                                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' :
                                                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                                }`}>
                                                    {ticket.priority || 'medium'}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <AvatarStack
                                                    assignees={ticket.assignees || (ticket.assigned_user_id ? [ticket.assigned_user_id] : null)}
                                                    users={users}
                                                    onAdd={() => {
                                                        if (ticket.submission_id) {
                                                            handleAssignmentModal(ticket.submission_id);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-center hidden lg:table-cell">
                                                <Link href={`/helpdesk/submission/${ticket.submission_id}`} className="text-[#163832] hover:text-[#163832]/80 dark:text-[#4ade80] dark:hover:text-[#4ade80]/80">
                                                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3 p-4">
                            {sortedTickets.map((ticket) => (
                                <div key={ticket.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 shadow-sm">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-[#163832] dark:text-[#4ade80]">{ticket.id}</span>
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                                                    ticket.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                                                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' :
                                                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                                }`}>
                                                    {ticket.priority || 'medium'}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{ticket.issue}</h3>
                                        </div>
                                        <Link href={`/helpdesk/submission/${ticket.submission_id}`} className="text-[#163832] hover:text-[#163832]/80 dark:text-[#4ade80] dark:hover:text-[#4ade80]/80">
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[10px] font-bold text-white dark:bg-neutral-700">
                                            {ticket.avatar || ticket.profile_picture ? (
                                                <img
                                                    src={ticket.avatar || ticket.profile_picture || ''}
                                                    alt={ticket.user}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-600 dark:text-gray-300">{ticket.user[0]}</span>
                                                )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{ticket.user}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.date}</div>
                                        </div>
                                    </div>

                                    {/* Status and Assignees */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <StatusDropdown
                                                value={ticket.status}
                                                options={statusOptions}
                                                onChange={(newStatus) => {
                                                    if (ticket.submission_id) {
                                                        handleStatusChange(ticket.submission_id, newStatus);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <AvatarStack
                                            assignees={ticket.assignees || (ticket.assigned_user_id ? [ticket.assigned_user_id] : null)}
                                            users={users}
                                            onAdd={() => {
                                                if (ticket.submission_id) {
                                                    handleAssignmentModal(ticket.submission_id);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Assignment Modal */}
            {assignmentModal && (
                <Dialog open={true} onOpenChange={() => setAssignmentModal(null)}>
                    <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Assign Ticket</DialogTitle>
                        </DialogHeader>
                        <div className="p-6 pt-0">
                            <p className="text-sm text-gray-600 mb-4">
                                Select users to assign this ticket to:
                            </p>
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="h-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border-b border-gray-100 pb-2 mb-2 dark:text-gray-300 dark:hover:text-gray-100 dark:border-neutral-800">
                                    <input
                                        type="checkbox"
                                        checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedAssignees.some((id) => String(id) === String(u.id)))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedAssignees(filteredUsers.map((u) => u.id));
                                            } else {
                                                setSelectedAssignees([]);
                                            }
                                        }}
                                        className="rounded border-gray-300 text-[#163832] dark:border-neutral-700 dark:bg-neutral-900"
                                    />
                                    <span>Select All</span>
                                </label>
                                {filteredUsers.map((user) => {
                                    return (
                                        <label key={user.id} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border-b border-gray-100 pb-2 mb-2 dark:text-gray-300 dark:hover:text-gray-100 dark:border-neutral-800">
                                            <input
                                                type="checkbox"
                                                checked={selectedAssignees.some((id) => String(id) === String(user.id))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedAssignees([...selectedAssignees, user.id]);
                                                    } else {
                                                        setSelectedAssignees(selectedAssignees.filter((id) => id !== user.id));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-[#163832] dark:border-neutral-700 dark:bg-neutral-900"
                                            />
                                            <div className="flex items-center gap-2">
                                                <UserAvatar user={user} size="xs" />
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => setAssignmentModal(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleAssignmentChange(assignmentModal, selectedAssignees);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#163832] hover:bg-[#1a4d3e]"
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
