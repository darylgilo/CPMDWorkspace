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
        return Inertia::render('auth/register');
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
        ]);

        // Create user with status 'inactive' (requires admin activation)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'inactive', // User is inactive by default
        ]);

        // Fire Registered event (for notifications, etc.)
        event(new Registered($user));

        // Redirect to login with a message about activation requirement
        return redirect()->route('login')->with('success', 'Registration successful! Please wait for activation.');
    }
}
