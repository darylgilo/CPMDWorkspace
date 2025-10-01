<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * RoleMiddleware - Handles role-based access control for routes
 * 
 * This middleware checks if the authenticated user has one of the required roles
 * to access a specific route. If the user is not authenticated or doesn't have
 * the required role, they are redirected to an unauthorized error page.
 */
class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request  The incoming HTTP request
     * @param  \Closure  $next  The next middleware in the pipeline
     * @param  string[]  $roles  Array of roles that are allowed to access this route
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated and has one of the required roles
        if (!Auth::check() || !in_array(Auth::user()->role, $roles)) {
            // User is not authenticated or doesn't have required role
            // Return unauthorized error page
            return response()->view('errors.unauthorized');
        }
        
        // User is authenticated and has required role, continue to next middleware/controller
        return $next($request);
    }
}
