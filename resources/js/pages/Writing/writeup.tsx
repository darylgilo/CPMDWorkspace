import { Button } from '@/components/ui/button';
import CustomPagination from '@/components/CustomPagination';
import FormDialog, { type FormField } from '@/components/FormDialog';
import SearchBar from '@/components/SearchBar';
import { usePage, router } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Edit3, Trash2, FileText, History, User, MoreVertical, MessageCircle, Heart, Share2, Bookmark, ChevronDown, ChevronUp, Check, MoreHorizontal } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

interface Comment {
    id: number;
    content: string;
    author: {
        id: number;
        name: string;
        email: string;
    };
    created_at: string;
}

interface Document {
    id: number;
    title: string;
    content: string;
    category: string;
    status: 'draft' | 'for review' | 'approved' | 'rejected' | 'posted';
    created_at: string;
    updated_at: string;
    likes_count: number;
    approvals_count: number;
    approved_at?: string;
    is_liked: boolean;
    is_approved: boolean;
    author: {
        id: number;
        name: string;
        email: string;
    };
    histories: Array<{
        id: number;
        action: string;
        user: {
            id: number;
            name: string;
            email: string;
        };
        created_at: string;
    }>;
    comments?: Comment[];
    is_bookmarked?: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    documents?: {
        data: Document[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search?: string;
    perPage?: number;
    categories?: string[];
    flash?: {
        success?: string;
        error?: string;
    };
    current_user?: User;
    [key: string]: unknown;
}

export default function Writeup() {
    const { props } = usePage<PageProps>();
    const {
        documents,
        search = '',
        perPage: perPageProp = 10,
        flash,
        current_user,
    } = props;

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(
        documents?.current_page || 1,
    );
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [sortField, setSortField] = useState<string>('updated_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [comments, setComments] = useState<Record<number, Comment[]>>({});
    const [newComments, setNewComments] = useState<Record<number, string>>({});
    const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
    const [collapsedComments, setCollapsedComments] = useState<Record<number, boolean>>({});
    const [editingComments, setEditingComments] = useState<Record<number, string>>({});
    const [editCommentTexts, setEditCommentTexts] = useState<Record<number, string>>({});

    // Form field configuration for documents
    const documentFormFields: FormField[] = [
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
        },
        {
            name: 'content',
            label: 'Content',
            type: 'custom',
            required: true,
            customRender: (value, onChange) => (
                <textarea
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163832] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    placeholder="Enter document content"
                />
            ),
        },
        {
            name: 'category',
            label: 'Category',
            type: 'select',
            required: true,
            options: [
                { value: 'posting', label: 'Posting' },
                { value: 'travel_report', label: 'Travel Report' },
            ],
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'for review', label: 'For Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'posted', label: 'Posted' },
            ],
        },
    ];

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'posting',
        status: 'draft',
    });

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            category: 'posting',
            status: 'draft',
        });
    };

    const handleAdd = () => {
        resetForm();
        setIsAddDialogOpen(true);
    };

    const handleEdit = (document: Document) => {
        router.get(`/editdocument/${document.id}`);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            router.delete(`/documents/${id}`);
        }
    };

    const handleSubmitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/documents', formData, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                resetForm();
                router.get(
                    '/writing',
                    {
                        tab: 'writeup',
                        search: searchValue,
                        perPage,
                        page: currentPage,
                        sort: sortField,
                        direction: sortDirection,
                    },
                    { preserveState: true },
                );
            },
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/writing',
            {
                tab: 'writeup',
                search: searchValue,
                perPage,
                page,
                sort: sortField,
                direction: sortDirection,
            },
            { preserveState: true, replace: true },
        );
    };

    // Handle sorting
    const handleSort = (field: string) => {
        const newDirection =
            sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        setCurrentPage(1);

        router.get(
            '/writing',
            {
                tab: 'writeup',
                search: searchValue,
                perPage,
                sort: field,
                direction: newDirection,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    // Sort the data client-side
    const sortedDocuments = useMemo(() => {
        if (!documents?.data) return [];

        // Filter out draft and posted documents
        const nonDraftDocuments = documents.data.filter(doc => doc.status !== 'draft' && doc.status !== 'posted');

        return [...nonDraftDocuments].sort((a, b) => {
            let aValue = a[sortField as keyof Document];
            let bValue = b[sortField as keyof Document];

            // Handle dates
            if (sortField.includes('_at')) {
                aValue = aValue ? new Date(aValue as string).getTime() : 0;
                bValue = bValue ? new Date(bValue as string).getTime() : 0;
            }

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // Handle number comparison
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            return 0;
        });
    }, [documents, sortField, sortDirection]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            case 'for review':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'posted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const showHistory = (document: Document) => {
        setSelectedDocument(document);
        setIsHistoryDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateForBlog = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleAddComment = (documentId: number) => {
        const commentText = newComments[documentId];
        if (!commentText || !commentText.trim()) return;

        router.post(
            '/comments',
            {
                document_id: documentId,
                content: commentText,
            },
            {
                onSuccess: (page) => {
                    // Clear the comment input
                    setNewComments(prev => ({ ...prev, [documentId]: '' }));
                    // The page props will be automatically updated by Inertia
                    // No need for manual state updates or page reload
                },
                onError: (errors) => {
                    console.error('Error adding comment:', errors);
                },
                preserveScroll: true,
            }
        );
    };

    const handleLike = (documentId: number) => {
        router.post(
            `/documents/${documentId}/like`,
            {},
            {
                onSuccess: (page) => {
                    // The page props will be automatically updated by Inertia
                    // No need for manual state updates or page reload
                },
                onError: (errors) => {
                    console.error('Error toggling like:', errors);
                },
                preserveScroll: true,
            }
        );
    };

    const handleBookmark = (documentId: number) => {
        router.post(
            `/documents/${documentId}/bookmark`,
            {},
            {
                onSuccess: (page) => {
                    // The page props will be automatically updated by Inertia
                    console.log('Bookmark toggled successfully');
                },
                onError: (errors) => {
                    console.error('Error toggling bookmark:', errors);
                },
                preserveScroll: true,
            }
        );
    };

    const handleShare = (documentId: number) => {
        // In a real app, this would open share dialog
        console.log('Share post:', documentId);
    };

    const handleApprove = (documentId: number) => {
        router.post(
            `/documents/${documentId}/approve`,
            {},
            {
                onSuccess: (page) => {
                    // Check if the document now has 6 or more approvals and update status
                    const updatedDocuments = page.props.documents as any;
                    const updatedDocument = updatedDocuments?.data?.find((doc: Document) => doc.id === documentId);
                    
                    if (updatedDocument) {
                        if (updatedDocument.approvals_count >= 6 && updatedDocument.status !== 'approved') {
                            // Automatically update status to approved
                            router.put(
                                `/documents/${documentId}/status`,
                                { status: 'approved' },
                                {
                                    onSuccess: () => {
                                        // Status updated successfully
                                    },
                                    onError: (errors) => {
                                        console.error('Error updating document status to approved:', errors);
                                    },
                                    preserveScroll: true,
                                }
                            );
                        } else if (updatedDocument.approvals_count < 6 && updatedDocument.status === 'approved') {
                            // Automatically revert status to for review
                            router.put(
                                `/documents/${documentId}/status`,
                                { status: 'for review' },
                                {
                                    onSuccess: () => {
                                        // Status reverted successfully
                                    },
                                    onError: (errors) => {
                                        console.error('Error reverting document status to for review:', errors);
                                    },
                                    preserveScroll: true,
                                }
                            );
                        }
                    }
                },
                onError: (errors) => {
                    console.error('Error toggling approval:', errors);
                },
                preserveScroll: true,
            }
        );
    };

    const handleEditComment = (commentId: number, currentContent: string) => {
        setEditingComments(prev => ({ ...prev, [commentId]: currentContent }));
        setEditCommentTexts(prev => ({ ...prev, [commentId]: currentContent }));
    };

    const handleUpdateComment = (commentId: number) => {
        const updatedContent = editCommentTexts[commentId];
        if (!updatedContent || !updatedContent.trim()) return;

        router.put(
            `/comments/${commentId}`,
            { content: updatedContent },
            {
                onSuccess: () => {
                    // Clear editing state
                    setEditingComments(prev => ({ ...prev, [commentId]: '' }));
                    setEditCommentTexts(prev => ({ ...prev, [commentId]: '' }));
                },
                onError: (errors) => {
                    console.error('Error updating comment:', errors);
                },
                preserveScroll: true,
            }
        );
    };

    const handleDeleteComment = (commentId: number) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            router.delete(`/comments/${commentId}`, {
                onSuccess: () => {
                    // The page props will be automatically updated by Inertia
                    // No need for manual state updates or page reload
                },
                onError: (errors: Record<string, string>) => {
                    console.error('Error deleting comment:', errors);
                },
                preserveScroll: true,
            });
        }
    };

    const handleCancelEdit = (commentId: number) => {
        setEditingComments(prev => ({ ...prev, [commentId]: '' }));
        setEditCommentTexts(prev => ({ ...prev, [commentId]: '' }));
    };

    const togglePostExpansion = (documentId: number) => {
        setExpandedPosts(prev => ({
            ...prev,
            [documentId]: !prev[documentId]
        }));
    };

    const truncateContent = (content: string, maxLength: number = 300) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const toggleComments = (documentId: number) => {
        setCollapsedComments(prev => ({
            ...prev,
            [documentId]: !prev[documentId]
        }));
    };

    return (
        <div className="space-y-6 px-4 py-6">
            {/* Flash Messages */}
            {flash?.success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                    {flash.error}
                </div>
            )}

            {/* Header Controls */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            onClick={handleAdd}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Writeup</span>
                        </Button>
                        <div className="flex items-center gap-2">
                            <label htmlFor="entries" className="font-medium text-sm">
                                Show
                            </label>
                            <Select
                                value={perPage.toString()}
                                onValueChange={(value) => {
                                    const newPerPage = parseInt(value, 10);
                                    setPerPage(newPerPage);
                                    router.get(
                                        '/writing',
                                        {
                                            tab: 'writeup',
                                            search: searchValue,
                                            perPage: newPerPage,
                                        },
                                        {
                                            preserveScroll: true,
                                            replace: true,
                                        }
                                    );
                                }}
                            >
                                <SelectTrigger className="w-[80px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>entries</span>
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-2 md:w-auto">
                        <SearchBar
                            search={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Search write-ups..."
                            className="w-full md:max-w-md"
                            searchRoute="/writing"
                            additionalParams={{ tab: 'writeup', perPage }}
                        />
                    </div>
                </div>
            </div>

            {/* Blog Posts Container */}
            <div className="space-y-8">
                {documents?.data && documents.data.length > 0 ? (
                    sortedDocuments.map((document: Document) => (
                        <div key={document.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Post Header */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-[#163832] dark:bg-[#235347] rounded-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {document.author.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDateForBlog(document.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                                                {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                {document.category === 'posting' ? 'Posting' : 'Travel Report'}
                                            </span>
                                        </div>
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                            {document.title}
                                        </h1>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onClick={() => handleEdit(document)} className="cursor-pointer">
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                            {current_user?.id === document.author.id && (
                                                <DropdownMenuItem onClick={() => handleDelete(document.id)} className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Post Content */}
                                <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
                                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                                        {expandedPosts[document.id] ? (
                                            document.content.split('\n\n').map((paragraph, index) => (
                                                <p key={index} className="mb-4">
                                                    {paragraph}
                                                </p>
                                            ))
                                        ) : (
                                            <p>
                                                {truncateContent(document.content)}
                                            </p>
                                        )}
                                        {document.content.length > 300 && (
                                            <button
                                                onClick={() => togglePostExpansion(document.id)}
                                                className="text-gray-600 dark:text-gray-400 hover:underline hover:text-gray-700 dark:hover:text-white ml-2 text-sm font-medium"
                                            >
                                                {expandedPosts[document.id] ? 'Show less' : 'Read more'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Post Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-neutral-700">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleApprove(document.id)}
                                            className={`flex items-center gap-2 transition-colors ${
                                                document.is_approved 
                                                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md' 
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                                            }`}
                                        >
                                            <Check className="h-4 w-4" />
                                            <span className="text-sm">Approve</span>
                                            {document.approvals_count > 0 && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                    document.is_approved
                                                        ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                    {document.approvals_count}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleLike(document.id)}
                                            className={`flex items-center gap-2 transition-colors ${
                                                document.is_liked 
                                                    ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md' 
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                                            }`}
                                        >
                                            <Heart className={`h-4 w-4 ${document.is_liked ? 'fill-current' : ''}`} />
                                            <span className="text-sm">{document.likes_count}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const commentInput = globalThis.document.getElementById(`comment-${document.id}`) as HTMLTextAreaElement;
                                                commentInput?.focus();
                                            }}
                                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            <span className="text-sm">{(comments[document.id] || document.comments || []).length}</span>
                                        </button>
                                        <button
                                            onClick={() => handleShare(document.id)}
                                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                                        >
                                            <Share2 className="h-4 w-4" />
                                            <span className="text-sm">Share</span>
                                        </button>
                                        <button
                                            onClick={() => handleBookmark(document.id)}
                                            className={`flex items-center gap-2 transition-colors ${
                                                document.is_bookmarked 
                                                    ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md' 
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400'
                                            }`}
                                        >
                                            <Bookmark className={`h-4 w-4 ${document.is_bookmarked ? 'fill-current' : ''}`} />
                                            <span className="text-sm">Save</span>
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Last updated: {formatDate(document.updated_at)}
                                    </div>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="border-t border-gray-200 dark:border-neutral-700">
                                {/* Comments Header with Toggle */}
                                <div className="bg-gray-50 dark:bg-neutral-800 px-6 py-4 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Comments ({(comments[document.id] || document.comments || []).length})
                                    </h3>
                                    <button
                                        onClick={() => toggleComments(document.id)}
                                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#163832] dark:hover:text-white transition-colors"
                                    >
                                        <span className="text-sm font-medium">
                                            {collapsedComments[document.id] ? 'Hide Comments' : 'Show Comments'}
                                        </span>
                                        {collapsedComments[document.id] ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                
                                {/* Collapsible Comments Content */}
                                {collapsedComments[document.id] && (
                                    <div className="bg-gray-50 dark:bg-neutral-800 p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                        {/* Add Comment */}
                                        <div>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 bg-[#163832] dark:bg-[#235347] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <textarea
                                                        id={`comment-${document.id}`}
                                                        value={newComments[document.id] || ''}
                                                        onChange={(e) => setNewComments(prev => ({ ...prev, [document.id]: e.target.value }))}
                                                        placeholder="Write a comment..."
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#163832] dark:bg-neutral-700 dark:text-white"
                                                        rows={3}
                                                    />
                                                    <div className="mt-2 flex justify-end">
                                                        <Button
                                                            onClick={() => handleAddComment(document.id)}
                                                            disabled={!newComments[document.id]?.trim()}
                                                            className="px-4 py-1.5 text-sm bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white"
                                                        >
                                                            Post Comment
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-4">
                                            {(comments[document.id] || document.comments || []).map((comment: Comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <div className="w-8 h-8 bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                                    {comment.author.name}
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {formatDate(comment.created_at)}
                                                                </span>
                                                            </div>
                                                            {current_user && current_user.id === comment.author.id && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-6 w-6 p-0">
                                                                            <span className="sr-only">Open menu</span>
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)} className="text-gray-700 dark:text-gray-300">
                                                                            <Edit3 className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>
                                                        {editingComments[comment.id] ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={editCommentTexts[comment.id] || ''}
                                                                    onChange={(e) => setEditCommentTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#163832] dark:bg-neutral-700 dark:text-white text-sm"
                                                                    rows={3}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        onClick={() => handleUpdateComment(comment.id)}
                                                                        disabled={!editCommentTexts[comment.id]?.trim()}
                                                                        className="px-3 py-1 text-xs bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white"
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleCancelEdit(comment.id)}
                                                                        variant="outline"
                                                                        className="px-3 py-1 text-xs border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                                                {comment.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!comments[document.id] || comments[document.id].length === 0) && 
                                             (!document.comments || document.comments.length === 0) && (
                                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                                    No comments yet. Be the first to comment!
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No writeups found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Get started by creating your first writeup.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {documents?.data && documents.data.length > 0 && (
                <div className="mt-8">
                    <CustomPagination
                        currentPage={currentPage}
                        totalItems={documents?.total || 0}
                        perPage={perPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}

            {/* Add Dialog */}
            <FormDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSubmit={handleSubmitAdd}
                formData={formData}
                onInputChange={(e) => {
                    const { name, value } = e.target;
                    setFormData((prev) => ({ ...prev, [name]: value }));
                }}
                onSelectChange={(name, value) =>
                    setFormData((prev) => ({ ...prev, [name]: value }))
                }
                fields={documentFormFields}
                title="Add New Document"
                description="Fill in the details to add a new document."
                submitButtonText="Add Document"
            />
        </div>
    );
}
