import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    ChevronLeft, 
    Send,
    Paperclip,
    ChevronDown,
    AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Priority options with colors
const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'text-green-600' },
];

interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio' | 'email' | 'number' | 'date';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    validation?: any;
    conditional?: any;
}

interface FormData {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'archived';
    fields: FormField[];
    user: {
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface FormViewProps {
    form: FormData;
}

export default function FormView({ form }: FormViewProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

    useEffect(() => {
        // Initialize form data with empty values
        console.log('=== INITIALIZING FORM DATA ===');
        console.log('Form:', form);
        console.log('Form fields:', form.fields);
        
        const initialData: Record<string, any> = {};
        form.fields.forEach(field => {
            initialData[field.id] = '';
        });
        setFormData(initialData);
    }, [form]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.priority-dropdown')) {
                setShowPriorityDropdown(false);
            }
        };

        if (showPriorityDropdown) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showPriorityDropdown]);

    if (!form || form.status !== 'active') {
        return (
            <AppLayout breadcrumbs={[{ title: 'Forms', href: '/forms' }]}>
                <div className="p-8 text-center text-gray-500">Form not found or is no longer active.</div>
            </AppLayout>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Forms', href: '/forms' },
        { title: form.title, href: `/forms/${form.id}` },
    ];

    const handleInputChange = (fieldId: string, value: any) => {
        console.log(`=== FIELD INPUT CHANGE ===`);
        console.log(`Field ID: ${fieldId}`);
        console.log(`New Value: ${value}`);
        console.log(`Value Type: ${typeof value}`);
        console.log(`Previous formData:`, formData);
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [fieldId]: value
            };
            console.log(`New formData:`, newData);
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Log all form data before submission
        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('Form ID:', form.id);
        console.log('Form Fields:', form.fields);
        console.log('Form Data (formData state):', formData);
        console.log('Form Data keys:', Object.keys(formData));
        console.log('Form Data values:', Object.values(formData));
        
        // Check if all required fields are filled
        const requiredFields = form.fields.filter(field => field.required);
        const missingRequiredFields = requiredFields.filter(field => 
            !formData[field.id] || formData[field.id] === ''
        );
        
        if (missingRequiredFields.length > 0) {
            console.error('Missing required fields:', missingRequiredFields);
            alert(`Please fill in all required fields: ${missingRequiredFields.map(f => f.label).join(', ')}`);
            setIsSubmitting(false);
            return;
        }

        try {
            const url = `/forms/${form.id}`;
            console.log(`=== SENDING REQUEST TO: ${url} ===`);
            
            // Create FormData for file uploads
            const submitData = new FormData();
            
            // Append each field individually, handling files separately
            form.fields.forEach(field => {
                const value = formData[field.id];
                if (field.type === 'file' && value instanceof FileList) {
                    for (let i = 0; i < value.length; i++) {
                        submitData.append(`responses[${field.id}][]`, value[i]);
                    }
                } else if (value !== undefined && value !== null) {
                    submitData.append(`responses[${field.id}]`, value);
                }
            });
            
            // Add submitter info
            submitData.append('submitter_name', '');
            submitData.append('submitter_email', '');
            submitData.append('priority', priority);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    // Don't set Content-Type for FormData - browser sets it automatically with boundary
                },
                body: submitData,
            });

            console.log('Submitting form data with files:', {
                responses: formData,
                submitter_name: '',
                submitter_email: '',
                priority: priority
            });

            console.log('=== RESPONSE STATUS ===');
            console.log(`Response status: ${response.status}`);
            console.log(`Response ok: ${response.ok}`);

            if (response.ok) {
                const result = await response.json();
                console.log('Submission successful:', result);
                router.visit('/requests?success=true');
            } else {
                const errorText = await response.text();
                console.error('Response error text:', errorText);
                
                try {
                    const error = JSON.parse(errorText);
                    console.error('Submission error:', error);
                    if (error.errors) {
                        // Handle validation errors
                        const errorMessages = Object.values(error.errors).flat();
                        alert(errorMessages.join('\n'));
                    } else {
                        alert(error.message || 'Failed to submit form. Please try again.');
                    }
                } catch (parseError) {
                    console.error('Could not parse error response:', errorText);
                    alert('Server error: ' + errorText);
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to submit form. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={form.title} />
            
            <div className="flex h-full flex-col bg-gray-50 dark:bg-black overflow-y-auto">
                <div className="mx-auto max-w-2xl w-full py-12 px-6">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.visit('/forms')}
                        className="mb-8 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to available forms
                    </Button>

                    <div className="rounded-xl border bg-white shadow-sm dark:bg-neutral-800 dark:border-neutral-700 overflow-hidden">
                        <div className="bg-[#163832] p-8 text-white dark:bg-[#235347]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">{form.title}</h1>
                                    <p className="mt-2 opacity-90">{form.description || 'Please fill out this form.'}</p>
                                </div>
                                <div className="relative priority-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors border border-white/30"
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm font-medium capitalize">{priority}</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                    
                                    {showPriorityDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700 z-10">
                                            {priorityOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => { setPriority(option.value as any); setShowPriorityDropdown(false); }}
                                                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-neutral-700 ${option.color}`}
                                                >
                                                    <AlertTriangle className="h-4 w-4" />
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {form.fields.map((field: FormField) => (
                                <div key={field.id} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    
                                    {field.type === 'text' && (
                                        <input 
                                            type="text" 
                                            required={field.required}
                                            placeholder={field.placeholder} 
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#163832] focus:ring-1 focus:ring-[#163832] outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" 
                                        />
                                    )}
                                    
                                    {field.type === 'email' && (
                                        <input 
                                            type="email" 
                                            required={field.required}
                                            placeholder={field.placeholder || 'user@example.com'} 
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#163832] focus:ring-1 focus:ring-[#163832] outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" 
                                        />
                                    )}
                                    
                                    {field.type === 'number' && (
                                        <input 
                                            type="number" 
                                            required={field.required}
                                            placeholder={field.placeholder || '0'} 
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#163832] focus:ring-1 focus:ring-[#163832] outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" 
                                        />
                                    )}
                                    
                                    {field.type === 'date' && (
                                        <input 
                                            type="date" 
                                            required={field.required}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#163832] focus:ring-1 focus:ring-[#163832] outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" 
                                        />
                                    )}
                                    
                                    {field.type === 'textarea' && (
                                        <textarea 
                                            required={field.required}
                                            placeholder={field.placeholder} 
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 min-h-[120px] focus:border-[#163832] focus:ring-1 focus:ring-[#163832] outline-none resize-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" 
                                        />
                                    )}
                                    
                                    {field.type === 'select' && (
                                        <select 
                                            required={field.required}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#163832] focus:ring-1 focus:ring-[#163832] outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                        >
                                            <option value="">-- Please select --</option>
                                            {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    )}
                                    
                                    {field.type === 'checkbox' && (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox"
                                                id={field.id}
                                                checked={formData[field.id] || false}
                                                onChange={(e) => handleInputChange(field.id, e.target.checked)}
                                                className="rounded border-gray-300 text-[#163832] focus:ring-[#163832] dark:border-neutral-600 dark:bg-neutral-700"
                                            />
                                            <label htmlFor={field.id} className="text-sm text-gray-700 dark:text-gray-300">
                                                {field.label}
                                            </label>
                                        </div>
                                    )}
                                    
                                    {field.type === 'radio' && (
                                        <div className="space-y-2">
                                            {field.options?.map((opt: string) => (
                                                <div key={opt} className="flex items-center gap-2">
                                                    <input 
                                                        type="radio"
                                                        id={`${field.id}-${opt}`}
                                                        name={field.id}
                                                        value={opt}
                                                        checked={formData[field.id] === opt}
                                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                                        className="border-gray-300 text-[#163832] focus:ring-[#163832] dark:border-neutral-600 dark:bg-neutral-700"
                                                    />
                                                    <label htmlFor={`${field.id}-${opt}`} className="text-sm text-gray-700 dark:text-gray-300">
                                                        {opt}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {field.type === 'file' && (
                                        <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 bg-gray-50 transition-colors hover:bg-gray-100 cursor-pointer group dark:bg-neutral-800 dark:border-neutral-600 dark:hover:bg-neutral-700">
                                            <input 
                                                type="file"
                                                id={field.id}
                                                multiple
                                                onChange={(e) => handleInputChange(field.id, e.target.files)}
                                                className="hidden"
                                            />
                                            <div 
                                                className="text-center"
                                                onClick={() => document.getElementById(field.id)?.click()}
                                            >
                                                <Paperclip className="mx-auto h-6 w-6 text-gray-400 group-hover:text-[#163832] mb-2" />
                                                <span className="text-sm text-gray-500 font-medium dark:text-gray-400">
                                                    {formData[field.id] && formData[field.id].length > 0 
                                                        ? `${formData[field.id].length} file(s) selected` 
                                                        : 'Click to upload files'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="pt-6 border-t font-sm text-gray-400 dark:border-neutral-700 dark:text-gray-500">
                                <p className="mb-4">* Required fields must be completed before submission.</p>
                                <Button 
                                    className="w-full h-12 bg-[#163832] hover:bg-[#163832]/90 text-base font-semibold text-white transition-all dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Processing...' : (
                                        <div className="flex items-center gap-2">
                                            <Send className="h-4 w-4" />
                                            Submit Form
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
