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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import React, { ChangeEvent, ReactNode } from 'react';

export type FieldType =
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'datalist'
    | 'custom';

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
    fields: FormField[];
    title: string;
    description: string;
    submitButtonText: string;
    isEdit?: boolean;
}

export default function FormDialog({
    isOpen,
    onOpenChange,
    onSubmit,
    formData,
    onInputChange,
    onSelectChange,
    fields,
    title,
    description,
    submitButtonText,
    isEdit = false,
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
                        <Button
                            type="submit"
                            className="bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                        >
                            {submitButtonText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
