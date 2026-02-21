<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PageAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $page): Response
    {
        $user = Auth::user();
        
        // Allow access if user is not authenticated (will be handled by auth middleware)
        if (!$user) {
            return $next($request);
        }
        
        // Allow full access to admin and superadmin users
        if (in_array($user->role, ['admin', 'superadmin'])) {
            return $next($request);
        }
        
        // Check page-specific access
        $accessField = 'can_access_' . $page;
        $hasAccess = $user->$accessField ?? true; // Default to true for backward compatibility
        
        if (!$hasAccess) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'You do not have permission to access this page.',
                    'page' => $page
                ], 403);
            }
            
            // Return 403 Forbidden response using existing unauthorized page
            return response()->view('errors.unauthorized', [], 403);
        }
        
        return $next($request);
    }
}
