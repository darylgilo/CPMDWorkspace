<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use App\Mail\SelfRegistrationWelcomeEmail;
use Illuminate\Support\Facades\Mail;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     *
     * Renders the registration form using Inertia.js.
     *
     * @return Response Inertia response with registration page
     */
    public function create(): Response
    {
        // Get sections for the registration form
        $sections = \App\Models\Section::orderBy('office')->orderBy('display_order')->get();
        
        // Group sections by office for better organization
        $sectionsByOffice = $sections->groupBy('office')->map(function ($officeSections) {
            return $officeSections->pluck('name')->toArray();
        })->toArray();
        
        return Inertia::render('auth/register', [
            'sections' => $sections,
            'SECTIONS_BY_OFFICE' => $sectionsByOffice,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * This method processes new user registrations. It performs:
     * - Input validation for name, email, and password
     * - User creation with default status 'inactive' (activate/deactivate feature)
     * - Triggers the Registered event
     * - Redirects to login with a message
     *
     * ACTIVATE/DEACTIVATE FEATURE:
     * New users are created with status = 'inactive'.
     * This means they cannot log in until an admin activates their account.
     *
     * @param Request $request The registration request
     * @return RedirectResponse Redirect to login with success message
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Validate registration input
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'office' => 'required|string|in:DO,ADO RDPSS,ADO RS,PMO,BIOTECH,NSIC,ADMINISTRATIVE,CPMD,CRPSD,AED,PPSSD,NPQSD,NSQCS,Baguio BPI center,Davao BPI center,Guimaras BPI center,La Granja BPI center,Los Baños BPI center,Others',
            'section_id' => 'required|string',
        ]);

        // Find the section by name and office
        $section = \App\Models\Section::where('name', $request->section_id)
            ->where('office', $request->office)
            ->first();

        // Create user with status 'inactive' (requires admin activation)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'office' => $request->office,
            'section_id' => $section ? $section->id : null,
            'status' => 'inactive', // User is inactive by default
        ]);

        // Send welcome email for self-registered users
        try {
            Mail::to($user->email)->send(new SelfRegistrationWelcomeEmail($user));
        } catch (\Exception $e) {
            \Log::error('Failed to send self-registration welcome email: ' . $e->getMessage());
            // Continue with registration even if email fails
        }

        // Fire Registered event (for notifications, etc.)
        event(new Registered($user));

        // Redirect to login with a message about verification and activation requirement
        return redirect()->route('login')->with('success', 'Registration successful! Please check your email for verification and wait for admin activation.');
    }
}
