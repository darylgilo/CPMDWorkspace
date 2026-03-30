<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OfficeMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $requiredOffice): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return redirect()->route('login');
        }

        // Check if user's office matches the required office
        if ($user->office !== $requiredOffice) {
            // Redirect to dashboard with an error message
            return redirect()->route('dashboard')->with('error', 'Access denied. This feature is only available to CPMD office staff.');
        }

        return $next($request);
    }
}
