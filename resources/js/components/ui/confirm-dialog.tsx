import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    isLoading?: boolean;
    loadingText?: string;
    variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isLoading = false,
    loadingText = 'Processing...',
    variant = 'default',
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-72 p-3">
                <DialogHeader className="pb-1">
                    <DialogTitle className="text-base">{title}</DialogTitle>
                </DialogHeader>
                <div className="py-1">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                        {message}
                    </p>
                </div>
                <DialogFooter className="flex justify-end gap-2 pt-1">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        size="sm"
                        className="h-7 px-3 text-xs"
                    >
                        {cancelText}
                    </Button>
                    <LoadingButton
                        variant={variant}
                        onClick={handleConfirm}
                        loading={isLoading}
                        loadingText={loadingText}
                        size="sm"
                        className="h-7 px-3 text-xs"
                    >
                        {confirmText}
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
