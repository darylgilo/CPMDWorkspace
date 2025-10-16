import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Trash2, Power, PowerOff, Edit3, UserCheck, UserX, ChevronUp, ChevronDown, Users, TrendingUp, UserPlus, UserRoundPlus, Activity, Search } from 'lucide-react';
import FlashMessage from '@/components/flash-message';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

// Breadcrumb navigation items for the user management page
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: '/usermanagement',
    },
];

// Available user roles for the system
const roles = ['user', 'admin', 'superadmin'];

export default function UserManagement() {
    // Get users data and search term from page props
    const pageProps = usePage().props as any;
    const { users = { data: [] }, search = '', perPage: perPageProp = 10, status: statusProp = 'active', analytics: analyticsProp } = pageProps;
    
    // Debug: Log the props to see what's being received
    console.log('Page props:', pageProps);
    console.log('Flash messages:', pageProps.flash);
    
    // Search functionality state
    const [searchValue, setSearchValue] = useState(search || '');
    const [perPage, setPerPage] = useState<number>(Number(perPageProp) || 10);
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>(statusProp === 'inactive' ? 'inactive' : 'active');
    
    // Sorting state
    const [sortField, setSortField] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    
    // State for managing dropdown menus (if any)
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

    // Calculate analytics data from the currently visible list (fallback only)
    const calculateAnalytics = () => {
        const userData = users?.data || [];
        const totalUsers = userData.length;
        const activeUsers = userData.filter((user: any) => user.status === 'active').length;
        const inactiveUsers = userData.filter((user: any) => user.status === 'inactive').length;
        
        // Calculate new users this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const newUsersThisMonth = userData.filter((user: any) => {
            if (!user.created_at) return false;
            const createdDate = new Date(user.created_at);
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;
        
        // Calculate online users (users who logged in within last 15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const onlineUsers = userData.filter((user: any) => {
            if (!user.last_login_at) return false;
            const lastLogin = new Date(user.last_login_at);
            return lastLogin > fifteenMinutesAgo;
        }).length;
        
        return {
            totalUsers,
            activeUsers,
            newUsersThisMonth,
            onlineUsers
        };
    };

    // Prefer fixed analytics from server so they do not change with table filters
    const analytics = analyticsProp ?? calculateAnalytics();

    // Sync local state when props change
    useEffect(() => {
        setSearchValue(search || '');
    }, [search]);
    useEffect(() => {
        setPerPage(Number(perPageProp) || 10);
    }, [perPageProp]);
    useEffect(() => {
        setStatusFilter(statusProp === 'inactive' ? 'inactive' : 'active');
    }, [statusProp]);
    
    // Get sorting parameters from page props
    const { sort: sortProp = 'name', direction: directionProp = 'asc' } = usePage().props as any;
    
    // Debug: Log sorting props
    console.log('Sort props:', { sortProp, directionProp });
    
    // Sync sorting state with backend props
    useEffect(() => {
        console.log('Syncing sorting state:', { sortProp, directionProp });
        if (sortProp) {
            setSortField(sortProp);
        }
        if (directionProp === 'asc' || directionProp === 'desc') {
            setSortDirection(directionProp);
        }
    }, [sortProp, directionProp]);
    
    // Handle user deletion with confirmation
    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            router.delete(`/superadmin/users/${id}`, { preserveScroll: true });
        }
    };
    
    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/superadmin/usermanagement', { 
            search: searchValue, 
            perPage, 
            status: statusFilter,
            sort: sortField,
            direction: sortDirection
        }, { preserveState: true, replace: true });
    };
    
    // Handle pagination navigation (links already include query via withQueryString)
    const handlePageChange = (url: string) => {
        router.get(url, {}, { preserveState: true, replace: true });
    };
    
    // Handle user status change (activate/deactivate)
    const handleStatusChange = (userId: number, status: string) => {
        router.patch(`/superadmin/users/${userId}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => {
                setDropdownOpen(null);
                router.reload({ only: ['users'] });
            },
        });
    };

    // Handle sorting
    const handleSort = (field: string) => {
        console.log('Sorting by:', field, 'Current sort:', sortField, 'Current direction:', sortDirection);
        
        if (sortField === field) {
            // Toggle direction if same field
            const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortDirection(newDirection);
            console.log('Toggling direction to:', newDirection);
            router.get('/superadmin/usermanagement', { 
                search: searchValue, 
                perPage, 
                status: statusFilter,
                sort: field,
                direction: newDirection
            }, { preserveState: true, replace: true });
        } else {
            // Set new field with ascending direction
            setSortField(field);
            setSortDirection('asc');
            console.log('Setting new field:', field, 'with direction: asc');
            router.get('/superadmin/usermanagement', { 
                search: searchValue, 
                perPage, 
                status: statusFilter,
                sort: field,
                direction: 'asc'
            }, { preserveState: true, replace: true });
        }
    };

    // Sort icon component
    const SortIcon = ({ field }: { field: string }) => {
        console.log('SortIcon render:', { field, sortField, sortDirection });
        
        if (sortField !== field) {
            return (
                <div className="inline-flex flex-col ml-1 text-gray-400">
                    <ChevronUp size={12} />
                    <ChevronDown size={12} />
                </div>
            );
        }
        
        return (
            <div className="inline-flex flex-col ml-1 text-gray-600 dark:text-gray-300">
                {sortDirection === 'asc' ? (
                    <ChevronUp size={12} className="text-gray-600 dark:text-gray-300" />
                ) : (
                    <ChevronDown size={12} className="text-gray-600 dark:text-gray-300" />
                )}
            </div>
        );
    };

    // Status filter toggle is controlled and synchronized with server via statusFilter
    
    return (
        <AppLayout breadcrumbs={breadcrumbs.map(crumb => ({ title: crumb.title, href: crumb.href }))}>
            <Head title="User Management" />
            <FlashMessage type="success" />
            <FlashMessage type="error" />
            <FlashMessage type="warning" />
            <FlashMessage type="info" />
            
       
            <div className="flex flex-col gap-4 p-4">
                {/* Page Header */}
               
                
                {/* Analytics Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 ">
                    {/* Total Users Card */}
                    <div className="bg-[#163832] text-white dark:bg-[#163832] dark:text-white rounded-lg md:rounded-xl border border-gray-200 dark:border-neutral-800 p-3 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs md:text-sm font-medium text-white/80 dark:text-gray-400">Total Users</p>
                                <p className="text-xl md:text-3xl font-bold text-white dark:text-white">{analytics.totalUsers}</p>
                            </div>
                            <div className="self-start h-8 w-8 md:h-12 md:w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                <Users className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>

                    {/* Active Users Card */}
                    <div className="bg-[#163832] text-white dark:bg-[#163832] dark:text-white rounded-lg md:rounded-xl border border-gray-200 dark:border-neutral-800 p-3 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs md:text-sm font-medium text-white/80 dark:text-gray-400">Active Users</p>
                                <p className="text-xl md:text-3xl font-bold text-white dark:text-white">{analytics.activeUsers}</p>
                            </div>
                            <div className="self-start h-8 w-8 md:h-12 md:w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                <UserCheck className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>

                    {/* New Users This Month Card */}
                    <div className="bg-[#163832] text-white dark:bg-[#163832] dark:text-white rounded-lg md:rounded-xl border border-gray-200 dark:border-neutral-800 p-3 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs md:text-sm font-medium text-white/80 dark:text-gray-400">New Users</p>
                                <p className="text-xl md:text-3xl font-bold text-white dark:text-white">{analytics.newUsersThisMonth}</p>
                                <p className="text-xs text-white/70 dark:text-gray-400 hidden md:block">This month</p>
                            </div>
                            <div className="self-start h-8 w-8 md:h-12 md:w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                <UserPlus className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-[#DAF1DE]" />
                            </div>
                        </div>
                    </div>

                    {/* Online Users Card */}
                    <div className="bg-[#163832] text-white dark:bg-[#163832] rounded-lg md:rounded-xl border border-gray-200 dark:border-neutral-800 p-3 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs md:text-sm font-medium text-white/80 dark:text-gray-400">Online Users</p>
                                <p className="text-xl md:text-3xl font-bold text-white dark:text-white">{analytics.onlineUsers}</p>
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 hidden md:flex">
                                    <Activity className="h-3 w-3 " />
                                    Last 15 minutes
                                </p>
                            </div>
                            <div className="self-start h-8 w-8 md:h-12 md:w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                <div className="h-2 w-2 md:h-3 md:w-3 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overborder-sidebar-border/70 dark:border-neutral-800 relative min-h-[100vh] flex-1 overflow-x-auto rounded-xl md:min-h-min bg-white dark:bg-neutral-900 p-4 border-t-4 border-t-[#163832] dark:border-t-[#235347] border-l border-r border-b border-gray-200 dark:border-neutral-600" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                {/* DataTables-style Controls */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                  {/* Left: Show entries and Add User button */}
                  <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 flex-wrap">
                    {/* Add User Button */}
                    <button
                    title="Add User"
                      onClick={() => {
                        router.get('/superadmin/usermanagement/create', {}, { preserveState: false, replace: false });
                      }}
                      className="inline-flex items-center justify-center w-full md:w-auto gap-2 px-3 py-1.5 bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white text-sm font-medium rounded-md transition-colors duration-200 "
                    >
                      <UserRoundPlus className="h-4 w-4" />
                      <span className="hidden md:inline">Add User</span>
                    </button>
                    
                    {/* Show entries */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="entries" className="font-medium">Show</label>
                      <select
                        id="entries"
                        className="border rounded px-2 py-1 bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-gray-600"
                        value={perPage}
                        onChange={(e) => {
                          const newPerPage = parseInt(e.target.value, 10) || 10;
                          setPerPage(newPerPage);
                          router.get('/superadmin/usermanagement', { 
                              search: searchValue, 
                              perPage: newPerPage, 
                              status: statusFilter,
                              sort: sortField,
                              direction: sortDirection
                          }, { preserveState: true, replace: true });
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>entries</span>
                    </div>
                  </div>
                  
                  {/* Right: Search */}
                  <form onSubmit={handleSearch} className="w-full md:w-auto flex items-center gap-2">
                    <label htmlFor="search" className="font-medium"></label>
                    <div className="relative w-full md:max-w-md">
                      <input
                        id="search"
                        type="text"
                        placeholder="Search by name"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        className="w-full border px-3 py-2 rounded bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#163832] dark:bg-neutral-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-neutral-600"
                        style={{ minWidth: 180 }}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <button type="submit" className="inline-flex w-full md:w-auto max-w-full md:max-w-fit whitespace-nowrap items-center justify-center gap-2 px-3 py-2 bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white rounded-md">Search</button>
                  </form>
                </div>
                    
                {/* Mobile Card Layout */}
                <div className="block md:hidden space-y-3 ">
                    {/* Mobile Sorting Controls */}
                    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 mb-4">
                        <div className="flex flex-col space-y-3">

                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Sort Field Selector */}
                                <div className="flex-1">
                                    <label htmlFor="mobileSortField" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Sort by
                                    </label>
                                    <select
                                        id="mobileSortField"
                                        value={sortField}
                                        onChange={(e) => {
                                            const newField = e.target.value;
                                            setSortField(newField);
                                            router.get('/superadmin/usermanagement', { 
                                                search: searchValue, 
                                                perPage, 
                                                status: statusFilter,
                                                sort: newField,
                                                direction: sortDirection
                                            }, { preserveState: true, replace: true });
                                        }}
                                        className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="name">Name</option>
                                        <option value="role">Role</option>
                                        <option value="created_at">Date Registered</option>
                                        <option value="last_login_at">Last Login</option>
                                    </select>
                                </div>
                                
                                {/* Sort Direction Toggle */}
                                <div className="flex-1">
                                    <label htmlFor="mobileSortDirection" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Order
                                    </label>
                                    <div className="flex">
                                        <button
                                            onClick={() => {
                                                const newDirection = 'asc';
                                                setSortDirection(newDirection);
                                                router.get('/superadmin/usermanagement', { 
                                                    search: searchValue, 
                                                    perPage, 
                                                    status: statusFilter,
                                                    sort: sortField,
                                                    direction: newDirection
                                                }, { preserveState: true, replace: true });
                                            }}
                                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-lg border transition-colors ${
                                                sortDirection === 'asc' 
                                                    ? 'bg-[#163832] text-white border-[#163832] dark:bg-[#235347] dark:border-[#235347]' 
                                                    : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                <ChevronUp size={14} />
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newDirection = 'desc';
                                                setSortDirection(newDirection);
                                                router.get('/superadmin/usermanagement', { 
                                                    search: searchValue, 
                                                    perPage, 
                                                    status: statusFilter,
                                                    sort: sortField,
                                                    direction: newDirection
                                                }, { preserveState: true, replace: true });
                                            }}
                                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-lg border border-l-0 transition-colors ${
                                                sortDirection === 'desc' 
                                                    ? 'bg-[#163832] text-white border-[#163832] dark:bg-[#235347] dark:border-[#235347]' 
                                                    : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                <ChevronDown size={14} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Current Sort Indicator */}
                            <div className="flex items-center justify-center pt-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-neutral-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                                    <span>Sorted by:</span>
                                    <span className="font-medium capitalize">
                                        {sortField === 'created_at' ? 'Date Registered' : 
                                         sortField === 'last_login_at' ? 'Last Login' : 
                                         sortField}
                                    </span>
                                    <span className="text-green-600 dark:text-green-400">
                                        ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {Array.isArray(users?.data) && users.data.length > 0 ? users.data.map((user: any) => (
                            <div key={user.id} className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-neutral-400">{user.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-white flex items-center justify-center ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                        {user.status === 'active' ? <UserCheck size={16} /> : <UserX size={16} />}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500 dark:text-neutral-400">Role:</span>
                                        <span className="ml-2 text-gray-900 dark:text-white capitalize">{user.role}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-neutral-400">Status:</span>
                                        <span className={`ml-2 ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                                            {user.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-neutral-400">
                                    <div>Registered: {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</div>
                                    <div>Last Login: {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        className="bg-red-500 text-white p-2 rounded hover:bg-red-700 transition-colors flex-1"
                                        onClick={() => handleDelete(user.id)}
                                        title="Delete User"
                                    >
                                        <Trash2 size={16} className="mx-auto" />
                                    </button>
                                    <button
                                        className={`p-2 rounded text-white transition-colors flex-1 ${user.status === 'active' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                                        onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                        title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                                    >
                                        {user.status === 'active' ? <PowerOff size={16} className="mx-auto" /> : <Power size={16} className="mx-auto" />}
                                    </button>
                                    <button 
                                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors flex-1" 
                                        title="Edit Profile"
                                        onClick={() => router.get(`/superadmin/usermanagement/${user.id}/edit`)}
                                    >
                                        <Edit3 size={16} className="mx-auto" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-500 dark:text-neutral-400">No users found.</div>
                        )}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden md:block">
                        <Table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                            <TableHeader>
                                <TableRow className="border-b border-gray-200 dark:border-neutral-700 border-t">
                                    <TableHead 
                                        className="px-4 py-2 text-left border-l cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Name
                                            <SortIcon field="name" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-left">Email</TableHead>
                                    <TableHead 
                                        className="px-4 py-2 text-left cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('role')}
                                    >
                                        <div className="flex items-center">
                                            Role
                                            <SortIcon field="role" />
                                        </div>
                                    </TableHead>
                                    <TableHead 
                                        className="px-4 py-2 text-left cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center">
                                            Date Registered
                                            <SortIcon field="created_at" />
                                        </div>
                                    </TableHead>
                                    <TableHead 
                                        className="px-4 py-2 text-left cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                                        onClick={() => handleSort('last_login_at')}
                                    >
                                        <div className="flex items-center">
                                            Last Login
                                            <SortIcon field="last_login_at" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-center">Status</TableHead>
                                    <TableHead className="px-4 py-2 text-center border-r">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Render user rows or show "No users found" message */}
                                {Array.isArray(users?.data) && users.data.length > 0 ? users.data.map((user: any) => (
                                    <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors duration-200 cursor-default">
                                        <TableCell className="border-b px-4 py-2 border-l">{user.name}</TableCell>
                                        <TableCell className="border-b px-4 py-2">{user.email}</TableCell>
                                        <TableCell className="border-b px-4 py-2 text-left capitalize">{user.role}</TableCell>
                                        <TableCell className="border-b px-4 py-2 text-left">{user.created_at ? new Date(user.created_at).toLocaleString() : ''}</TableCell>
                                        <TableCell className="border-b px-4 py-2 text-left">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : ''}</TableCell>
                                        <TableCell className="border-b px-4 py-2 text-center">
                                            {/* Status indicator with color coding */}
                                            <span className={`px-0 py-1 rounded-full text-white flex items-center justify-center ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                                {user.status === 'active' ? <UserCheck size={16} /> : <UserX size={16} />}
                                            </span>
                                        </TableCell>
                                        <TableCell className="border-b px-4 py-2 border-r">
                                            <div className="flex gap-2 justify-center">
                                                {/* Action buttons for each user */}
                                                <button
                                                    className="bg-red-500 text-white p-2 rounded hover:bg-red-700 transition-colors"
                                                    onClick={() => handleDelete(user.id)}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    className={`p-2 rounded text-white transition-colors ${user.status === 'active' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                                                    onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                                    title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                                                >
                                                    {user.status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                                                </button>
                                                <button 
                                                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors" 
                                                    title="Edit Profile"
                                                    onClick={() => router.get(`/superadmin/usermanagement/${user.id}/edit`)}
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-4">No users found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Bottom Bar: active/inactive Toggle (left) + Pagination (right) */}
                    <div className="mt-4 flex w-full items-center justify-between">
                      {/* Status Toggle */}
                      <div className="flex items-center gap-2">
                        
                        <button
                          type="button"
                          onClick={() => { 
                            setStatusFilter('active'); 
                            router.get('/superadmin/usermanagement', { 
                                search: searchValue, 
                                perPage, 
                                status: 'active',
                                sort: sortField,
                                direction: sortDirection
                            }, { preserveState: true, replace: true }); 
                          }}
                          className={`px-3 py-1 rounded border text-sm ${statusFilter === 'active' ? 'bg-[#163832] text-white hover:bg-[#163832]/90 border-[#163832] dark:bg-[#235347] dark:hover:bg-[#235347]/90 dark:border-[#235347]' : 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-600'}`}
                        >
                          Active Users
                        </button>
                        <button
                          type="button"
                          onClick={() => { 
                            setStatusFilter('inactive'); 
                            router.get('/superadmin/usermanagement', { 
                                search: searchValue, 
                                perPage, 
                                status: 'inactive',
                                sort: sortField,
                                direction: sortDirection
                            }, { preserveState: true, replace: true }); 
                          }}
                          className={`px-3 py-1 rounded border text-sm ${statusFilter === 'inactive' ? 'bg-[#163832] text-white hover:bg-[#163832]/90 border-[#163832] dark:bg-[#235347] dark:hover:bg-[#235347]/90 dark:border-[#235347]': 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-600'}`}
                        >
                          New Users
                        </button>
                      </div>

                      {/* Pagination Controls */}
                      {users.links && users.links.length > 1 && (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {users.links.map((link: any, idx: number) => (
                            <button
                              key={idx}
                              disabled={!link.url}
                              className={`px-3 py-1 rounded border transition-colors ${
                                link.active
                                  ? 'bg-[#163832] text-white hover:bg-[#163832]/90 border-[#163832] dark:bg-[#235347] dark:hover:bg-[#235347]/90 dark:border-[#235347]'
                                  : (link.label?.includes('Previous') || link.label?.includes('Next'))
                                      ? 'bg-[#163832] text-white hover:bg-[#235347] border-[#163832] dark:bg-[#235347] dark:hover:bg-[#235347]/90 dark:border-[#235347]'
                                      : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-gray-100 dark:border-neutral-600'
                              }`}
                              dangerouslySetInnerHTML={{ __html: link.label }}
                              onClick={() => link.url && handlePageChange(link.url)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
