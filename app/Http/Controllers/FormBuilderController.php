<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FormBuilderController extends Controller
{
    /**
     * Show the form builder page.
     */
    public function create()
    {
        return Inertia::render('Helpdesk/FormBuilder');
    }

    /**
     * Show the form builder for editing an existing form.
     */
    public function edit(Form $form)
    {
        return Inertia::render('Helpdesk/FormBuilder', [
            'editId' => $form->id,
            'form' => $form
        ]);
    }

    /**
     * Store a new form.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'fields' => 'required|array|min:1',
            'fields.*.id' => 'required|string', // Add ID validation
            'fields.*.type' => 'required|in:text,textarea,select,file,checkbox,radio,email,number,date',
            'fields.*.label' => 'required|string|max:255',
            'fields.*.placeholder' => 'nullable|string',
            'fields.*.required' => 'required|boolean',
            'fields.*.options' => 'nullable|array',
            'fields.*.validation' => 'nullable|array',
            'fields.*.conditional' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $form = Form::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'icon' => $validated['icon'] ?? 'FileText',
                'fields' => $validated['fields'],
                'status' => 'active',
                'user_id' => auth()->id(),
            ]);

            DB::commit();
            
            // Return JSON response for AJAX requests
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Form created successfully!',
                    'form_id' => $form->id
                ]);
            }
            
            return redirect()->route('form-management.index')
                ->with('success', 'Form created successfully!');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Return JSON response for AJAX requests
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create form: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create form: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing form.
     */
    public function update(Request $request, Form $form)
    {
        // $this->authorize('update', $form);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'fields' => 'required|array|min:1',
            'fields.*.id' => 'required|string', // Add ID validation
            'fields.*.type' => 'required|in:text,textarea,select,file,checkbox,radio,email,number,date',
            'fields.*.label' => 'required|string|max:255',
            'fields.*.placeholder' => 'nullable|string',
            'fields.*.required' => 'required|boolean',
            'fields.*.options' => 'nullable|array',
            'fields.*.validation' => 'nullable|array',
            'fields.*.conditional' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $form->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'icon' => $validated['icon'] ?? 'FileText',
                'fields' => $validated['fields'],
            ]);

            DB::commit();
            
            // Return JSON response for AJAX requests
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Form updated successfully!'
                ]);
            }
            
            return redirect()->route('form-management.index')
                ->with('success', 'Form updated successfully!');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Return JSON response for AJAX requests
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update form: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update form: ' . $e->getMessage());
        }
    }

    /**
     * Publish a form (change status to active).
     */
    public function publish(Form $form)
    {
        // $this->authorize('update', $form);

        $form->update(['status' => 'active']);
        
        return back()->with('success', 'Form published successfully!');
    }

    /**
     * Archive a form.
     */
    public function archive(Form $form)
    {
        // $this->authorize('update', $form);

        $form->update(['status' => 'archived']);
        
        return back()->with('success', 'Form archived successfully!');
    }

    /**
     * Delete a form.
     */
    public function destroy(Form $form)
    {
        // $this->authorize('delete', $form);

        $form->delete();
        
        return redirect()->route('form-management.index')
            ->with('success', 'Form deleted successfully!');
    }

    /**
     * Duplicate a form.
     */
    public function duplicate(Form $form)
    {
        // $this->authorize('view', $form);

        $newForm = $form->replicate();
        $newForm->title = $form->title . ' (Copy)';
        $newForm->status = 'draft';
        $newForm->user_id = auth()->id();
        $newForm->save();

        return redirect()->route('form-builder.edit', $newForm)
            ->with('success', 'Form duplicated successfully!');
    }

    /**
     * Export form as JSON.
     */
    public function export(Form $form)
    {
        // $this->authorize('view', $form);

        $exportData = [
            'title' => $form->title,
            'description' => $form->description,
            'fields' => $form->fields,
            'created_at' => $form->created_at,
        ];

        return response()->json($exportData);
    }

    /**
     * Import form from JSON.
     */
    public function import(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:json',
        ]);

        try {
            $content = file_get_contents($validated['file']->getPathname());
            $formData = json_decode($content, true);

            if (!$formData || !isset($formData['fields'])) {
                return back()->with('error', 'Invalid form file format.');
            }

            $form = Form::create([
                'title' => $formData['title'] ?? 'Imported Form',
                'description' => $formData['description'] ?? '',
                'fields' => $formData['fields'],
                'status' => 'draft',
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('form-builder.edit', $form)
                ->with('success', 'Form imported successfully!');
                
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to import form: ' . $e->getMessage());
        }
    }
}
