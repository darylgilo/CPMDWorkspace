<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Usercontrol\UserController;
use App\Http\Middleware\RoleMiddleware;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');


// Dashboard route for all authenticated and verified users
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// Biocon user management route, accessible to admin, superadmin, and biocon roles
Route::middleware(['auth', 'verified','role:admin,superadmin,biocon'])->group(function () {
    Route::get('/biocon/testpage',[UserRoleController::class,'biocon'])->name('biocon');
});

// PSF user management route, accessible to admin, superadmin, and pfs roles
Route::middleware(['auth', 'verified','role:admin,superadmin,pfs'])->group(function () {
    // Add PSF-specific routes here
});

// PHPS user management route, accessible to admin, superadmin, and phps roles
Route::middleware(['auth', 'verified','role:admin,superadmin,phps'])->group(function () {
    // Add PHPS-specific routes here
});

// accessible to admin and superadmin roles
Route::middleware(['auth', 'verified','role:admin,superadmin'])->group(function () {
    Route::get('/admin/employeemanagement',[UserRoleController::class,'admin'])->name('admin');
});

// Superadmin user management route, accessible only to superadmin role
Route::middleware(['auth', 'verified','role:superadmin'])->group(function () {
    // User management CRUD operations
    Route::get('/superadmin/usermanagement', [UserController::class, 'index'])->name('usermanagement');
    Route::get('/superadmin/usermanagement/create', [UserController::class, 'create'])->name('usermanagement.create');
    Route::get('/superadmin/usermanagement/{id}/edit', [UserController::class, 'edit'])->name('usermanagement.edit');
    Route::post('/superadmin/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/superadmin/users/{id}', [UserController::class, 'update'])->name('users.update');
    Route::patch('/superadmin/users/{id}/status', [UserController::class, 'updateStatus'])->name('users.updateStatus');
    Route::delete('/superadmin/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';