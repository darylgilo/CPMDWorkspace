import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { usePopupAlert } from '@/components/ui/popup-alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, History, Image as ImageIcon, Save, Trash2, User } from 'lucide-react';
import React, { ChangeEvent, useEffect, useState } from 'react';

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
    images?: DocumentImage[];
}

interface PageProps {
    document?: Document;
    tab?: string;
    [key: string]: unknown;
}

export default function EditDocument() {
    const { props } = usePage<PageProps>();
    const document = props.document;
    const sourceTab = props.tab || 'writeup';

    // Initialize popup alert hook
    const { showSuccess, showError } = usePopupAlert();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'posting',
        status: 'draft' as
            | 'draft'
            | 'for review'
            | 'approved'
            | 'rejected'
            | 'posted',
    });

    // Image handling state
    const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<DocumentImage[]>([]);

    useEffect(() => {
        if (document) {
            setFormData({
                title: document.title,
                content: document.content,
                category: document.category,
                status: document.status,
            });
            setExistingImages(document.images || []);
        }
    }, [document]);

    // Image handling functions
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
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
                
                const allNewFiles = [...existingFiles, ...uniqueNewFiles];
                
                // Check total image limit (existing + new)
                const totalImages = existingImages.length + allNewFiles.length;
                
                if (totalImages > 15) {
                    showError(
                        'Too Many Images',
                        `You can only have a total of 15 images. You already have ${existingImages.length} image${existingImages.length > 1 ? 's' : ''}.`,
                    );
                    return;
                }
                
                // Create a new FileList object
                const dt = new DataTransfer();
                allNewFiles.forEach(file => dt.items.add(file));
                setSelectedImages(dt.files);
                
                // Create preview URLs for all files
                const urls: string[] = [];
                for (let i = 0; i < dt.files.length; i++) {
                    urls.push(URL.createObjectURL(dt.files[i]));
                }
                setImagePreviewUrls(urls);
                
                return;
            }
            
            const allNewFiles = [...existingFiles, ...newFiles];
            
            // Check total image limit (existing + new)
            const totalImages = existingImages.length + allNewFiles.length;
            
            if (totalImages > 15) {
                showError(
                    'Too Many Images',
                    `You can only have a total of 15 images. You already have ${existingImages.length} image${existingImages.length > 1 ? 's' : ''}.`,
                );
                // Clear the file input
                e.target.value = '';
                return;
            }
            
            // Create a new FileList object
            const dt = new DataTransfer();
            allNewFiles.forEach(file => dt.items.add(file));
            setSelectedImages(dt.files);
            
            // Create preview URLs for all files
            const urls: string[] = [];
            for (let i = 0; i < dt.files.length; i++) {
                urls.push(URL.createObjectURL(dt.files[i]));
            }
            setImagePreviewUrls(urls);
        }
    };

    const clearImagePreviews = () => {
        setSelectedImages(null);
        setImagePreviewUrls([]);
        // Clear the file input
        const fileInput = window.document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleRemoveNewImage = (index: number) => {
        const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
        const newFiles = Array.from(selectedImages || []).filter((_, i) => i !== index);
        
        setImagePreviewUrls(newUrls);
        
        if (newFiles.length > 0) {
            const dt = new DataTransfer();
            newFiles.forEach(file => dt.items.add(file));
            setSelectedImages(dt.files);
        } else {
            setSelectedImages(null);
        }
    };

    const handleDeleteExistingImage = (imageId: number) => {
        if (!document) return;
        
        if (window.confirm('Are you sure you want to delete this image?')) {
            router.delete(`/documents/${document.id}/images/${imageId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(
                        'Image Deleted',
                        'Image has been successfully removed.',
                    );
                    // Page props will automatically update, triggering the useEffect above
                },
                onError: () => {
                    showError(
                        'Delete Failed',
                        'Unable to delete image. Please try again.',
                    );
                },
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (document) {
            // Create FormData for file upload
            const data = new FormData();
            data.append('title', formData.title);
            data.append('content', formData.content);
            data.append('category', formData.category);
            data.append('status', formData.status);
            data.append('tab', sourceTab);
            
            // Add new images if selected
            if (selectedImages) {
                console.log('Adding images:', selectedImages.length);
                for (let i = 0; i < selectedImages.length; i++) {
                    data.append('images[]', selectedImages[i]);
                }
            }
            
            // Debug FormData contents
            console.log('FormData entries:');
            for (const [key, value] of data.entries()) {
                console.log(key, value);
            }
            
            // Add method spoofing for Laravel to handle file uploads in a PUT request
            data.append('_method', 'put');
            
            router.post(`/documents/${document.id}`, data, {
                onSuccess: () => {
                    showSuccess(
                        'Document Updated',
                        'Document has been successfully updated.',
                    );
                },
                onError: () => {
                    showError(
                        'Update Failed',
                        'Unable to update document. Please try again.',
                    );
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    const handleCancel = () => {
        router.get('/writing', { tab: sourceTab });
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Writing Management', href: '/writing' },
        { title: 'Edit Document', href: `/editdocument/${document?.id}` },
    ];

    if (!document) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Document" />
                <div className="space-y-6 px-4 py-6">
                    <div className="py-12 text-center">
                        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                            Document Not Found
                        </h1>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            The document you're trying to edit doesn't exist.
                        </p>
                        <Button
                            onClick={handleCancel}
                            className="bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Document" />
            <div className="space-y-6 px-4 py-6">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Edit Form - Left Side (2/3 width) */}
                    <div className="lg:col-span-2">
                        {/* Form */}
                        <div className="w-full max-w-none">
                            <form
                                onSubmit={handleSubmit}
                                className="w-full space-y-6"
                            >
                                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Title
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        title: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                placeholder="Enter document title"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        category: e.target
                                                            .value as
                                                            | 'posting'
                                                            | 'travel_report',
                                                    })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                required
                                            >
                                                <option value="posting">
                                                    Posting
                                                </option>
                                                <option value="travel_report">
                                                    Travel Report
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Status
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        status: e.target
                                                            .value as
                                                            | 'draft'
                                                            | 'for review'
                                                            | 'approved'
                                                            | 'rejected'
                                                            | 'posted',
                                                    })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                required
                                            >
                                                <option value="draft">
                                                    Draft
                                                </option>
                                                <option value="for review">
                                                    For Review
                                                </option>
                                                <option value="approved">
                                                    Approved
                                                </option>
                                                <option value="rejected">
                                                    Rejected
                                                </option>
                                                <option value="posted">
                                                    Posted
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Content
                                            </label>
                                            <textarea
                                                value={formData.content}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        content: e.target.value,
                                                    })
                                                }
                                                rows={12}
                                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#163832] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                placeholder="Enter document content"
                                                required
                                            />
                                        </div>

                                        {/* Image Upload Section */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <ImageIcon className="mr-2 inline h-4 w-4" />
                                                Images
                                            </label>
                                            
                                            {/* Existing Images */}
                                            {existingImages.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                                        Current Images ({existingImages.length}):
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                                                        {existingImages.map((image) => (
                                                            <div key={image.id} className="relative group">
                                                                <img
                                                                    src={image.url}
                                                                    alt={image.image_name}
                                                                    className="h-24 w-full rounded-lg object-cover border border-gray-200 dark:border-neutral-700"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteExistingImage(image.id)}
                                                                    className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                                    title="Delete image"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                                <p className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400">
                                                                    {image.image_name}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* New Image Upload */}
                                            <div className="space-y-3">
                                                <div>
                                                    <input
                                                        id="image-upload"
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        disabled={existingImages.length >= 15}
                                                        className={`w-full rounded-md border border-gray-300 px-4 py-2 file:mr-3 file:rounded-full file:border-0 file:bg-[#163832] file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-[#163832]/90 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:file:bg-[#235347] dark:hover:file:bg-[#235347]/90 ${
                                                            existingImages.length >= 15 
                                                                ? 'opacity-50 cursor-not-allowed' 
                                                                : ''
                                                        }`}
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {(() => {
                                                            const totalImages = existingImages.length + imagePreviewUrls.length;
                                                            const remaining = 15 - totalImages;
                                                            if (remaining <= 0) {
                                                                return 'Maximum image limit reached (15 images total)';
                                                            }
                                                            return `You can add ${remaining} more image${remaining > 1 ? 's' : ''} (30MB per image). Selected files will be added to existing selection.`;
                                                        })()}
                                                    </p>
                                                </div>
                                                
                                                {/* Image Preview */}
                                                {imagePreviewUrls.length > 0 && (
                                                    <div className="rounded-lg border border-gray-200 p-3 dark:border-neutral-700">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                New Images Preview ({imagePreviewUrls.length} file{imagePreviewUrls.length !== 1 ? 's' : ''}):
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={clearImagePreviews}
                                                                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                Clear All
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                                                            {imagePreviewUrls.map((url, index) => (
                                                                <div key={index} className="relative group">
                                                                    <img
                                                                        src={url}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="h-24 w-full rounded-lg object-cover border border-gray-200 dark:border-neutral-700"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveNewImage(index)}
                                                                        className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                                        title="Remove this image"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                    <LoadingButton
                                        type="submit"
                                        loading={isSubmitting}
                                        loadingText="Updating..."
                                        className="bg-[#163832] text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Document
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* History Sidebar - Right Side (1/3 width) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <History className="h-5 w-5 text-[#163832] dark:text-[#235347]" />
                                Document History
                            </h3>
                            <div className="max-h-[600px] space-y-3 overflow-y-auto">
                                {document.histories.map((history) => {
                                    const getActionDescription = (
                                        action: string,
                                        userName: string,
                                    ) => {
                                        switch (action) {
                                            case 'created':
                                                return `${userName} created this document`;
                                            case 'updated':
                                                return `${userName} updated this document`;
                                            case 'approved':
                                                return `${userName} approved this document`;
                                            case 'liked':
                                                return `${userName} liked your writeup`;
                                            case 'unliked':
                                                return `${userName} removed their like`;
                                            default:
                                                return `${userName} performed ${action} action`;
                                        }
                                    };

                                    return (
                                        <div
                                            key={history.id}
                                            className="border-b border-gray-200 pb-3 last:border-b-0 dark:border-neutral-700"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-medium ${
                                                            history.action ===
                                                            'created'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : history.action ===
                                                                    'updated'
                                                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                  : history.action ===
                                                                      'approved'
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                    : history.action ===
                                                                        'liked'
                                                                      ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                                                                      : history.action ===
                                                                          'unliked'
                                                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        }`}
                                                    >
                                                        {history.action
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            history.action.slice(
                                                                1,
                                                            )}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                                    {formatDate(
                                                        history.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                                                {getActionDescription(
                                                    history.action,
                                                    history.user.name,
                                                )}
                                            </div>
                                            {history.action === 'updated' && (
                                                <div className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Changes may include title,
                                                    content, category, or status
                                                    updates
                                                </div>
                                            )}
                                            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <User className="h-3 w-3" />
                                                <span>{history.user.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {document.histories.length === 0 && (
                                    <p className="py-4 text-center text-gray-500 dark:text-gray-500">
                                        No history available for this document.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
