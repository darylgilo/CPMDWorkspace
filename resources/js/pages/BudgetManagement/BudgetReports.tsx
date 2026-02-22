import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';

interface AuditLog {
    id: number;
    user: {
        name: string;
        profile_picture?: string;
    };
    action: string;
    details: string;
    created_at: string;
}

interface PageProps {
    auditLogs?: {
        data: AuditLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    search?: string;
    [key: string]: unknown;
}

export default function BudgetReports() {
    const { props } = usePage<PageProps>();
    const { auditLogs, search: initialSearch = '' } = props;

    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const handleSearch = useCallback((value: string) => {
        router.get(
            '/budgetmanagement',
            { tab: 'reports', search: value },
            { preserveState: true, replace: true }
        );
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== initialSearch) {
                handleSearch(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, handleSearch, initialSearch]);

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!auditLogs) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground text-gray-500">Loading audit logs...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search logs (user, action, details)..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-gray-200 dark:border-neutral-700">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-neutral-800">
                            <TableHead className="w-[180px]">User</TableHead>
                            <TableHead className="w-[100px]">Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="w-[200px]">Date & Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {auditLogs.data.length > 0 ? (
                            auditLogs.data.map((log) => (
                                <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {log.user.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.action === 'Added' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            log.action === 'Updated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-md truncate" title={log.details}>
                                        {log.details}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDateTime(log.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {auditLogs.last_page > 1 && (
                <div className="flex items-center justify-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={auditLogs.current_page === 1}
                        onClick={() => router.get('/budgetmanagement', { tab: 'reports', page: auditLogs.current_page - 1, search: searchTerm }, { preserveState: true })}
                    >
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {auditLogs.current_page} of {auditLogs.last_page}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={auditLogs.current_page === auditLogs.last_page}
                        onClick={() => router.get('/budgetmanagement', { tab: 'reports', page: auditLogs.current_page + 1, search: searchTerm }, { preserveState: true })}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
