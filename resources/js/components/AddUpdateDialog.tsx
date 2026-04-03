import React, { useState } from 'react';
import { Calendar, Lock, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';

interface AddUpdateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (description: string, updateDate: string, progress?: number) => void;
    isLoading?: boolean;
    initialDescription?: string;
    initialDate?: string;
    initialProgress?: number;
    currentTaskProgress?: number;
    isEdit?: boolean;
    isMostRecentUpdate?: boolean;
}

export default function AddUpdateDialog({ 
    isOpen, 
    onClose, 
    onSubmit, 
    isLoading = false, 
    initialDescription = '', 
    initialDate = new Date().toISOString().split('T')[0],
    initialProgress = 0,
    currentTaskProgress = 0,
    isEdit = false,
    isMostRecentUpdate = true
}: AddUpdateDialogProps) {
    const [description, setDescription] = useState(initialDescription);
    const [updateDate, setUpdateDate] = useState(initialDate);
    const [progress, setProgress] = useState(initialProgress);

    // Update state when initial values change
    React.useEffect(() => {
        setDescription(initialDescription);
        setUpdateDate(initialDate);
        setProgress(initialProgress);
    }, [initialDescription, initialDate, initialProgress]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            // Only pass progress if it's the most recent update or if it's a new update
            const progressToSubmit = isMostRecentUpdate ? progress : undefined;
            onSubmit(description.trim(), updateDate, progressToSubmit);
            if (!isEdit) {
                setDescription('');
                setUpdateDate(new Date().toISOString().split('T')[0]);
                setProgress(0);
            }
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            if (!isEdit) {
                setDescription('');
                setUpdateDate(new Date().toISOString().split('T')[0]);
                setProgress(0);
            }
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-lg sm:text-xl">
                        {isEdit ? 'Edit Task Update' : 'Add Task Update'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {isEdit ? 'Update the task update details.' : 'Add a new update to track progress and changes.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4 px-1">
                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-sm font-medium">Update Description</Label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the progress or changes made..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163832] focus:border-transparent dark:bg-neutral-800 dark:text-gray-100 resize-none"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* Progress - Show history for all, slider only for most recent */}
                        <div className="grid gap-2">
                            <Label htmlFor="progress" className="text-sm font-medium flex items-center gap-1">
                                {isEdit ? 'Update Task Progress' : 'Set Task Progress'}: {isMostRecentUpdate ? progress : currentTaskProgress}%
                            </Label>
                            
                            {/* Progress History */}
                            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <span className="text-gray-600 dark:text-gray-400">Previous:</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            {initialProgress}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <span className="text-gray-600 dark:text-gray-400">New:</span>
                                        <span className={`font-semibold ${
                                            isMostRecentUpdate ? 'text-[#163832] dark:text-[#4ade80]' : 'text-gray-400'
                                        }`}>
                                            {isMostRecentUpdate ? progress : currentTaskProgress}%
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Progress Change Indicator - Only for most recent update */}
                                {isMostRecentUpdate && progress !== initialProgress && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-600">
                                        <div className="flex items-center gap-2 text-xs">
                                            {progress > initialProgress ? (
                                                <>
                                                    <span className="text-green-600 dark:text-green-400">↑</span>
                                                    <span className="text-green-600 dark:text-green-400">
                                                        +{progress - initialProgress}%
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-red-600 dark:text-red-400">↓</span>
                                                    <span className="text-red-600 dark:text-red-400">
                                                        -{initialProgress - progress}%
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* No Change Indicator - Only for most recent update */}
                                {isMostRecentUpdate && progress === initialProgress && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-600">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>No change in progress</span>
                                        </div>
                                    </div>
                                )}

                                {/* Locked Progress Message - Only for older updates */}
                                {!isMostRecentUpdate && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-600">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Lock className="h-3 w-3" />
                                            <span>Progress locked</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Progress Slider - Only for most recent update */}
                            {isMostRecentUpdate && (
                                <div className="space-y-2 mt-3">
                                    <div className="relative">
                                        <input
                                            id="progress"
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={progress}
                                            onChange={(e) => setProgress(parseInt(e.target.value))}
                                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#163832] dark:accent-[#4ade80]"
                                            style={{
                                                background: `linear-gradient(to right, #163832 0%, #163832 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                                            }}
                                            disabled={isLoading}
                                        />
                                        {/* Current progress indicator */}
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#163832] dark:bg-[#4ade80] rounded-full border-2 border-white dark:border-neutral-900 pointer-events-none"
                                            style={{ left: `calc(${progress}% - 8px)` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>0%</span>
                                        <span>25%</span>
                                        <span>50%</span>
                                        <span>75%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Update Date */}
                        <div className="grid gap-2">
                            <Label htmlFor="updateDate" className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Update Date
                            </Label>
                            <Input
                                id="updateDate"
                                type="date"
                                value={updateDate}
                                onChange={(e) => setUpdateDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                disabled={isLoading}
                                required
                                className="text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            type="submit"
                            className="bg-[#163832] text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 w-full sm:w-auto"
                            loading={isLoading}
                            loadingText={isEdit ? 'Updating...' : 'Adding...'}
                            disabled={!description.trim()}
                        >
                            {isEdit ? 'Update' : 'Add Update'}
                        </LoadingButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
