<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\PageAccessMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\UpdateLastLogin::class,
        ]);
        $middleware->alias([
            // Register the 'role' middleware alias for role-based access control (RBAC)
            // This allows you to use 'role:admin', 'role:superadmin', etc. in your route definitions
            // to restrict access to specific user roles. The logic is implemented in RoleMiddleware.
            'role'=>RoleMiddleware::class,
            // Register the 'page_access' middleware alias for page-based access control
            // This allows you to use 'page_access:noticeboard', 'page_access:writing_suite', etc.
            // to restrict access to specific pages based on user permissions.
            'page_access'=>PageAccessMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
