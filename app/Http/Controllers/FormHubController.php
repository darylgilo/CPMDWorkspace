<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormHubController extends Controller
{
    /**
     * Display the Form Management page (admin side).
     */
    public function index()
    {
        $forms = Form::with('user')
            ->withCount('submissions')
            ->latest()
            ->get();

        return Inertia::render('Helpdesk/FormManagement', [
            'forms' => $forms,
        ]);
    }

    /**
     * Display available forms for the user (employee side).
     */
    public function userForms()
    {
        $forms = Form::where('status', 'active')
            ->select('id', 'title', 'description', 'fields', 'status', 'icon')
            ->latest()
            ->get();

        return Inertia::render('RequestAndForms/Forms', [
            'forms' => $forms,
        ]);
    }
}
