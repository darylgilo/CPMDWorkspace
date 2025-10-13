<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AuthenticatedSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     * 
     * This method processes user login attempts and includes the following security features:
     * - User authentication validation
     * - Account activation status check (activate/deactivate feature)
     * - Session regeneration for security
     * - Last login timestamp tracking
     
     * ACTIVATE/DEACTIVATE FEATURE:
     * After successful authentication, the system checks if the user's account is active.
     * Only users with status = 'active' can log in. Inactive users are immediately
     * logged out and shown an error message.
     * 
     * @param LoginRequest $request The validated login request
     * @return RedirectResponse Redirect to dashboard or login with errors
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Validate credentials and log in the user
        $user = $request->validateCredentials();
        Auth::login($user);

        // ACTIVATE/DEACTIVATE FEATURE: Check if user account is active
        // This prevents inactive users from accessing the system
        $user = Auth::user();
        if ($user && $user->status !== 'active') {
            // User exists but is not active - deny access
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            // Redirect back to login with error message
            return redirect()->route('login')->withErrors([
                'email' => 'Your account is not activated. Please contact the administrator.'
            ]);
        }

        // User is active - proceed with login
        // Regenerate session for security (prevents session fixation attacks)
        $request->session()->regenerate();

        // Update last login timestamp
        $user->update(['last_login_at' => now()]);

        // Redirect to intended destination or dashboard
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     * 
     * This method handles user logout by:
     * - Logging out the user from the web guard
     * - Invalidating the current session
     * - Regenerating the CSRF token for security
     * - Redirecting to the home page
     * 
     * @param Request $request The incoming HTTP request
     * @return RedirectResponse Redirect to home page
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
