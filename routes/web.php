<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\Usercontrol\UserController;
use App\Http\Controllers\Employee\EmployeeManagementController;
use App\Http\Controllers\Employee\EmployeeDirectoryController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\PesticideManagement\PesticideController;
use App\Http\Controllers\PesticideManagement\DistributionController;
use App\Http\Controllers\PesticideManagement\PesticideIndexController;
use App\Http\Middleware\RoleMiddleware;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');


// Dashboard route for all authenticated and verified users
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Employee Directory (read-only, accessible to all authenticated users)
    Route::get('/directory', [EmployeeDirectoryController::class, 'index'])->name('directory.index');
    Route::get('/directory/{id}', [EmployeeDirectoryController::class, 'show'])->name('directory.show');

    // AI Chatbot
    Route::get('/chatbot', [ChatbotController::class, 'index'])->name('chatbot.index');
    Route::post('/chatbot/message', [ChatbotController::class, 'message'])->name('chatbot.message');

    // Pesticide Management (Parent page with tabs)
    Route::get('/pesticidesindex', [PesticideIndexController::class, 'index'])->name('pesticidesindex.index');

    // Pesticide Inventory Management
    Route::get('/pesticides', [PesticideController::class, 'index'])->name('pesticides.index');
    Route::post('/pesticides', [PesticideController::class, 'store'])->name('pesticides.store');
    Route::put('/pesticides/{pesticide}', [PesticideController::class, 'update'])->name('pesticides.update');
    Route::delete('/pesticides/{pesticide}', [PesticideController::class, 'destroy'])->name('pesticides.destroy');

    // Pesticide Distribution Management
    Route::get('/distributions', [DistributionController::class, 'index'])->name('distributions.index');
    Route::post('/distributions', [DistributionController::class, 'store'])->name('distributions.store');
    Route::put('/distributions/{distribution}', [DistributionController::class, 'update'])->name('distributions.update');
    Route::delete('/distributions/{distribution}', [DistributionController::class, 'destroy'])->name('distributions.destroy');
    // Noticeboard - specific routes before parameterized routes
    Route::get('/noticeboard/announcements', [NoticeController::class, 'announcements'])->name('noticeboard.announcements');
    Route::get('/noticeboard/memo', [NoticeController::class, 'memo'])->name('noticeboard.memo');
    Route::get('/noticeboard/event', [NoticeController::class, 'events'])->name('noticeboard.event');
    Route::get('/noticeboard/meeting', [NoticeController::class, 'meetings'])->name('noticeboard.meeting');
    Route::get('/noticeboard/{notice}/download', [NoticeController::class, 'download'])->name('noticeboard.download');
    Route::get('/noticeboard/{notice}/download-all', [NoticeController::class, 'downloadAll'])->name('noticeboard.downloadAll');
    Route::get('/noticeboard', [NoticeController::class, 'index'])->name('noticeboard.index');
    Route::post('/noticeboard', [NoticeController::class, 'store'])->name('noticeboard.store');
    Route::post('/noticeboard/{notice}', [NoticeController::class, 'update'])->name('noticeboard.update');
    Route::delete('/noticeboard/{notice}', [NoticeController::class, 'destroy'])->name('noticeboard.destroy');
});

// Biocon user management route, accessible to admin, superadmin, and biocon roles
Route::middleware(['auth', 'verified','role:admin,superadmin,biocon'])->group(function () {
    // Route::get('/biocon/testpage',[UserRoleController::class,'biocon'])->name('biocon');
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
    // Make the sidebar link work by serving the new page here as well
    Route::get('/admin/employeemanagement', [EmployeeManagementController::class, 'index'])->name('admin');
    // Employee Management (Users as Employees)
    Route::get('/employees', [EmployeeManagementController::class, 'index'])->name('employees.index');
    Route::get('/employees/create', [EmployeeManagementController::class, 'create'])->name('employees.create');
    Route::post('/employees', [EmployeeManagementController::class, 'store'])->name('employees.store');
    Route::put('/employees/{id}', [EmployeeManagementController::class, 'update'])->name('employees.update');
    Route::get('/employees/{id}', [EmployeeManagementController::class, 'show'])->name('employees.show');
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