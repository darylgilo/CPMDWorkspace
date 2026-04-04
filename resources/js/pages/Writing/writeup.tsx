import CustomPagination from '@/components/CustomPagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import FormDialog, { type FormField } from '@/components/FormDialog';
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
    ChevronDown,
    ChevronUp,
    Edit3,
    FileText,
    Heart,
    MessageCircle,
    MoreHorizontal,
    MoreVertical,
    Plus,
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
        role: string;
        office: string;
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
    images?: DocumentImage[];
    is_bookmarked?: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    auth?: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
            profile_picture?: string;
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
        auth,
        documents,
        search = '',
        perPage: perPageProp = 10,
        flash,
        current_user,
    } = props;

    // Initialize popup alert hook
    const { showSuccess, showError, showDeleted, showBookmarked, showInfo } =
        usePopupAlert();

    const [searchValue, setSearchValue] = useState(search);
    const [perPage, setPerPage] = useState(perPageProp);
    const [currentPage, setCurrentPage] = useState(
        documents?.current_page || 1,
    );
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sortField] = useState<string>('updated_at');
    const [sortDirection] = useState<'asc' | 'desc'>('desc');
    const [comments] = useState<Record<number, Comment[]>>({});
    const [newComments, setNewComments] = useState<Record<number, string>>({});
    const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>(
        {},
    );
    const [collapsedComments, setCollapsedComments] = useState<
        Record<number, boolean>
    >({});
    const [editingComments, setEditingComments] = useState<
        Record<number, boolean>
    >({});
    const [editCommentTexts, setEditCommentTexts] = useState<
        Record<number, string>
    >({});

    // Image handling state
    const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [likedImages, setLikedImages] = useState<Set<number>>(new Set());

    // Image modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImages, setModalImages] = useState<DocumentImage[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState(0);

    // Profile picture helper functions
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<'document' | 'comment' | null>(null);

    const getProfilePictureUrl = (profilePicture?: string) => {
        if (!profilePicture) return null;
        if (
            profilePicture?.startsWith('http://') ||
            profilePicture?.startsWith('https://')
        )
            return profilePicture;
        if (profilePicture?.startsWith('/')) return profilePicture; // already absolute path
        if (profilePicture?.startsWith('storage/')) return `/${profilePicture}`; // already in storage folder
        return `/storage/${profilePicture}`;
    };

    const handleImageError = (key: string) => {
        setBrokenImages((prev) => new Set(prev).add(key));
    };

    // Image handling functions
    const handleImageChange = (name: string, files: FileList) => {
        // Create a new FileList that combines existing and new files
        const existingFiles = Array.from(selectedImages || []);
        const newFiles = Array.from(files);
        
        // Check for duplicates based on file name and size
        const duplicateFiles = newFiles.filter(newFile => 
            existingFiles.some(existingFile => 
                existingFile.name === newFile.name && existingFile.size === newFile.size
            )
        );
        
        if (duplicateFiles.length > 0) {
            showError(
                'Duplicate Files',
                `${duplicateFiles.length} file(s) already selected. Duplicates will be skipped.`
            );
            // Filter out duplicates
            const uniqueNewFiles = newFiles.filter(newFile => 
                !existingFiles.some(existingFile => 
                    existingFile.name === newFile.name && existingFile.size === newFile.size
                )
            );
            
            if (uniqueNewFiles.length === 0) {
                return; // No new unique files to add
            }
            
            const allFiles = [...existingFiles, ...uniqueNewFiles];
            
            // Create a new FileList object
            const dt = new DataTransfer();
            allFiles.forEach(file => dt.items.add(file));
            setSelectedImages(dt.files);
            
            // Create preview URLs for all files
            const urls: string[] = [];
            for (let i = 0; i < dt.files.length; i++) {
                urls.push(URL.createObjectURL(dt.files[i]));
            }
            setImagePreviewUrls(urls);
            
            return;
        }
        
        const allFiles = [...existingFiles, ...newFiles];
        
        // Check max files limit
        if (allFiles.length > 15) {
            showError(
                'Too Many Files',
                `Maximum 15 files allowed. You have ${allFiles.length} files selected.`
            );
            return;
        }
        
        // Create a new FileList object
        const dt = new DataTransfer();
        allFiles.forEach(file => dt.items.add(file));
        setSelectedImages(dt.files);
        
        // Create preview URLs for all files
        const urls: string[] = [];
        for (let i = 0; i < dt.files.length; i++) {
            urls.push(URL.createObjectURL(dt.files[i]));
        }
        setImagePreviewUrls(urls);
    };

    const clearImagePreviews = () => {
        setSelectedImages(null);
        setImagePreviewUrls([]);
        setLikedImages(new Set());
    };

    const handleRemoveImage = (index: number) => {
        const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
        const newFiles = Array.from(selectedImages || []).filter((_, i) => i !== index);
        
        setImagePreviewUrls(newUrls);
        
        // Update liked images set
        const newLikedImages = new Set<number>();
        likedImages.forEach((likedIndex) => {
            if (likedIndex < index) {
                newLikedImages.add(likedIndex);
            } else if (likedIndex > index) {
                newLikedImages.add(likedIndex - 1);
            }
        });
        setLikedImages(newLikedImages);
        
        if (newFiles.length > 0) {
            const dt = new DataTransfer();
            newFiles.forEach(file => dt.items.add(file));
            setSelectedImages(dt.files);
        } else {
            setSelectedImages(null);
        }
    };

    const handleToggleImageLike = (index: number) => {
        const newLikedImages = new Set(likedImages);
        if (newLikedImages.has(index)) {
            newLikedImages.delete(index);
        } else {
            newLikedImages.add(index);
        }
        setLikedImages(newLikedImages);
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
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    placeholder="Enter document content"
                />
            ),
        },
        {
            name: 'images',
            label: 'Images',
            type: 'file',
            multiple: true,
            accept: 'image/*',
            maxFiles: 15,
            required: false,
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
        clearImagePreviews();
    };

    const handleAdd = () => {
        resetForm();
        setIsAddDialogOpen(true);
    };

    const handleEdit = (document: Document) => {
        router.get(`/editdocument/${document.id}`, { tab: 'writeup' });
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setDeleteType('document');
        setShowDeleteConfirm(true);
    };

    const handleSubmitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Create FormData for file upload
        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        data.append('category', formData.category);
        data.append('status', formData.status);
        
        // Add images if selected
        if (selectedImages) {
            console.log('Selected images count:', selectedImages.length);
            console.log('Selected images:', selectedImages);
            for (let i = 0; i < selectedImages.length; i++) {
                console.log(`Appending image ${i}:`, selectedImages[i].name);
                data.append('images[]', selectedImages[i]);
            }
            
            // Debug FormData contents
            console.log('FormData entries:');
            for (const [key, value] of data.entries()) {
                console.log(key, value);
            }
        }
        
        router.post('/documents', data, {
            onSuccess: () => {
                showSuccess(
                    'Document Added',
                    'New document has been successfully created.',
                );
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
                    { preserveState: false },
                );
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
                showError(
                    'Add Failed',
                    'Unable to create document. Please try again.',
                );
            },
            onFinish: () => setIsSubmitting(false),
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

    // Sort the data client-side
    const sortedDocuments = useMemo(() => {
        if (!documents?.data) return [];

        // Only show documents that are in review
        const inReviewDocuments = documents.data.filter(
            (doc) => doc.status === 'for review',
        );

        return [...inReviewDocuments].sort((a, b) => {
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
                    // Clear the comment input
                    setNewComments((prev) => ({ ...prev, [documentId]: '' }));
                    // The page props will be automatically updated by Inertia
                    // No need for manual state updates or page reload
                },
                onError: () => {
                    showError(
                        'Comment Failed',
                        'Unable to post comment. Please try again.',
                    );
                    console.error('Error adding comment');
                },
                preserveScroll: true,
            },
        );
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
                    // The page props will be automatically updated by Inertia
                    // No need for manual state updates or page reload
                },
                onError: () => {
                    showError(
                        'Like Failed',
                        'Unable to toggle like. Please try again.',
                    );
                    console.error('Error toggling like');
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
                    console.log('Bookmark toggled successfully');
                },
                onError: () => {
                    showError(
                        'Bookmark Failed',
                        'Unable to toggle bookmark. Please try again.',
                    );
                    console.error('Error toggling bookmark');
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

        // Check if Web Share API is available
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Error sharing:', error);
                // Fallback to copying link
                fallbackShare(shareData);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            fallbackShare(shareData);
        }
    };

    const fallbackShare = async (shareData: { title: string; text: string; url: string }) => {
        try {
            // Copy link to clipboard
            await navigator.clipboard.writeText(shareData.url);
            showSuccess(
                'Link Copied',
                'Post link has been copied to clipboard!'
            );
        } catch (error) {
            console.log('Error copying link:', error);
            // Final fallback: show the link in an alert
            const link = shareData.url;
            const dummy = document.createElement('textarea');
            document.body.appendChild(dummy);
            dummy.value = link;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            showSuccess(
                'Link Copied',
                'Post link has been copied to clipboard!'
            );
        }
    };

    const handleApprove = (documentId: number) => {
        router.post(
            `/documents/${documentId}/approve`,
            {},
            {
                onSuccess: (page) => {
                    // Check if the document now has 6 or more approvals and update status
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
                            // Automatically update status to approved
                            router.put(
                                `/documents/${documentId}/status`,
                                { status: 'approved' },
                                {
                                    onSuccess: () => {
                                        // Status updated successfully
                                    },
                                    onError: () => {
                                        console.error('Error updating document status to approved');
                                    },
                                    preserveScroll: true,
                                },
                            );
                        } else if (
                            updatedDocument.approvals_count < 6 &&
                            updatedDocument.status === 'approved'
                        ) {
                            // Automatically revert status to for review
                            router.put(
                                `/documents/${documentId}/status`,
                                { status: 'for review' },
                                {
                                    onSuccess: () => {
                                        // Status reverted successfully
                                    },
                                    onError: () => {
                                        console.error('Error reverting document status to for review');
                                    },
                                    preserveScroll: true,
                                },
                            );
                        }
                    }
                },
                onError: () => {
                    showError(
                        'Approval Failed',
                        'Unable to toggle approval. Please try again.',
                    );
                    console.error('Error toggling approval');
                },
                preserveScroll: true,
            },
        );
    };

    const handleEditComment = (commentId: number, currentContent: string) => {
        setEditingComments((prev) => ({
            ...prev,
            [commentId]: true,
        }));
        setEditCommentTexts((prev) => ({
            ...prev,
            [commentId]: currentContent,
        }));
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
                    // Clear editing state
                    setEditingComments((prev) => ({
                        ...prev,
                        [commentId]: false,
                    }));
                    setEditCommentTexts((prev) => ({
                        ...prev,
                        [commentId]: '',
                    }));
                },
                onError: () => {
                    showError(
                        'Update Failed',
                        'Unable to update comment. Please try again.',
                    );
                    console.error('Error updating comment');
                },
                preserveScroll: true,
            },
        );
    };

    const handleDeleteComment = (commentId: number) => {
        setDeleteId(commentId);
        setDeleteType('comment');
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!deleteId || !deleteType) return;
        
        setShowDeleteConfirm(false);
        
        if (deleteType === 'document') {
            router.delete(`/documents/${deleteId}`, {
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
        } else if (deleteType === 'comment') {
            router.delete(`/comments/${deleteId}`, {
                onSuccess: () => {
                    showDeleted(
                        'Comment Deleted',
                        'Comment has been successfully removed.',
                    );
                },
                onError: (errors: Record<string, string>) => {
                    showError(
                        'Delete Failed',
                        'Unable to delete comment. Please try again.',
                    );
                    console.error('Error deleting comment:', errors);
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

    const truncateContent = (content: string, maxLength: number = 300) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const toggleComments = (documentId: number) => {
        setCollapsedComments((prev) => ({
            ...prev,
            [documentId]: !prev[documentId],
        }));
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
                        <Button
                            onClick={handleAdd}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 sm:px-4"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Writeup</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                        <div className="flex items-center gap-1 sm:gap-2">
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
                                        },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-full h-9 border-gray-300 text-xs bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100 sm:w-auto sm:h-auto sm:text-sm">
                                    <SelectValue placeholder="Entries" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                    <SelectItem value="10">10 entries</SelectItem>
                                    <SelectItem value="25">25 entries</SelectItem>
                                    <SelectItem value="50">50 entries</SelectItem>
                                    <SelectItem value="100">100 entries</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-2 sm:w-auto sm:max-w-md">
                        <SearchBar
                            search={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Search..."
                            className="w-full text-xs sm:text-sm sm:max-w-full"
                            searchRoute="/writing"
                            additionalParams={{ tab: 'writeup', perPage }}
                        />
                    </div>
                </div>
            </div>

            {/* Blog Posts Container */}
            <div className="space-y-3 sm:space-y-4">
                {documents?.data && documents.data.length > 0 ? (
                    sortedDocuments.map((document: Document) => (
                        <div
                            key={document.id}
                            className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-900"
                        >
                            {/* Facebook-style Card */}
                            <div className="p-3 sm:p-4">
                                {/* Author Header - Facebook Style */}
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#163832] dark:bg-[#235347]">
                                            {getProfilePictureUrl(
                                                document.author
                                                    .profile_picture,
                                            ) &&
                                            !brokenImages.has(
                                                `author-${document.id}`,
                                            ) ? (
                                                <img
                                                    src={
                                                        getProfilePictureUrl(
                                                            document.author
                                                                .profile_picture,
                                                        )!
                                                    }
                                                    alt={`${document.author.name}'s profile`}
                                                    className="h-full w-full object-cover"
                                                    onError={() =>
                                                        handleImageError(
                                                            `author-${document.id}`,
                                                        )
                                                    }
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
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(document.status)}`}
                                                >
                                                    {document.status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        document.status.slice(1)}
                                                </span>
                                                {/* Category badge */}
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                                                    {document.category === 'posting'
                                                        ? 'Posting'
                                                        : 'Travel Report'}
                                                </span>
                                                {/* Date - mobile inline, desktop hidden */}
                                                <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                                                    {formatDateForBlog(
                                                        document.created_at,
                                                    )}
                                                </span>
                                                {/* Desktop date */}
                                                <span className="hidden sm:flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="mx-1">•</span>
                                                    {formatDateForBlog(
                                                        document.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-40"
                                        >
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleEdit(document)
                                                }
                                                className="cursor-pointer"
                                            >
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                            {(current_user?.id === document.author.id || auth?.user?.role === 'admin' || auth?.user?.role === 'superadmin' || auth?.user?.role === 'ICS' || auth?.user?.role === document.author.office) && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDelete(
                                                            document.id,
                                                        )
                                                    }
                                                    className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Title - Facebook Style */}
                                <div className="mb-3">
                                    <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                                        {document.title}
                                    </h1>
                                </div>

                                {/* Content - Facebook Style */}
                                <div className="mb-4">
                                    <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base">
                                        {expandedPosts[document.id] ? (
                                            document.content
                                                .split('\n\n')
                                                .map((paragraph, index) => (
                                                    <p
                                                        key={index}
                                                        className="mb-3"
                                                    >
                                                        {renderTextWithLinks(
                                                            paragraph,
                                                        )}
                                                    </p>
                                                ))
                                        ) : (
                                            <p>
                                                {renderTextWithLinks(
                                                    truncateContent(
                                                        document.content,
                                                    ),
                                                )}
                                            </p>
                                        )}
                                        {document.content.length > 300 && (
                                            <button
                                                onClick={() =>
                                                    togglePostExpansion(
                                                        document.id,
                                                    )
                                                }
                                                className="ml-1 text-sm font-medium text-[#163832] hover:text-[#163832]/80 hover:underline dark:text-[#235347] dark:hover:text-[#235347]/80"
                                            >
                                                {expandedPosts[document.id]
                                                    ? 'See less'
                                                    : 'See more'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Images Section - Facebook Style */}
                                {document.images && document.images.length > 0 && (
                                    <div className="mb-4">
                                        {(() => {
                                            const images = document.images;
                                            const isOwner = current_user?.id === document.author.id;
                                            
                                            if (images.length === 1) {
                                                return (
                                                    <div className="rounded-lg overflow-hidden relative group">
                                                        <img
                                                            src={images[0].url}
                                                            alt={images[0].image_name}
                                                            className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                            onClick={() => {
                                                                // Open image in modal
                                                                handleOpenImageModal(images, 0);
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            }
                                            if (images.length === 2) {
                                                return (
                                                    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                                                        {images.map((image) => (
                                                            <div key={image.id} className="relative group">
                                                                <img
                                                                    src={image.url}
                                                                    alt={image.image_name}
                                                                    className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                    onClick={() => {
                                                                        const imageIndex = images.findIndex(img => img.id === image.id);
                                                                        handleOpenImageModal(images, imageIndex);
                                                                    }}
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
                                                                onClick={() => {
                                                                    handleOpenImageModal(images, 0);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="grid grid-rows-2 gap-1">
                                                            {images.slice(1).map((image) => (
                                                                <div key={image.id} className="relative group">
                                                                    <img
                                                                        src={image.url}
                                                                        alt={image.image_name}
                                                                        className="w-full h-24 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                        onClick={() => {
                                                                            const imageIndex = images.findIndex(img => img.id === image.id);
                                                                            handleOpenImageModal(images, imageIndex);
                                                                        }}
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
                                                        {images.slice(0, 3).map((image) => (
                                                            <div key={image.id} className="relative group">
                                                                <img
                                                                    src={image.url}
                                                                    alt={image.image_name}
                                                                    className="w-full h-32 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                    onClick={() => {
                                                                        const imageIndex = images.findIndex(img => img.id === image.id);
                                                                        handleOpenImageModal(images, imageIndex);
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                        <div className="relative group">
                                                            <img
                                                                src={images[3].url}
                                                                alt={images[3].image_name}
                                                                className="w-full h-32 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                onClick={() => {
                                                                    handleOpenImageModal(images, 3);
                                                                }}
                                                            />
                                                            {images.length > 4 && (
                                                                <div 
                                                                    className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-colors hover:bg-black/50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenImageModal(images, 3);
                                                                    }}
                                                                >
                                                                    <span className="text-white text-2xl font-bold">
                                                                        +{images.length - 4}
                                                                    </span>
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

                                {/* Facebook-style Actions */}
                                <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-neutral-700">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            onClick={() =>
                                                handleLike(document.id)
                                            }
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                                                document.is_liked
                                                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800'
                                            }`}
                                        >
                                            <Heart
                                                className={`h-4 w-4 sm:h-5 sm:w-5 ${document.is_liked ? 'fill-current text-red-600' : ''}`}
                                            />
                                            <span>{document.likes_count}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                toggleComments(document.id);
                                                // Also focus on comment input after expanding
                                                setTimeout(() => {
                                                    const commentInput =
                                                        globalThis.document.getElementById(
                                                            `comment-${document.id}`,
                                                        ) as HTMLTextAreaElement;
                                                    if (commentInput && !collapsedComments[document.id]) {
                                                        commentInput.focus();
                                                    }
                                                }, 100);
                                            }}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                                        >
                                            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>
                                                {
                                                    (
                                                        comments[document.id] ||
                                                        document.comments ||
                                                        []
                                                    ).length
                                                }
                                            </span>
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleShare(document.id)
                                            }
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                                        >
                                            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Share</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                handleApprove(document.id)
                                            }
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                                                document.is_approved
                                                    ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                                                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600 dark:text-gray-400 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                                            }`}
                                        >
                                            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Approve</span>
                                            {document.approvals_count > 0 && (
                                                <span
                                                    className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                                        document.is_approved
                                                            ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    }`}
                                                >
                                                    {document.approvals_count}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleBookmark(document.id)
                                            }
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                                                document.is_bookmarked
                                                    ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                                                    : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 dark:text-gray-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400'
                                            }`}
                                        >
                                            <Bookmark
                                                className={`h-4 w-4 sm:h-5 sm:w-5 ${document.is_bookmarked ? 'fill-current' : ''}`}
                                            />
                                            <span className="hidden sm:inline">Bookmark</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="border-t border-gray-200 dark:border-neutral-700">
                                {/* Comments Header with Toggle */}
                                <div className="flex items-center justify-between bg-gray-50 px-6 py-4 dark:bg-neutral-800">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Comments (
                                        {
                                            (
                                                comments[document.id] ||
                                                document.comments ||
                                                []
                                            ).length
                                        }
                                        )
                                    </h3>
                                    <button
                                        onClick={() =>
                                            toggleComments(document.id)
                                        }
                                        className="flex items-center gap-2 text-gray-600 transition-colors hover:text-[#163832] dark:text-gray-400 dark:hover:text-white"
                                    >
                                        <span className="text-sm font-medium">
                                            {collapsedComments[document.id]
                                                ? 'Hide Comments'
                                                : 'Show Comments'}
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
                                    <div className="space-y-6 bg-gray-50 p-6 duration-200 animate-in slide-in-from-top-2 dark:bg-neutral-800">
                                        {/* Add Comment */}
                                        <div>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#163832] dark:bg-[#235347]">
                                                    {getProfilePictureUrl(
                                                        auth?.user
                                                            .profile_picture,
                                                    ) &&
                                                    !brokenImages.has(
                                                        'current-user',
                                                    ) ? (
                                                        <img
                                                            src={
                                                                getProfilePictureUrl(
                                                                    auth?.user
                                                                        .profile_picture,
                                                                )!
                                                            }
                                                            alt={`${auth?.user.name}'s profile`}
                                                            className="h-full w-full object-cover"
                                                            onError={() =>
                                                                handleImageError(
                                                                    'current-user',
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <User className="h-4 w-4 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <textarea
                                                        id={`comment-${document.id}`}
                                                        value={
                                                            newComments[
                                                                document.id
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            setNewComments(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [document.id]:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Write a comment..."
                                                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                                        rows={3}
                                                    />
                                                    <div className="mt-2 flex justify-end">
                                                        <Button
                                                            onClick={() =>
                                                                handleAddComment(
                                                                    document.id,
                                                                )
                                                            }
                                                            disabled={
                                                                !newComments[
                                                                    document.id
                                                                ]?.trim()
                                                            }
                                                            className="bg-[#163832] px-4 py-1.5 text-sm text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                                        >
                                                            Post Comment
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-4">
                                            <div className="max-h-64 sm:max-h-64 overflow-y-auto hide-scrollbar">
                                                {(
                                                    comments[document.id] ||
                                                    document.comments ||
                                                    []
                                                ).map((comment: Comment) => (
                                                    <div
                                                        key={comment.id}
                                                        className="flex gap-3"
                                                    >
                                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-300 dark:bg-neutral-600">
                                                            {getProfilePictureUrl(
                                                                comment.author
                                                                    .profile_picture,
                                                            ) &&
                                                            !brokenImages.has(
                                                                `comment-${comment.id}`,
                                                            ) ? (
                                                                <img
                                                                    src={
                                                                        getProfilePictureUrl(
                                                                            comment
                                                                                .author
                                                                                .profile_picture,
                                                                        )!
                                                                    }
                                                                    alt={`${comment.author.name}'s profile`}
                                                                    className="h-full w-full object-cover"
                                                                    onError={() =>
                                                                        handleImageError(
                                                                            `comment-${comment.id}`,
                                                                        )
                                                                    }
                                                                />
                                                            ) : (
                                                                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="mb-1 flex items-center justify-between">
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {
                                                                            comment
                                                                                .author
                                                                                .name
                                                                        }
                                                                    </span>
                                                                    {/* Comment author office badge */}
                                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                        {comment.author.office}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {formatDate(
                                                                            comment.created_at,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {current_user && current_user.id === comment.author.id && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                className="h-6 w-6 p-0"
                                                                            >
                                                                                <span className="sr-only">
                                                                                    Open
                                                                                    menu
                                                                                </span>
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleEditComment(
                                                                                        comment.id,
                                                                                        comment.content,
                                                                                    )
                                                                                }
                                                                                className="text-gray-700 dark:text-gray-300"
                                                                            >
                                                                                <Edit3 className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleDeleteComment(
                                                                                        comment.id,
                                                                                    )
                                                                                }
                                                                                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                )}
                                                            </div>
                                                            {editingComments[
                                                                comment.id
                                                            ] ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        value={
                                                                            editCommentTexts[
                                                                                comment
                                                                                    .id
                                                                            ] || ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setEditCommentTexts(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [comment.id]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                                                        rows={3}
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            onClick={() =>
                                                                                handleUpdateComment(
                                                                                    comment.id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !editCommentTexts[
                                                                                    comment
                                                                                        .id
                                                                                ]?.trim()
                                                                            }
                                                                            className="bg-[#163832] px-3 py-1 text-xs text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() =>
                                                                                handleCancelEdit(
                                                                                    comment.id,
                                                                                )
                                                                            }
                                                                            variant="outline"
                                                                            className="border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {renderTextWithLinks(
                                                                        comment.content,
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!comments[document.id] ||
                                                    comments[document.id].length ===
                                                        0) &&
                                                    (!document.comments ||
                                                        document.comments.length ===
                                                            0) && (
                                                        <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                                                            No comments yet. Be the
                                                            first to comment!
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center">
                        <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
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
                <div className="mt-4 sm:mt-8">
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
                onFileChange={handleImageChange}
                imagePreviewUrls={imagePreviewUrls}
                onClearImagePreviews={clearImagePreviews}
                onRemoveImage={handleRemoveImage}
                onToggleImageLike={handleToggleImageLike}
                likedImages={likedImages}
                fields={documentFormFields}
                title="Add New Document"
                description="Fill in the details to add a new document."
                submitButtonText="Add Document"
                isLoading={isSubmitting}
                loadingText="Adding..."
            />

            {/* Image Modal */}
            <ImageModal
                images={modalImages}
                initialIndex={modalInitialIndex}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title={deleteType === 'document' ? 'Delete Document' : 'Delete Comment'}
                message={deleteType === 'document' 
                    ? 'Are you sure you want to delete this document? This action cannot be undone.'
                    : 'Are you sure you want to delete this comment? This action cannot be undone.'
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    );
}
