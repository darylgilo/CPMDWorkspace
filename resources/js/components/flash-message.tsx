import { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface FlashMessageProps {
    type?: 'success' | 'error' | 'warning' | 'info';
    message?: string;
    autoClose?: boolean;
    duration?: number;
}

export default function FlashMessage({ 
    type = 'success', 
    message, 
    autoClose = true, 
    duration = 10000 
}: FlashMessageProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [displayMessage, setDisplayMessage] = useState('');
    const timeoutRef = useRef<number | null>(null);
    const pageProps = usePage().props as any;
    
    // Get flash message from page props if no message is provided
    const flashMessage = message || pageProps.flash?.[type];
    
    // Clear any existing timeout
    const clearTimer = () => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };
    
    // Show message when it exists
    useEffect(() => {
        if (flashMessage && flashMessage !== displayMessage) {
            console.log(`Flash message (${type}):`, flashMessage);
            setDisplayMessage(flashMessage);
            setIsVisible(true);
            
            // Clear any existing timeout
            clearTimer();
            
            if (autoClose) {
                timeoutRef.current = window.setTimeout(() => {
                    setIsVisible(false);
                    setDisplayMessage('');
                }, duration);
            }
        } else if (!flashMessage) {
            setIsVisible(false);
            setDisplayMessage('');
            clearTimer();
        }
        
        // Cleanup on unmount
        return () => {
            clearTimer();
        };
    }, [flashMessage, type, autoClose, duration]);
    
    // Handle manual close
    const handleClose = () => {
        clearTimer();
        setIsVisible(false);
        setDisplayMessage('');
    };
    
    if (!flashMessage || !isVisible || !displayMessage) {
        return null;
    }
    
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5" />;
            case 'error':
                return <AlertCircle className="h-5 w-5" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5" />;
            case 'info':
                return <Info className="h-5 w-5" />;
            default:
                return <CheckCircle className="h-5 w-5" />;
        }
    };
    
    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
            case 'error':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
            case 'info':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
            default:
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
        }
    };
    
    return (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full animate-in slide-in-from-top-2 duration-300`}>
            <div className={`rounded-lg border p-4 shadow-lg ${getStyles()}`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                            {displayMessage}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleClose}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-current hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
