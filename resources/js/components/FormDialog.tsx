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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import React, { ChangeEvent, ReactNode, useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';

export type FieldType =
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'datalist'
    | 'custom'
    | 'file';

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    step?: string;
    min?: string;
    options?: Array<{ value: string; label: string }>;
    datalistId?: string;
    datalistOptions?: string[];
    gridCols?: number;
    multiple?: boolean;
    accept?: string;
    maxFiles?: number;
    customRender?:
        | ((value: string, onChange?: (value: string) => void) => ReactNode)
        | ((value: string) => ReactNode);
}

export interface FormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: Record<string, string>;
    onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSelectChange?: (name: string, value: string) => void;
    onFileChange?: (name: string, files: FileList) => void;
    fields: FormField[];
    title: string;
    description: string;
    submitButtonText: string;
    isEdit?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    imagePreviewUrls?: string[];
    onClearImagePreviews?: () => void;
    onRemoveImage?: (index: number) => void;
    onToggleImageLike?: (index: number) => void;
    likedImages?: Set<number>;
}

export default function FormDialog({
    isOpen,
    onOpenChange,
    onSubmit,
    formData,
    onInputChange,
    onSelectChange,
    onFileChange,
    fields,
    title,
    description,
    submitButtonText,
    isEdit = false,
    isLoading = false,
    loadingText = 'Loading...',
    imagePreviewUrls = [],
    onClearImagePreviews,
    onRemoveImage,
    onToggleImageLike,
    likedImages = new Set(),
}: FormDialogProps) {
    const renderField = (field: FormField) => {
        const fieldId = `${isEdit ? 'edit_' : ''}${field.name}`;

        switch (field.type) {
            case 'select':
                return (
                    <div
                        key={field.name}
                        className={`grid gap-2 ${field.gridCols ? `col-span-${field.gridCols}` : ''}`}
                    >
                        <Label htmlFor={fieldId}>{field.label}</Label>
                        <Select
                            value={formData[field.name]}
                            onValueChange={(value) =>
                                onSelectChange?.(field.name, value)
                            }
                            required={field.required}
                        >
                            <SelectTrigger className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                                <SelectValue
                                    placeholder={
                                        field.placeholder ||
                                        `Select ${field.label.toLowerCase()}`
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                                {field.options?.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.customRender &&
                            field.customRender(
                                formData[field.name],
                                (value: string) => {
                                    if (onInputChange) {
                                        // Create a synthetic event to match the expected type
                                        const event = {
                                            target: { name: field.name, value },
                                        } as React.ChangeEvent<HTMLInputElement>;
                                        onInputChange(event);
                                    }
                                },
                            )}
                    </div>
                );

            case 'datalist':
                return (
                    <div
                        key={field.name}
                        className={`grid gap-2 ${field.gridCols ? `col-span-${field.gridCols}` : ''}`}
                    >
                        <Label htmlFor={fieldId}>{field.label}</Label>
                        <Input
                            id={fieldId}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={onInputChange}
                            required={field.required}
                            placeholder={field.placeholder}
                            list={
                                field.datalistId ||
                                `${field.name}-list${isEdit ? '-edit' : ''}`
                            }
                        />
                        <datalist
                            id={
                                field.datalistId ||
                                `${field.name}-list${isEdit ? '-edit' : ''}`
                            }
                        >
                            {field.datalistOptions?.map((option) => (
                                <option key={option} value={option} />
                            ))}
                        </datalist>
                    </div>
                );

            case 'custom':
                return (
                    <div
                        key={field.name}
                        className={`grid gap-2 ${field.gridCols ? `col-span-${field.gridCols}` : ''}`}
                    >
                        {field.customRender &&
                            field.customRender(
                                formData[field.name],
                                (value: string) => {
                                    if (onSelectChange) {
                                        onSelectChange(field.name, value);
                                    }
                                },
                            )}
                    </div>
                );

            case 'file':
                return (
                    <div
                        key={field.name}
                        className={`grid gap-2 ${field.gridCols ? `col-span-${field.gridCols}` : ''}`}
                    >
                        <Label htmlFor={fieldId}>{field.label}</Label>
                        <Input
                            id={fieldId}
                            name={field.name}
                            type="file"
                            multiple={field.multiple}
                            accept={field.accept}
                            onChange={(e) => {
                                if (e.target.files && onFileChange) {
                                    onFileChange(field.name, e.target.files);
                                }
                            }}
                            required={field.required}
                            className="cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-[#163832] file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-[#163832]/90 dark:file:bg-[#235347] dark:hover:file:bg-[#235347]/90"
                        />
                        {field.maxFiles && (
                            <p className="text-xs text-gray-500">
                                Maximum {field.maxFiles} files. Selected files will be added to existing selection.
                            </p>
                        )}
                        {/* Image Preview */}
                        {imagePreviewUrls.length > 0 && field.name === 'images' && (
                            <div className="rounded-lg border border-gray-200 p-3 dark:border-neutral-700">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Image Preview ({imagePreviewUrls.length} file{imagePreviewUrls.length !== 1 ? 's' : ''}):
                                    </p>
                                    <button
                                        onClick={onClearImagePreviews}
                                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        type="button"
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
                                            {/* Like Button */}
                                            <button
                                                onClick={() => onToggleImageLike?.(index)}
                                                className="absolute top-2 left-2 bg-white/90 dark:bg-neutral-800/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                                title="Like image"
                                            >
                                                <Heart 
                                                    className={`h-4 w-4 transition-colors ${
                                                        likedImages.has(index) 
                                                            ? 'fill-red-500 text-red-500' 
                                                            : 'text-gray-600 dark:text-gray-400'
                                                    }`} 
                                                />
                                            </button>
                                            {/* Delete Button */}
                                            <button
                                                onClick={() => onRemoveImage?.(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove image"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            {/* Like Status Badge */}
                                            {likedImages.has(index) && (
                                                <div className="absolute bottom-2 left-2 bg-red-500 text-white rounded-full p-1">
                                                    <Heart className="h-3 w-3 fill-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div
                        key={field.name}
                        className={`grid gap-2 ${field.gridCols ? `col-span-${field.gridCols}` : ''}`}
                    >
                        <Label htmlFor={fieldId}>{field.label}</Label>
                        <Input
                            id={fieldId}
                            name={field.name}
                            type={field.type}
                            value={formData[field.name]}
                            onChange={onInputChange}
                            required={field.required}
                            placeholder={field.placeholder}
                            step={field.step}
                            min={field.min}
                        />
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        {fields.map((field) => renderField(field))}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            type="submit"
                            className="bg-[#163832] text-white hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                            loading={isLoading}
                            loadingText={loadingText}
                        >
                            {submitButtonText}
                        </LoadingButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
