import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    url?: string;
}

export default function ShareModal({ 
    isOpen, 
    onClose, 
    title = "Share Content", 
    url = window.location.href 
}: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareOptions = [
        {
            name: 'Copy Link',
            action: copyToClipboard,
            icon: '📋'
        },
        {
            name: 'Share via Email',
            action: () => {
                window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
            },
            icon: '📧'
        },
        {
            name: 'Share on Facebook',
            action: () => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
            },
            icon: '📘'
        },
        {
            name: 'Share on Twitter',
            action: () => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
            },
            icon: '🐦'
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share {title}
                    </DialogTitle>
                    <DialogDescription>
                        Choose how you want to share this content
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share link:</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={url}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyToClipboard}
                                className="flex-shrink-0"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {shareOptions.map((option) => (
                            <Button
                                key={option.name}
                                variant="outline"
                                onClick={option.action}
                                className="flex items-center justify-center gap-2 h-12"
                            >
                                <span>{option.icon}</span>
                                <span className="text-sm">{option.name}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
