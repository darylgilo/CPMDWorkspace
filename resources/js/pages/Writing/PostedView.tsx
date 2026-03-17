import ImageModal from '@/components/ImageModal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { renderTextWithLinks } from '@/lib/text-utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, FileText, User, Code, Copy, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';

// Embed Modal Component
const EmbedModal = ({ isOpen, onClose, documentId, title }: { isOpen: boolean; onClose: () => void; documentId: number; title: string }) => {
    const [copied, setCopied] = useState(false);
    
    if (!isOpen) return null;

    const fullUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/share/document/${documentId}` : '';
    const embedCode = `<iframe src="${fullUrl}?embed=true" width="100%" height="800" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;"></iframe>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Embed this Document</h3>
                    <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    Copy the code below to embed <strong>"{title}"</strong> onto your website.
                </p>

                <div className="relative mb-6">
                    <textarea
                        readOnly
                        value={embedCode}
                        className="w-full h-32 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-mono text-gray-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-gray-300 focus:outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-bold shadow-sm border border-gray-200 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                        {copied ? (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-green-500 font-bold">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5 text-gray-500" />
                                <span>Copy Code</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="flex justify-end">
                    <Button onClick={onClose} className="bg-[#163832] text-white hover:bg-[#112d28]">
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};

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
        profile_picture?: string;
    };
    images?: DocumentImage[];
}

interface PageProps {
    document: Document;
    auth?: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Writing Management', href: '/writing' },
    { title: 'Posted', href: '/writing?tab=posted' },
    { title: 'View Document', href: '#' },
];

