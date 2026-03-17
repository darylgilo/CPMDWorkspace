import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface ImageModalProps {
    images: DocumentImage[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageModal({ images, initialIndex, isOpen, onClose }: ImageModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleArrowKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('keydown', handleArrowKeys);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleArrowKeys);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const currentImage = images[currentIndex];

    if (!isOpen || !currentImage) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 px-3 py-2 text-white transition-all hover:bg-opacity-70"
                title="Close (Esc)"
            >
                <X className="h-5 w-5" />
            </button>

            {/* Previous button */}
            {images.length > 1 && (
                <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-black bg-opacity-50 px-3 py-2 text-white transition-all hover:bg-opacity-70"
                    title="Previous image (←)"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}

            {/* Next button */}
            {images.length > 1 && (
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-black bg-opacity-50 px-3 py-2 text-white transition-all hover:bg-opacity-70"
                    title="Next image (→)"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}

            {/* Main image container */}
            <div className="max-h-[90vh] max-w-[90vw]">
                <img
                    src={currentImage.url}
                    alt={currentImage.image_name}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                />
            </div>

            {/* Image info */}
            <div className="absolute bottom-4 left-4 right-4 text-center text-white">
                <p className="text-sm font-medium">{currentImage.image_name}</p>
                {images.length > 1 && (
                    <p className="mt-1 text-xs text-white text-opacity-75">
                        {currentIndex + 1} of {images.length}
                    </p>
                )}
            </div>

            {/* Thumbnail strip for multiple images */}
            {images.length > 1 && (
                <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-2 rounded-lg bg-black bg-opacity-50 p-2">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-12 w-12 overflow-hidden rounded border-2 transition-all ${
                                index === currentIndex
                                    ? 'border-white'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            <img
                                src={image.thumbnail_url || image.url}
                                alt={image.image_name}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
