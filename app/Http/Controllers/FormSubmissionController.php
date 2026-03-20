<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\FormResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FormSubmissionController extends Controller
{
    /**
     * Display user's form submissions.
     */
    public function index()
    {
        $submissions = FormSubmission::with(['form', 'responses'])
            ->where('user_id', auth()->id())
            ->latest()
            ->get();

        return Inertia::render('RequestAndForms/Requests', [
            'submissions' => $submissions
        ]);
    }

    /**
     * Display single form submission details.
     */
    public function viewSubmission(FormSubmission $submission)
    {
        // Check if the user owns this submission
        if ($submission->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $submission->load(['form', 'responses', 'user']);

        return Inertia::render('RequestAndForms/RequestDetails', [
            'submission' => $submission
        ]);
    }

    /**
     * Display the form for submission.
     */
    public function show(Form $form)
    {
        if ($form->status !== 'active') {
            abort(404);
        }

        return Inertia::render('RequestAndForms/FormView', [
            'form' => $form
        ]);
    }

    /**
     * Store form submission.
     */
    public function store(Request $request, Form $form)
    {
        \Log::info('Form submission attempt:', [
            'form_id' => $form->id,
            'form_status' => $form->status,
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        if ($form->status !== 'active') {
            \Log::warning('Form submission attempted on non-active form:', [
                'form_id' => $form->id,
                'status' => $form->status
            ]);
            abort(404);
        }

        $validated = $request->validate([
            'submitter_name' => 'nullable|string|max:255',
            'submitter_email' => 'nullable|email|max:255',
            'responses' => 'required|array',
            'responses.*' => 'nullable', // Allow any response data including null/empty
            'priority' => 'nullable|in:urgent,high,medium,low',
        ]);

        \Log::info('Form submission validation passed:', [
            'validated' => $validated,
            'responses_keys' => array_keys($validated['responses'] ?? []),
            'responses_values' => $validated['responses'] ?? []
        ]);

        DB::beginTransaction();
        try {
            \Log::info('Creating form submission:', [
                'form_id' => $form->id,
                'user_id' => auth()->id(),
                'responses_count' => count($validated['responses'])
            ]);

            // Generate request ID based on form name
            $acronym = $this->generateFormAcronym($form->title);
            $sequenceNumber = $this->getNextSequenceNumber($acronym);
            $requestId = $acronym . '-' . str_pad($sequenceNumber, 4, '0', STR_PAD_LEFT);

            $submission = FormSubmission::create([
                'form_id' => $form->id,
                'user_id' => auth()->id(),
                'submitter_name' => $validated['submitter_name'],
                'submitter_email' => $validated['submitter_email'],
                'status' => 'submitted',
                'request_id' => $requestId,
                'priority' => $validated['priority'] ?? 'medium',
            ]);

            \Log::info('Form submission created:', [
                'submission_id' => $submission->id
            ]);

            $responsesCreated = 0;
            foreach ($validated['responses'] as $fieldId => $value) {
                // Find the field in the form definition
                $field = null;
                if (is_array($form->fields)) {
                    foreach ($form->fields as $formField) {
                        if (isset($formField['id']) && (string)$formField['id'] === (string)$fieldId) {
                            $field = $formField;
                            break;
                        }
                    }
                }
                
                if (!$field) {
                    \Log::warning('Field not found in form definition:', [
                        'field_id' => $fieldId,
                        'form_id' => $form->id,
                        'available_fields' => array_map(fn($f) => $f['id'] ?? 'no-id', $form->fields ?? []),
                        'field_id_type' => gettype($fieldId),
                        'comparison_attempt' => array_map(fn($f) => [
                            'field_id' => $f['id'] ?? 'no-id',
                            'type' => gettype($f['id'] ?? null),
                            'comparison' => isset($f['id']) && (string)$f['id'] === (string)$fieldId ? 'match' : 'no-match'
                        ], $form->fields ?? [])
                    ]);
                    continue;
                }

                // Handle file uploads
                if ($field['type'] === 'file') {
                    if (empty($value) || $value === '') {
                        \Log::info('Skipping empty file field:', [
                            'field_id' => $fieldId,
                            'field_label' => $field['label']
                        ]);
                        continue;
                    }

                    // Process uploaded files
                    $fileData = [];
                    if (is_array($value)) {
                        foreach ($value as $file) {
                            if ($file instanceof \Illuminate\Http\UploadedFile) {
                                $path = $file->store('form_attachments', 'public');
                                $fileData[] = [
                                    'filename' => $file->getClientOriginalName(),
                                    'path' => $path,
                                    'size' => $file->getSize(),
                                    'mime_type' => $file->getMimeType()
                                ];
                            }
                        }
                    }

                    \Log::info('Creating form response for files:', [
                        'field_id' => $fieldId,
                        'field_type' => $field['type'],
                        'field_label' => $field['label'],
                        'file_data' => $fileData
                    ]);

                    FormResponse::create([
                        'form_submission_id' => $submission->id,
                        'field_id' => $fieldId,
                        'field_type' => $field['type'],
                        'field_label' => $field['label'],
                        'value' => $fileData,
                    ]);

                    $responsesCreated++;
                    continue;
                }

                \Log::info('Creating form response:', [
                    'field_id' => $fieldId,
                    'field_type' => $field['type'],
                    'field_label' => $field['label'],
                    'value' => $value,
                    'value_type' => gettype($value)
                ]);

                FormResponse::create([
                    'form_submission_id' => $submission->id,
                    'field_id' => $fieldId,
                    'field_type' => $field['type'],
                    'field_label' => $field['label'],
                    'value' => $value ?? '', // Convert null to empty string
                ]);

                $responsesCreated++;
            }

            \Log::info('All form responses created:', [
                'submission_id' => $submission->id,
                'responses_expected' => count($validated['responses']),
                'responses_created' => $responsesCreated,
                'responses' => $validated['responses']
            ]);

            if ($responsesCreated === 0) {
                \Log::warning('No responses were created for submission:', [
                    'submission_id' => $submission->id,
                    'form_id' => $form->id
                ]);
            }

            DB::commit();
            
            \Log::info('Form submission successful:', [
                'submission_id' => $submission->id,
                'form_id' => $form->id,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Form submitted successfully!',
                'submission_id' => $submission->id
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Form submission failed:', [
                'error' => $e->getMessage(),
                'form_id' => $form->id,
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit form: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display all submissions for a form.
     */
    public function showSubmissions(Form $form)
    {
        $submissions = $form->submissions()
            ->with('user', 'responses')
            ->latest()
            ->get();

        return Inertia::render('Helpdesk/FormSubmissions', [
            'form' => $form,
            'submissions' => $submissions
        ]);
    }

    /**
     * Display single submission details.
     */
    public function view(FormSubmission $submission)
    {
        $submission->load(['form', 'user', 'responses']);

        return Inertia::render('Helpdesk/HelpdeskRequestDetails', [
            'submission' => $submission
        ]);
    }

    /**
     * Update submission status.
     */
    public function updateStatus(Request $request, FormSubmission $submission)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,resolved',
            'notes' => 'nullable|string',
        ]);

        $submission->update([
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? $submission->notes,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Submission status updated successfully!',
                'submission' => $submission->load(['form', 'user', 'responses'])
            ]);
        }

        return back()->with('success', 'Submission status updated!');
    }

    /**
     * Generate acronym from form title
     */
    private function generateFormAcronym($title)
    {
        // Remove special characters and split by spaces
        $words = preg_split('/[\s\-_]+/', preg_replace('/[^a-zA-Z0-9\s\-_]/', '', $title));
        
        $acronym = '';
        foreach ($words as $word) {
            if (!empty($word)) {
                $acronym .= strtoupper(substr($word, 0, 1));
            }
        }
        
        // If no words found, use 'FRM' as default
        return empty($acronym) ? 'FRM' : substr($acronym, 0, 5); // Limit to 5 characters
    }

    /**
     * Get next sequence number for the acronym
     */
    private function getNextSequenceNumber($acronym)
    {
        // Count existing submissions with the same acronym pattern
        $count = FormSubmission::where('request_id', 'like', $acronym . '-%')->count();
        return $count + 1;
    }
}
