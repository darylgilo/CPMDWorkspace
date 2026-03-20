import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React from 'react';
import { 
    ChevronLeft, 
    Plus, 
    Trash2, 
    Type, 
    AlignLeft, 
    ChevronDown, 
    Paperclip, 
    GripVertical,
    Save,
    Eye,
    HardDrive,
    Upload,
    ClipboardList,
    Users,
    Settings,
    Package,
    AlertTriangle,
    FileText
} from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Form Management', href: '/form-management' },
    { title: 'Form Builder', href: '/form-builder' },
];

type FieldType = 'text' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio' | 'email' | 'number' | 'date';

interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select, radio, checkbox
    validation?: {
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        min?: number;
        max?: number;
    };
    conditional?: {
        field: string;
        value: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty';
    };
}

interface FormBuilderProps {
    editId?: string | number;
    form?: any; // Add form prop
}

// Icon options for forms
const iconOptions = [
    { name: 'HardDrive', icon: HardDrive, label: 'IT/Technical', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { name: 'ClipboardList', icon: ClipboardList, label: 'Equipment/Request', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/20' },
    { name: 'Users', icon: Users, label: 'User/Account', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/20' },
    { name: 'Settings', icon: Settings, label: 'Settings/Config', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/20' },
    { name: 'Package', icon: Package, label: 'Package/Inventory', color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
    { name: 'AlertTriangle', icon: AlertTriangle, label: 'Urgent/Emergency', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' },
    { name: 'FileText', icon: FileText, label: 'General/Default', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20' },
];

export default function FormBuilder({ editId, form }: FormBuilderProps) {
    const [title, setTitle] = useState(form?.title || '');
    const [description, setDescription] = useState(form?.description || '');
    const [selectedIcon, setSelectedIcon] = useState(form?.icon || 'FileText');
    const [isLoading, setIsLoading] = useState(false);

    const [fields, setFields] = useState<FormField[]>(() => {
        // Load form data from props if available (for editing)
        if (form && form.fields) {
            return form.fields;
        }
        
        // Default fields for new forms
        return [{ id: '1', type: 'text', label: 'Subject', placeholder: 'Brief summary', required: true }];
    });
    const [isPreview, setIsPreview] = useState(false);
    const [draggedField, setDraggedField] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [showAdvanced, setShowAdvanced] = useState<{ [key: string]: boolean }>({});
    const dragCounter = useRef(0);

    const addField = (type: FieldType) => {
        const newField: FormField = {
            id: Date.now().toString(),
            type,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            placeholder: type === 'email' ? 'user@example.com' : type === 'number' ? '0' : type === 'date' ? '' : '',
            required: false,
            options: (type === 'select' || type === 'radio' || type === 'checkbox') ? ['Option 1', 'Option 2'] : undefined
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const duplicateField = (id: string) => {
        const field = fields.find(f => f.id === id);
        if (field) {
            const newField = {
                ...field,
                id: Date.now().toString(),
                label: `${field.label} (Copy)`
            };
            setFields([...fields, newField]);
        }
    };

    const moveField = (dragIndex: number, hoverIndex: number) => {
        const draggedField = fields[dragIndex];
        const newFields = [...fields];
        newFields.splice(dragIndex, 1);
        newFields.splice(hoverIndex, 0, draggedField);
        setFields(newFields);
    };

    const handleDragStart = (e: React.DragEvent, fieldId: string, index: number) => {
        setDraggedField(fieldId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverIndex(null);
        }
    };

    const handleDragEnter = () => {
        dragCounter.current++;
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        dragCounter.current = 0;
        setDragOverIndex(null);
        
        if (draggedField) {
            const draggedIndex = fields.findIndex(f => f.id === draggedField);
            if (draggedIndex !== dropIndex) {
                moveField(draggedIndex, dropIndex);
            }
        }
        setDraggedField(null);
    };

    const handleDragEnd = () => {
        setDraggedField(null);
        setDragOverIndex(null);
        dragCounter.current = 0;
    };

    const addValidation = (id: string, validationType: keyof NonNullable<FormField['validation']>, value: string | number) => {
        const field = fields.find(f => f.id === id);
        if (field) {
            const validation = field.validation || {};
            validation[validationType] = value as any;
            updateField(id, { validation });
        }
    };

    const removeValidation = (id: string, validationType: keyof NonNullable<FormField['validation']>) => {
        const field = fields.find(f => f.id === id);
        if (field && field.validation) {
            const validation = { ...field.validation };
            delete validation[validationType];
            updateField(id, { validation: Object.keys(validation).length > 0 ? validation : undefined });
        }
    };

    const handleSave = async () => {
        // Validate form before saving
        const hasRequiredFields = fields.length > 0;
        const hasValidLabels = fields.every(field => field.label.trim().length > 0);
        
        if (!hasRequiredFields) {
            alert('Please add at least one field to your form.');
            return;
        }
        
        if (!hasValidLabels) {
            alert('All fields must have a label.');
            return;
        }
        
        if (!title.trim()) {
            alert('Please add a title for your form.');
            return;
        }
        
        setIsLoading(true);
        
        try {
            const formData = {
                title,
                description,
                icon: selectedIcon,
                fields: fields, // Keep field IDs - they're needed for form submissions
            };

            // Debug logging
            console.log('=== FORM SAVE DEBUG ===');
            console.log('Edit ID:', editId);
            console.log('Form Data:', formData);
            console.log('Fields:', formData.fields);
            console.log('Field IDs:', formData.fields.map(f => ({ id: f.id, label: f.label })));

            const url = editId ? `/forms/${editId}` : '/forms';
            const method = editId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json', // Add Accept header for JSON response
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.visit('/form-management');
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save form');
            }
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Failed to save form. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const exportForm = () => {
        const formData = {
            title,
            description,
            fields: fields, // Keep the field IDs for consistency
            createdAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-form.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importForm = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const formData = JSON.parse(e.target?.result as string);
                    setTitle(formData.title || 'Imported Form');
                    setDescription(formData.description || '');
                    setFields(formData.fields?.map((field: any) => ({
                        ...field,
                        id: Date.now().toString() + Math.random()
                    })) || []);
                } catch (error) {
                    alert('Invalid form file. Please upload a valid JSON form configuration.');
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Builder" />
            
            <div className="flex h-full flex-col bg-gray-50 dark:bg-neutral-900">
                {/* Builder Header */}
                <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b bg-white px-4 sm:px-6 py-3 sm:py-4 dark:bg-neutral-800">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.visit('/form-management')}
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg sm:text-xl font-bold truncate">{title}</h1>
                            <p className="text-xs sm:text-sm text-gray-500">Draft Status</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:flex-row sm:gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsPreview(!isPreview)}
                            className="gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                            {isPreview ? <Save className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                            <span className="hidden sm:inline">{isPreview ? 'Back to Editor' : 'Live Preview'}</span>
                            <span className="sm:hidden">{isPreview ? 'Editor' : 'Preview'}</span>
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={exportForm}
                            className="gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Export</span>
                            <span className="sm:hidden">Exp</span>
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={importForm}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button 
                                variant="outline"
                                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                            >
                                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Import</span>
                                <span className="sm:hidden">Imp</span>
                            </Button>
                        </div>
                        <Button 
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">{isLoading ? 'Saving...' : 'Publish Form'}</span>
                            <span className="sm:hidden">{isLoading ? 'Saving' : 'Publish'}</span>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Toolset (Hidden in preview) */}
                    {!isPreview && (
                        <div className="w-16 sm:w-64 sm:w-80 overflow-y-auto border-r bg-white p-2 sm:p-4 sm:p-6 dark:bg-neutral-800">
                            <h3 className="hidden sm:block mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-400">Add Elements</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
                                <div className="hidden sm:block text-xs text-gray-500 mb-2">Basic Fields</div>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('text')} title="Short Text">
                                    <Type className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                                    <span className="hidden sm:inline text-xs sm:text-sm">Short Text</span>
                                </Button>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('textarea')} title="Long Text">
                                    <AlignLeft className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                                    <span className="hidden sm:inline text-xs sm:text-sm">Long Text</span>
                                </Button>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('select')} title="Dropdown">
                                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                                    <span className="hidden sm:inline text-xs sm:text-sm">Dropdown</span>
                                </Button>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('date')} title="Date">
                                    <div className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 font-mono text-xs">📅</div>
                                    <span className="hidden sm:inline text-xs sm:text-sm">Date</span>
                                </Button>
                                <div className="hidden sm:block text-xs text-gray-500 mb-2 mt-4 sm:mt-4">Choice Fields</div>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('checkbox')} title="Checkbox">
                                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 rounded text-blue-500 flex items-center justify-center text-xs">✓</div>
                                    <span className="hidden sm:inline text-xs sm:text-sm">Checkbox</span>
                                </Button>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('radio')} title="Radio Buttons">
                                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 rounded-full border-blue-500"></div>
                                    <span className="hidden sm:inline text-xs sm:text-sm">Radio Buttons</span>
                                </Button>
                                <div className="hidden sm:block text-xs text-gray-500 mb-2 mt-4 sm:mt-4">Special Fields</div>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('email')} title="Email">
                                    <div className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 font-mono text-xs">@</div>
                                    <span className="hidden sm:inline text-xs sm:text-sm">Email</span>
                                </Button>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('number')} title="Number">
                                    <div className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 font-mono text-xs">#</div>
                                    <span className="hidden sm:inline text-xs sm:text-sm">Number</span>
                                </Button>
                                <Button variant="outline" className="justify-center sm:justify-start gap-2 sm:gap-3 h-10 sm:h-12" onClick={() => addField('file')} title="File Attachment">
                                    <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                    <span className="hidden sm:inline text-xs sm:text-sm">File Attachment</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Main Builder Canvas */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
                            
                            {/* Form Header Info (Editable) */}
                            <div className={cn(
                                "rounded-xl border bg-white p-4 sm:p-6 lg:p-8 shadow-sm dark:bg-neutral-800",
                                !isPreview && "border-t-4 border-t-green-700"
                            )}>
                                {isPreview ? (
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className={`p-2 sm:p-3 rounded-lg ${iconOptions.find(opt => opt.name === selectedIcon)?.bg}`}>
                                            {React.createElement(iconOptions.find(opt => opt.name === selectedIcon)?.icon || FileText, {
                                                className: `h-5 w-5 sm:h-6 sm:w-6 ${iconOptions.find(opt => opt.name === selectedIcon)?.color}`
                                            })}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{title}</h2>
                                            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 line-clamp-2">{description}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <div className={`p-2 sm:p-3 rounded-lg ${iconOptions.find(opt => opt.name === selectedIcon)?.bg}`}>
                                                {React.createElement(iconOptions.find(opt => opt.name === selectedIcon)?.icon || FileText, {
                                                    className: `h-5 w-5 sm:h-6 sm:w-6 ${iconOptions.find(opt => opt.name === selectedIcon)?.color}`
                                                })}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <input 
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    className="w-full text-xl sm:text-2xl lg:text-3xl font-bold border-none p-0 focus:ring-0 placeholder-gray-300 truncate"
                                                    placeholder="Form Title"
                                                />
                                                <textarea 
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full border-none p-0 text-sm sm:text-base text-gray-500 focus:ring-0 resize-none min-h-[40px] sm:min-h-[60px] mt-1 sm:mt-2"
                                                    placeholder="Add a description for user..."
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Icon Selector */}
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Form Icon</label>
                                            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1 sm:gap-2">
                                                {iconOptions.map((option) => (
                                                    <button
                                                        key={option.name}
                                                        type="button"
                                                        onClick={() => setSelectedIcon(option.name)}
                                                        className={cn(
                                                            "flex items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all",
                                                            selectedIcon === option.name 
                                                                ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                                                                : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                                                        )}
                                                        title={option.label}
                                                    >
                                                        <option.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${option.color}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fields List */}
                            <div className="space-y-3 sm:space-y-4">
                                {fields.map((field, index) => (
                                    <div 
                                        key={field.id}
                                        draggable={!isPreview}
                                        onDragStart={(e) => handleDragStart(e, field.id, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDragEnter={handleDragEnter}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            "group relative rounded-xl border bg-white p-4 sm:p-6 shadow-sm transition-all dark:bg-neutral-800",
                                            !isPreview && "hover:border-green-600 border-transparent border-dashed cursor-move",
                                            draggedField === field.id && "opacity-50",
                                            dragOverIndex === index && draggedField !== field.id && "border-t-4 border-t-green-500"
                                        )}
                                    >
                                        {!isPreview && (
                                            <div className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 cursor-grab text-gray-300 opacity-0 group-hover:opacity-100">
                                                <GripVertical className="h-4 w-4 sm:h-6 sm:w-6" />
                                            </div>
                                        )}

                                        {isPreview ? (
                                            <div className="space-y-2">
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    {field.label}
                                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                                {field.type === 'text' && (
                                                    <input type="text" placeholder={field.placeholder} className="w-full rounded-md border p-2 bg-gray-50 text-sm" disabled />
                                                )}
                                                {field.type === 'textarea' && (
                                                    <textarea placeholder={field.placeholder} className="w-full rounded-md border p-2 bg-gray-50 min-h-[80px] sm:min-h-[100px] text-sm" disabled />
                                                )}
                                                {field.type === 'select' && (
                                                    <div className="relative">
                                                        <select className="w-full rounded-md border p-2 bg-gray-50 appearance-none text-sm" disabled>
                                                            <option>Select an option...</option>
                                                            {field.options?.map(opt => <option key={opt}>{opt}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                                    </div>
                                                )}
                                                {field.type === 'file' && (
                                                    <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center bg-gray-50">
                                                        <Paperclip className="mx-auto h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mb-2" />
                                                        <span className="text-xs sm:text-sm text-gray-500 font-medium">Click to upload or drag and drop</span>
                                                    </div>
                                                )}
                                                {field.type === 'checkbox' && (
                                                    <div className="space-y-1 sm:space-y-2">
                                                        {field.options?.map((opt, idx) => (
                                                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" className="rounded border-gray-300 h-4 w-4" disabled />
                                                                <span className="text-xs sm:text-sm">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                                {field.type === 'radio' && (
                                                    <div className="space-y-1 sm:space-y-2">
                                                        {field.options?.map((opt, idx) => (
                                                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                                                <input type="radio" name={`radio-${field.id}`} className="border-gray-300 h-4 w-4" disabled />
                                                                <span className="text-xs sm:text-sm">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                                {field.type === 'email' && (
                                                    <input type="email" placeholder={field.placeholder || 'user@example.com'} className="w-full rounded-md border p-2 bg-gray-50 text-sm" disabled />
                                                )}
                                                {field.type === 'number' && (
                                                    <input type="number" placeholder={field.placeholder || '0'} className="w-full rounded-md border p-2 bg-gray-50 text-sm" disabled />
                                                )}
                                                {field.type === 'date' && (
                                                    <input type="date" className="w-full rounded-md border p-2 bg-gray-50 text-sm" disabled />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 sm:space-y-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <input 
                                                        value={field.label}
                                                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                        className="font-semibold border-none p-0 focus:ring-0 w-full text-sm sm:text-base"
                                                        placeholder="Field Label"
                                                    />
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => removeField(field.id)}
                                                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                                    >
                                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Button>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-sm">
                                                    <input 
                                                        value={field.placeholder || ''}
                                                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                        className="flex-1 bg-gray-50 border rounded px-3 py-1 text-xs"
                                                        placeholder="Placeholder text..."
                                                    />
                                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                                        <Switch 
                                                            checked={field.required}
                                                            onCheckedChange={(checked: boolean) => updateField(field.id, { required: checked })}
                                                        />
                                                        <span className="hidden sm:inline">Required</span>
                                                    </label>
                                                </div>

                                                {field.type === 'select' && (
                                                    <div className="mt-4 space-y-2 border-t pt-4">
                                                        <label className="text-xs font-semibold text-gray-400 uppercase">Options</label>
                                                        {field.options?.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex gap-2">
                                                                <input 
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...(field.options || [])];
                                                                        newOpts[optIdx] = e.target.value;
                                                                        updateField(field.id, { options: newOpts });
                                                                    }}
                                                                    className="flex-1 text-sm bg-gray-50 border border-dashed rounded px-3 py-1"
                                                                />
                                                                <button onClick={() => {
                                                                    const newOpts = (field.options || []).filter((_, i) => i !== optIdx);
                                                                    updateField(field.id, { options: newOpts });
                                                                }} className="text-gray-300 hover:text-red-400">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-blue-600 text-xs gap-1"
                                                            onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            <span className="hidden sm:inline">Add Option</span>
                                                            <span className="sm:hidden">Add</span>
                                                        </Button>
                                                    </div>
                                                )}
                                                
                                                {(field.type === 'checkbox' || field.type === 'radio') && (
                                                    <div className="mt-4 space-y-2 border-t pt-4">
                                                        <label className="text-xs font-semibold text-gray-400 uppercase">Options</label>
                                                        {field.options?.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex gap-2">
                                                                <input 
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...(field.options || [])];
                                                                        newOpts[optIdx] = e.target.value;
                                                                        updateField(field.id, { options: newOpts });
                                                                    }}
                                                                    className="flex-1 text-sm bg-gray-50 border border-dashed rounded px-3 py-1"
                                                                />
                                                                <button onClick={() => {
                                                                    const newOpts = (field.options || []).filter((_, i) => i !== optIdx);
                                                                    updateField(field.id, { options: newOpts });
                                                                }} className="text-gray-300 hover:text-red-400">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-blue-600 text-xs gap-1"
                                                            onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            <span className="hidden sm:inline">Add Option</span>
                                                            <span className="sm:hidden">Add</span>
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Advanced Settings */}
                                                <div className="mt-4 border-t pt-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="text-xs font-semibold text-gray-400 uppercase">Advanced Settings</label>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-xs gap-1"
                                                            onClick={() => setShowAdvanced({ ...showAdvanced, [field.id]: !showAdvanced[field.id] })}
                                                        >
                                                            {showAdvanced[field.id] ? 'Hide' : 'Show'}
                                                        </Button>
                                                    </div>
                                                    
                                                    {showAdvanced[field.id] && (
                                                        <div className="space-y-3">
                                                            {/* Validation Rules */}
                                                            {(field.type === 'text' || field.type === 'textarea') && (
                                                                <div className="space-y-2">
                                                                    <label className="text-xs font-medium text-gray-600">Validation Rules</label>
                                                                    <div className="flex gap-2">
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="Min length"
                                                                            value={field.validation?.minLength || ''}
                                                                            onChange={(e) => addValidation(field.id, 'minLength', parseInt(e.target.value) || 0)}
                                                                            className="w-20 text-xs bg-gray-50 border rounded px-2 py-1"
                                                                        />
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="Max length"
                                                                            value={field.validation?.maxLength || ''}
                                                                            onChange={(e) => addValidation(field.id, 'maxLength', parseInt(e.target.value) || 0)}
                                                                            className="w-20 text-xs bg-gray-50 border rounded px-2 py-1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {field.type === 'number' && (
                                                                <div className="space-y-2">
                                                                    <label className="text-xs font-medium text-gray-600">Number Range</label>
                                                                    <div className="flex gap-2">
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="Min"
                                                                            value={field.validation?.min || ''}
                                                                            onChange={(e) => addValidation(field.id, 'min', parseInt(e.target.value) || 0)}
                                                                            className="w-20 text-xs bg-gray-50 border rounded px-2 py-1"
                                                                        />
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="Max"
                                                                            value={field.validation?.max || ''}
                                                                            onChange={(e) => addValidation(field.id, 'max', parseInt(e.target.value) || 0)}
                                                                            className="w-20 text-xs bg-gray-50 border rounded px-2 py-1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Conditional Logic */}
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-medium text-gray-600">Show this field when...</label>
                                                                <select className="w-full text-xs bg-gray-50 border rounded px-2 py-1">
                                                                    <option>Always show</option>
                                                                    <option>Field equals...</option>
                                                                    <option>Field contains...</option>
                                                                    <option>Field is empty</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Field Actions */}
                                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-xs gap-1"
                                                        onClick={() => duplicateField(field.id)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Duplicate
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-xs text-red-600 gap-1"
                                                        onClick={() => removeField(field.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {fields.length === 0 && !isPreview && (
                                    <div className="rounded-xl border-2 border-dashed p-12 text-center text-gray-400 bg-white">
                                        No fields added yet. Select an element on the left to get started.
                                    </div>
                                )}
                                
                                {isPreview && (
                                    <Button className="w-full h-12 bg-green-700 hover:bg-green-800 text-lg font-bold">
                                        Submit Request
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