export default function PostedView() {
    const { props } = usePage<PageProps>();
    const { document } = props;

    // Content expansion state
    const [isExpanded, setIsExpanded] = useState(false);

    // Image modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImages, setModalImages] = useState<DocumentImage[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState(0);

    // Embed modal state
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

    // Detect if we are in embed mode
    const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === 'true';

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateForBlog = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
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

    if (isEmbed) {
        return (
            <div className="min-h-screen bg-white dark:bg-neutral-950 p-0">
                <Head title={document.title} />
                <div className="mx-auto max-w-4xl px-0 py-0">
                    {/* Document Article */}
                    <article className="overflow-hidden border-0 bg-white dark:bg-neutral-950">
                        {/* Article Header */}
                        <div className="border-b border-gray-200 p-5 sm:p-7 pb-4 sm:pb-5 dark:border-neutral-800">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#163832] text-white">
                                        {getProfilePictureUrl(document.author.profile_picture) ? (
                                            <img
                                                src={getProfilePictureUrl(document.author.profile_picture)!}
                                                alt={`${document.author.name}'s profile`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {document.author.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {formatDateForBlog(document.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
                                {document.title}
                            </h1>
                        </div>

                        {/* Article Content */}
                        <div className="p-5 sm:p-7 pt-4 sm:pt-5">
                            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none mb-4">
                                <div className="leading-relaxed text-gray-800 dark:text-gray-200 space-y-4">
                                    {(() => {
                                        const paragraphs = document.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                                        
                                        // Case 1: Multiple paragraphs
                                        if (paragraphs.length > 1) {
                                            if (isExpanded) {
                                                return paragraphs.map((p, idx) => (
                                                    <p key={idx} className="text-lg">
                                                        {renderTextWithLinks(p)}
                                                    </p>
                                                ));
                                            } else {
                                                return (
                                                    <p className="text-lg">
                                                        {renderTextWithLinks(paragraphs[0])}
                                                    </p>
                                                );
                                            }
                                        }

                                        // Case 2: Single long paragraph (over 500 chars)
                                        if (paragraphs.length === 1 && paragraphs[0].length > 500) {
                                            if (isExpanded) {
                                                return (
                                                    <p className="text-lg">
                                                        {renderTextWithLinks(paragraphs[0])}
                                                    </p>
                                                );
                                            } else {
                                                return (
                                                    <p className="text-lg">
                                                        {renderTextWithLinks(paragraphs[0].substring(0, 500) + '...')}
                                                    </p>
                                                );
                                            }
                                        }

                                        // Case 3: Short content
                                        return paragraphs.map((p, idx) => (
                                            <p key={idx} className="text-lg">
                                                {renderTextWithLinks(p)}
                                            </p>
                                        ));
                                    })()
                                    }
                                </div>
                            </div>

                            {(() => {
                                const paragraphs = document.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                                if (paragraphs.length > 1 || (paragraphs.length === 1 && paragraphs[0].length > 500)) {
                                    return (
                                        <button
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="mb-8 text-sm font-bold text-[#163832] hover:underline dark:text-[#235347]"
                                        >
                                            {isExpanded ? 'Read less' : 'Read more'}
                                        </button>
                                    );
                                }
                                return null;
                            })()}

                            {/* Images Grid */}
                            {document.images && document.images.length > 0 && (
                                <div className="mb-10">
                                    {(() => {
                                        const images = document.images;
                                        
                                        if (images.length === 1) {
                                            return (
                                                <div className="rounded-xl overflow-hidden shadow-md">
                                                    <img
                                                        src={images[0].url}
                                                        alt={images[0].image_name}
                                                        className="w-full h-auto max-h-[600px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => handleOpenImageModal(images, 0)}
                                                    />
                                                </div>
                                            );
                                        }
                                        
                                        return (
                                            <div className="grid grid-cols-2 gap-2 sm:gap-4 rounded-xl overflow-hidden">
                                                {images.slice(0, 4).map((image, idx) => (
                                                    <div key={image.id} className="relative aspect-video group">
                                                        <img
                                                            src={image.url}
                                                            alt={image.image_name}
                                                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                            onClick={() => handleOpenImageModal(images, idx)}
                                                        />
                                                        {idx === 3 && images.length > 4 && (
                                                            <div 
                                                                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-colors hover:bg-black/50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenImageModal(images, 3);
                                                                }}
                                                            >
                                                                <span className="text-white text-3xl font-bold">+{images.length - 4}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Article Footer */}
                        <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <div className="flex items-center justify-end text-sm text-gray-500 dark:text-gray-400">
                                <div>
                                    Last updated: {formatDate(document.updated_at)}
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
                
                {/* Image Modal for Embed mode */}
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={document.title} />
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.get('/writing?tab=posted')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Posted
                        </Button>
                    </div>

                    {/* Document Article */}
                    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        {/* Article Header */}
                        <div className="border-b border-gray-200 p-5 sm:p-7 pb-4 sm:pb-5 dark:border-neutral-800">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#163832] text-white">
                                        {getProfilePictureUrl(document.author.profile_picture) ? (
                                            <img
                                                src={getProfilePictureUrl(document.author.profile_picture)!}
                                                alt={`${document.author.name}'s profile`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {document.author.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {formatDateForBlog(document.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Embed Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEmbedModalOpen(true)}
                                    className="flex h-8 items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-800"
                                >
                                    <Code className="h-4 w-4" />
                                    <span className="hidden sm:inline">Embed</span>
                                </Button>
                            </div>
                            
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
                                {document.title}
                            </h1>
                        </div>

                        {/* Article Content */}
                        <div className="p-5 sm:p-7 pt-4 sm:pt-5">
                            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none mb-4">
                                <div className="leading-relaxed text-gray-800 dark:text-gray-200 space-y-4">
                                    {(() => {
                                        const paragraphs = document.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                                        
                                        // Case 1: Multiple paragraphs
                                        if (paragraphs.length > 1) {
                                            if (isExpanded) {
                                                return paragraphs.map((p, idx) => (
                                                    <p key={idx} className="text-lg">
                                                        {renderTextWithLinks(p)}
                                                    </p>
                                                ));
                                            } else {
                                                return (
                                                    <p className="text-lg">
                                                        {renderTextWithLinks(paragraphs[0])}
                                                    </p>
                                                );
                                            }
                                        }

                                        // Case 2: Single long paragraph (over 500 chars)
                                        if (paragraphs.length === 1 && paragraphs[0].length > 500) {
                                            if (isExpanded) {
                                                return (
                                                    <p className="text-lg">
                                                        {renderTextWithLinks(paragraphs[0])}
                                                    </p>
                                                );
                                            } else {
                                                return (
                                                    <p className="text-lg">
                                                        {renderTextWithLinks(paragraphs[0].substring(0, 500) + '...')}
                                                    </p>
                                                );
                                            }
                                        }

                                        // Case 3: Short content
                                        return paragraphs.map((p, idx) => (
                                            <p key={idx} className="text-lg">
                                                {renderTextWithLinks(p)}
                                            </p>
                                        ));
                                    })()
                                    }
                                </div>
                            </div>

                            {(() => {
                                const paragraphs = document.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                                if (paragraphs.length > 1 || (paragraphs.length === 1 && paragraphs[0].length > 500)) {
                                    return (
                                        <button
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="mb-8 text-sm font-bold text-[#163832] hover:underline dark:text-[#235347]"
                                        >
                                            {isExpanded ? 'Read less' : 'Read more'}
                                        </button>
                                    );
                                }
                                return null;
                            })()}

                            {/* Images Grid */}
                            {document.images && document.images.length > 0 && (
                                <div className="mb-10">
                                    {(() => {
                                        const images = document.images;
                                        
                                        if (images.length === 1) {
                                            return (
                                                <div className="rounded-xl overflow-hidden shadow-md">
                                                    <img
                                                        src={images[0].url}
                                                        alt={images[0].image_name}
                                                        className="w-full h-auto max-h-[600px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => handleOpenImageModal(images, 0)}
                                                    />
                                                </div>
                                            );
                                        }
                                        
                                        return (
                                            <div className="grid grid-cols-2 gap-2 sm:gap-4 rounded-xl overflow-hidden">
                                                {images.slice(0, 4).map((image, idx) => (
                                                    <div key={image.id} className="relative aspect-video group">
                                                        <img
                                                            src={image.url}
                                                            alt={image.image_name}
                                                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                            onClick={() => handleOpenImageModal(images, idx)}
                                                        />
                                                        {idx === 3 && images.length > 4 && (
                                                            <div 
                                                                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-colors hover:bg-black/50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenImageModal(images, 3);
                                                                }}
                                                            >
                                                                <span className="text-white text-3xl font-bold">+{images.length - 4}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Article Footer */}
                        <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <div className="flex items-center justify-end text-sm text-gray-500 dark:text-gray-400">
                                <div>
                                    Last updated: {formatDate(document.updated_at)}
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>

            {/* Image Modal */}
            {modalImages.length > 0 && (
                <ImageModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    images={modalImages}
                    initialIndex={modalInitialIndex}
                />
            )}

            <EmbedModal
                isOpen={isEmbedModalOpen}
                onClose={() => setIsEmbedModalOpen(false)}
                documentId={document.id}
                title={document.title}
            />
        </AppLayout>
    );
}
