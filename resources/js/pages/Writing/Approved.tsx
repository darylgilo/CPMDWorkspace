import CustomPagination from '@/components/CustomPagination';
import ImageModal from '@/components/ImageModal';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePopupAlert } from '@/components/ui/popup-alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { renderTextWithLinks } from '@/lib/text-utils';
import { router, usePage } from '@inertiajs/react';
import {
    Bookmark,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Edit3,
    Heart,
    MessageCircle,
    MoreHorizontal,
    MoreVertical,
    Share2,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Comment {
    id: number;
    content: string;
    author: {
        id: number;
        name: string;
        email: string;
        profile_picture?: string;
    };
    created_at: string;
}

interface DocumentImage {
    id: number;
    image_path: string;
    image_name: string;
    file_size: number;
    mime_type: string;
    sort_order: number;
    url: string;
    thumbnail_url: string;
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
        role: string;
        office: string;
        profile_picture?: string;
    };
    comments?: Comment[];
    images?: DocumentImage[];
    is_bookmarked?: boolean;
}

interface PageProps {
    auth?: {
        user: {
            id: number;
            name: string;
            email: string;
            profile_picture?: string;
            role?: string;
        };
    };
    documents?: {
        data: Document[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search?: string;
    perPage?: number;
    flash?: {
        success?: string;
        error?: string;
    };
    current_user?: {
        id: number;
        name: string;
        email: string;
    };
    [key: string]: unknown;
}

export default function Approved() {
    const { props } = usePage<PageProps>();
    const {
        auth,
        documents,
        search = '',
        perPage: perPageProp = 10,
        flash,
        current_user,
    } = props;

    const { showSuccess, showError, showDeleted, showBookmarked, showInfo } =
        usePopupAlert();

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(
        documents?.current_page || 1,
    );
    const [sortField] = useState<string>('updated_at');
    const [sortDirection] = useState<'asc' | 'desc'>('desc');
    const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>(
        {},
    );
    const [collapsedComments, setCollapsedComments] = useState<
        Record<number, boolean>
    >({});
    const [newComments, setNewComments] = useState<Record<number, string>>({});
    const [editingComments, setEditingComments] = useState<
        Record<number, boolean>
    >({});
    const [editCommentTexts, setEditCommentTexts] = useState<
        Record<number, string>
    >({});

    // Image modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImages, setModalImages] = useState<DocumentImage[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState(0);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

    const getProfilePictureUrl = (profilePicture?: string) => {
        if (!profilePicture) return null;
        if (
            profilePicture?.startsWith('http://') ||
            profilePicture?.startsWith('https://')
        )
            return profilePicture;
        if (profilePicture?.startsWith('/')) return profilePicture;
        if (profilePicture?.startsWith('storage/')) return `/${profilePicture}`;
        return `/storage/${profilePicture}`;
    };

    const handleImageError = (key: string) => {
        setBrokenImages((prev) => new Set(prev).add(key));
    };

    const handleOpenImageModal = (images: DocumentImage[], index: number) => {
        setModalImages(images);
        setModalInitialIndex(index);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalImages([]);
        setModalInitialIndex(0);
    };

    // Filter documents to show only approved documents
    const approvedDocs = useMemo(() => {
        if (!documents?.data) return [];
        return documents.data.filter(
            (document: Document) => document.status === 'approved',
        );
    }, [documents]);

    const sortedDocuments = useMemo(() => {
        if (!approvedDocs) return [];

        return [...approvedDocs].sort((a, b) => {
            let aValue = a[sortField as keyof Document];
            let bValue = b[sortField as keyof Document];

            if (sortField.includes('_at')) {
                aValue = aValue ? new Date(aValue as string).getTime() : 0;
                bValue = bValue ? new Date(bValue as string).getTime() : 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            return 0;
        });
    }, [approvedDocs, sortField, sortDirection]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/writing',
            {
                tab: 'approved',
                search: searchValue,
                perPage,
                page,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleEdit = (document: Document) => {
        router.get(`/editdocument/${document.id}`, { tab: 'approved' });
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            router.delete(`/documents/${id}`, {
                onSuccess: () => {
                    showDeleted(
                        'Document Deleted',
                        'Document has been successfully removed.',
                    );
                },
                onError: () => {
                    showError(
                        'Delete Failed',
                        'Unable to delete document. Please try again.',
                    );
                },
            });
        }
    };

    const handleLike = (documentId: number) => {
        router.post(
            `/documents/${documentId}/like`,
            {},
            {
                onSuccess: () => {
                    showInfo(
                        'Like Toggled',
                        'Document like status has been updated.',
                    );
                },
                onError: () => {
                    showError(
                        'Like Failed',
                        'Unable to toggle like. Please try again.',
                    );
                },
                preserveScroll: true,
            },
        );
    };

    const handleBookmark = (documentId: number) => {
        router.post(
            `/documents/${documentId}/bookmark`,
            {},
            {
                onSuccess: () => {
                    showBookmarked(
                        'Bookmark Toggled',
                        'Document bookmark status has been updated.',
                    );
                },
                onError: () => {
                    showError(
                        'Bookmark Failed',
                        'Unable to toggle bookmark. Please try again.',
                    );
                },
                preserveScroll: true,
            },
        );
    };

    const handleShare = async (documentId: number) => {
        const document = documents?.data.find((doc: Document) => doc.id === documentId);
        if (!document) return;

        const shareData = {
            title: document.title,
            text: document.content.substring(0, 200) + (document.content.length > 200 ? '...' : ''),
            url: `${window.location.origin}/PostedView/${document.id}`,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                fallbackShare(shareData);
            }
        } else {
            fallbackShare(shareData);
        }
    };

    const fallbackShare = async (shareData: { title: string; text: string; url: string }) => {
        try {
            await navigator.clipboard.writeText(shareData.url);
            showSuccess('Link Copied', 'Post link has been copied to clipboard!');
        } catch (error) {
            const link = shareData.url;
            const dummy = globalThis.document.createElement('textarea');
            globalThis.document.body.appendChild(dummy);
            dummy.value = link;
            dummy.select();
            globalThis.document.execCommand('copy');
            globalThis.document.body.removeChild(dummy);
            showSuccess('Link Copied', 'Post link has been copied to clipboard!');
        }
    };

    const handleApprove = (documentId: number) => {
        router.post(
            `/documents/${documentId}/approve`,
            {},
            {
                onSuccess: (page) => {
                    const updatedDocuments = page.props.documents as
                        | { data: Document[] }
                        | undefined;
                    const updatedDocument = updatedDocuments?.data?.find(
                        (doc: Document) => doc.id === documentId,
                    );

                    if (updatedDocument) {
                        if (
                            updatedDocument.approvals_count >= 6 &&
                            updatedDocument.status !== 'approved'
                        ) {
                            router.put(
                                `/documents/${documentId}/status`,
                                { status: 'approved' },
                                { preserveScroll: true },
                            );
                        } else if (
                            updatedDocument.approvals_count < 6 &&
                            updatedDocument.status === 'approved'
                        ) {
                            router.put(
                                `/documents/${documentId}/status`,
                                { status: 'for review' },
                                { preserveScroll: true },
                            );
                        }
                    }
                },
                onError: () => {
                    showError(
                        'Approval Failed',
                        'Unable to toggle approval. Please try again.',
                    );
                },
                preserveScroll: true,
            },
        );
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
                onSuccess: () => {
                    showSuccess(
                        'Comment Added',
                        'Your comment has been posted successfully.',
                    );
                    setNewComments((prev) => ({ ...prev, [documentId]: '' }));
                },
                onError: () => {
                    showError(
                        'Comment Failed',
                        'Unable to post comment. Please try again.',
                    );
                },
                preserveScroll: true,
            },
        );
    };

    const handleEditComment = (commentId: number, currentContent: string) => {
        setEditingComments((prev) => ({ ...prev, [commentId]: true }));
        setEditCommentTexts((prev) => ({ ...prev, [commentId]: currentContent }));
    };

    const handleUpdateComment = (commentId: number) => {
        const updatedContent = editCommentTexts[commentId];
        if (!updatedContent || !updatedContent.trim()) return;

        router.put(
            `/comments/${commentId}`,
            { content: updatedContent },
            {
                onSuccess: () => {
                    showSuccess(
                        'Comment Updated',
                        'Your comment has been updated successfully.',
                    );
                    setEditingComments((prev) => ({ ...prev, [commentId]: false }));
                    setEditCommentTexts((prev) => ({ ...prev, [commentId]: '' }));
                },
                onError: () => {
                    showError(
                        'Update Failed',
                        'Unable to update comment. Please try again.',
                    );
                },
                preserveScroll: true,
            },
        );
    };

    const handleDeleteComment = (commentId: number) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            router.delete(`/comments/${commentId}`, {
                onSuccess: () => {
                    showDeleted(
                        'Comment Deleted',
                        'Comment has been successfully removed.',
                    );
                },
                onError: () => {
                    showError(
                        'Delete Failed',
                        'Unable to delete comment. Please try again.',
                    );
                },
                preserveScroll: true,
            });
        }
    };

    const handleCancelEdit = (commentId: number) => {
        setEditingComments((prev) => ({ ...prev, [commentId]: false }));
        setEditCommentTexts((prev) => ({ ...prev, [commentId]: '' }));
    };

    const togglePostExpansion = (documentId: number) => {
        setExpandedPosts((prev) => ({
            ...prev,
            [documentId]: !prev[documentId],
        }));
    };

    const toggleComments = (documentId: number) => {
        setCollapsedComments((prev) => ({
            ...prev,
            [documentId]: !prev[documentId],
        }));

        // Also focus on comment input after expanding
        setTimeout(() => {
            const commentInput = globalThis.document.getElementById(
                `comment-${documentId}`,
            ) as HTMLTextAreaElement;
            if (commentInput && !collapsedComments[documentId]) {
                commentInput.focus();
            }
        }, 100);
    };

    const truncateContent = (content: string, maxLength: number = 300) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateForBlog = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

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

    return (
        <div className="space-y-6 px-4 py-6">
            {/* Flash Messages */}
            {flash?.success && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {flash.error}
                </div>
            )}

            {/* Header Controls */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <label
                                htmlFor="entries"
                                className="text-xs font-medium sm:text-sm"
                            >
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
                                            tab: 'approved',
                                            search: searchValue,
                                            perPage: newPerPage,
                                        },
                                        {
                                            preserveScroll: true,
                                            replace: true,
                                        },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-[60px] h-8 border-gray-300 text-xs dark:border-neutral-700 dark:bg-neutral-950 sm:w-[80px] sm:h-auto sm:text-sm">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-xs text-gray-600 sm:text-sm">entries</span>
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-2 sm:w-auto sm:max-w-md">
                        <SearchBar
                            search={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Search approved documents..."
                            className="w-full text-xs sm:text-sm sm:max-w-full"
                            searchRoute="/writing"
                            additionalParams={{ tab: 'approved', perPage }}
                        />
                    </div>
                </div>
            </div>

            {/* Blog Posts Container */}
            <div className="space-y-3 sm:space-y-4">
                {approvedDocs.length > 0 ? (
                    sortedDocuments.map((document: Document) => (
                        <div
                            key={document.id}
                            className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-900"
                        >
                            <div className="p-3 sm:p-4">
                                {/* Author Header */}
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#163832] dark:bg-[#235347]">
                                            {getProfilePictureUrl(document.author.profile_picture) && !brokenImages.has(`author-${document.id}`) ? (
                                                <img
                                                    src={getProfilePictureUrl(document.author.profile_picture)!}
                                                    alt={`${document.author.name}'s profile`}
                                                    className="h-full w-full object-cover"
                                                    onError={() => handleImageError(`author-${document.id}`)}
                                                />
                                            ) : (
                                                <User className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {document.author.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                                                {/* Office badge */}
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {document.author.office}
                                                </span>
                                                {/* Status badge */}
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(document.status)}`}>
                                                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                                                </span>
                                                {/* Category badge */}
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                                                    {document.category === 'posting' ? 'Posting' : 'Travel Report'}
                                                </span>
                                                {/* Date - mobile inline, desktop with bullet */}
                                                <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                                                    {formatDateForBlog(document.created_at)}
                                                </span>
                                                {/* Desktop date */}
                                                <span className="hidden sm:flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="mx-1">•</span>
                                                    {formatDateForBlog(document.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onClick={() => handleEdit(document)} className="cursor-pointer">
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                            {(current_user?.id === document.author.id || auth?.user?.role === 'admin' || auth?.user?.role === 'superadmin' || auth?.user?.role === 'ICS' || auth?.user?.role === document.author.office) && (
                                                <DropdownMenuItem onClick={() => handleDelete(document.id)} className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Title */}
                                <div className="mb-3">
                                    <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                                        {document.title}
                                    </h1>
                                </div>

                                {/* Content */}
                                <div className="mb-4">
                                    <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base">
                                        {expandedPosts[document.id] ? (
                                            document.content.split('\n\n').map((paragraph, index) => (
                                                <p key={index} className="mb-3">
                                                    {renderTextWithLinks(paragraph)}
                                                </p>
                                            ))
                                        ) : (
                                            <p>{renderTextWithLinks(truncateContent(document.content))}</p>
                                        )}
                                        {document.content.length > 300 && (
                                            <button
                                                onClick={() => togglePostExpansion(document.id)}
                                                className="ml-1 text-sm font-medium text-[#163832] hover:text-[#163832]/80 hover:underline dark:text-[#235347] dark:hover:text-[#235347]/80"
                                            >
                                                {expandedPosts[document.id] ? 'See less' : 'See more'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Images */}
                                {document.images && document.images.length > 0 && (
                                    <div className="mb-4">
                                        {(() => {
                                            const images = document.images;
                                            
                                            if (images.length === 1) {
                                                return (
                                                    <div className="rounded-lg overflow-hidden relative group">
                                                        <img
                                                            src={images[0].url}
                                                            alt={images[0].image_name}
                                                            className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                            onClick={() => handleOpenImageModal(images, 0)}
                                                        />
                                                    </div>
                                                );
                                            }
                                            if (images.length === 2) {
                                                return (
                                                    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                                                        {images.map((image, idx) => (
                                                            <div key={image.id} className="relative group">
                                                                <img
                                                                    src={image.url}
                                                                    alt={image.image_name}
                                                                    className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                    onClick={() => handleOpenImageModal(images, idx)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            if (images.length === 3) {
                                                return (
                                                    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                                                        <div className="relative group">
                                                            <img
                                                                src={images[0].url}
                                                                alt={images[0].image_name}
                                                                className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                onClick={() => handleOpenImageModal(images, 0)}
                                                            />
                                                        </div>
                                                        <div className="grid grid-rows-2 gap-1">
                                                            {images.slice(1).map((image, idx) => (
                                                                <div key={image.id} className="relative group">
                                                                    <img
                                                                        src={image.url}
                                                                        alt={image.image_name}
                                                                        className="w-full h-24 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                        onClick={() => handleOpenImageModal(images, idx + 1)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            if (images.length >= 4) {
                                                return (
                                                    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                                                        {images.slice(0, 3).map((image, idx) => (
                                                            <div key={image.id} className="relative group">
                                                                <img
                                                                    src={image.url}
                                                                    alt={image.image_name}
                                                                    className="w-full h-32 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                    onClick={() => handleOpenImageModal(images, idx)}
                                                                />
                                                            </div>
                                                        ))}
                                                        <div className="relative group">
                                                            <img
                                                                src={images[3].url}
                                                                alt={images[3].image_name}
                                                                className="w-full h-32 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                onClick={() => handleOpenImageModal(images, 3)}
                                                            />
                                                            {images.length > 4 && (
                                                                <div 
                                                                    className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-colors hover:bg-black/50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenImageModal(images, 3);
                                                                    }}
                                                                >
                                                                    <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-neutral-700">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            onClick={() => handleLike(document.id)}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${document.is_liked ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800'}`}
                                        >
                                            <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${document.is_liked ? 'fill-current text-red-600' : ''}`} />
                                            <span>{document.likes_count}</span>
                                        </button>
                                        <button
                                            onClick={() => toggleComments(document.id)}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                                        >
                                            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>{(document.comments || []).length}</span>
                                        </button>
                                        <button
                                            onClick={() => handleShare(document.id)}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                                        >
                                            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Share</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleApprove(document.id)}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${document.is_approved ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20' : 'text-gray-600 hover:bg-green-50 hover:text-green-600 dark:text-gray-400 dark:hover:bg-green-900/20 dark:hover:text-green-400'}`}
                                        >
                                            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Approve</span>
                                            {document.approvals_count > 0 && (
                                                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${document.is_approved ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                                    {document.approvals_count}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleBookmark(document.id)}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${document.is_bookmarked ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20' : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 dark:text-gray-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400'}`}
                                        >
                                            <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${document.is_bookmarked ? 'fill-current' : ''}`} />
                                            <span className="hidden sm:inline">Bookmark</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="border-t border-gray-200 dark:border-neutral-700">
                                <div className="flex items-center justify-between bg-gray-50 px-6 py-4 dark:bg-neutral-800">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Comments ({(document.comments || []).length})
                                    </h3>
                                    <button
                                        onClick={() => toggleComments(document.id)}
                                        className="flex items-center gap-2 text-gray-600 transition-colors hover:text-[#163832] dark:text-gray-400 dark:hover:text-white"
                                    >
                                        <span className="text-sm font-medium">
                                            {collapsedComments[document.id] ? 'Hide Comments' : 'Show Comments'}
                                        </span>
                                        {collapsedComments[document.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                </div>

                                {collapsedComments[document.id] && (
                                    <div className="space-y-6 bg-gray-50 p-6 duration-200 animate-in slide-in-from-top-2 dark:bg-neutral-800">
                                        {/* Add Comment */}
                                        <div>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#163832] dark:bg-[#235347]">
                                                    {getProfilePictureUrl(auth?.user.profile_picture) && !brokenImages.has('current-user') ? (
                                                        <img
                                                            src={getProfilePictureUrl(auth?.user.profile_picture)!}
                                                            alt={`${auth?.user.name}'s profile`}
                                                            className="h-full w-full object-cover"
                                                            onError={() => handleImageError('current-user')}
                                                        />
                                                    ) : (
                                                        <User className="h-4 w-4 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <textarea
                                                        id={`comment-${document.id}`}
                                                        value={newComments[document.id] || ''}
                                                        onChange={(e) => setNewComments((prev) => ({ ...prev, [document.id]: e.target.value }))}
                                                        placeholder="Write a comment..."
                                                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                                        rows={3}
                                                    />
                                                    <div className="mt-2 flex justify-end">
                                                        <Button
                                                            onClick={() => handleAddComment(document.id)}
                                                            disabled={!newComments[document.id]?.trim()}
                                                            className="bg-[#163832] px-4 py-1.5 text-sm text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                                        >
                                                            Post Comment
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-4 max-h-64 overflow-y-auto hide-scrollbar">
                                            {(document.comments || []).map((comment: Comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-300 dark:bg-neutral-600">
                                                        {getProfilePictureUrl(comment.author.profile_picture) && !brokenImages.has(`comment-${comment.id}`) ? (
                                                            <img
                                                                src={getProfilePictureUrl(comment.author.profile_picture)!}
                                                                alt={`${comment.author.name}'s profile`}
                                                                className="h-full w-full object-cover"
                                                                onError={() => handleImageError(`comment-${comment.id}`)}
                                                            />
                                                        ) : (
                                                            <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {comment.author.name}
                                                                </span>
                                                                {/* Comment author office badge */}
                                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                    {comment.author.office}
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {formatDate(comment.created_at)}
                                                                </span>
                                                            </div>
                                                            {current_user && current_user.id === comment.author.id && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-6 w-6 p-0">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                                                                            <Edit3 className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-600">
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
                                                                    onChange={(e) => setEditCommentTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                                                                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                                                    rows={3}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button onClick={() => handleUpdateComment(comment.id)} className="bg-[#163832] px-3 py-1 text-xs text-white">Save</Button>
                                                                    <Button onClick={() => handleCancelEdit(comment.id)} variant="outline" className="px-3 py-1 text-xs">Cancel</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center bg-white rounded-xl dark:bg-neutral-900 shadow-sm">
                        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                            No approved documents found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            No write-ups have been approved yet.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {approvedDocs.length > 0 && (
                <div className="mt-4">
                    <CustomPagination
                        currentPage={currentPage}
                        totalItems={documents?.total || 0}
                        perPage={perPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}

            {/* Image Modal */}
            {modalImages.length > 0 && (
                <ImageModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    images={modalImages}
                    initialIndex={modalInitialIndex}
                />
            )}
        </div>
    );
}
