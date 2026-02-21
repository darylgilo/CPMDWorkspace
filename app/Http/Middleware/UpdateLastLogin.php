<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastLogin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            // Only update if last login was more than 1 minute ago to avoid constant DB writes
            if (!$user->last_login_at || $user->last_login_at->diffInMinutes(now()) >= 1) {
                $user->update(['last_login_at' => now()]);
            }
        }

        return $next($request);
    }
}
