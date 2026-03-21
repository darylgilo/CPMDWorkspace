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
use App\Http\Controllers\BudgetManagementController;
use App\Http\Controllers\Writing\WritingController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\Taskboard\TaskboardController;
use App\Http\Controllers\FormHubController;
use App\Http\Controllers\FormSubmissionController;
use App\Http\Controllers\HelpdeskController;
use App\Http\Middleware\RoleMiddleware;

// Include form routes
require __DIR__.'/forms.php';

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/about', function () {
    return Inertia::render('about');
})->name('about');

// Public Share Route for Posted Documents
Route::get('/share/document/{document}', [WritingController::class, 'postedView'])->name('documents.share');


// Dashboard route for all authenticated and verified users
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Test route for location selector
    Route::get('/test-location', function () {
        return Inertia::render('test/LocationTest');
    })->name('test.location');

    // Employee Directory (read-only, accessible to all authenticated users)
    Route::get('/directory', [EmployeeDirectoryController::class, 'index'])->name('directory.index');
    Route::get('/directory/{id}', [EmployeeDirectoryController::class, 'show'])->name('directory.show');

    // AI Chatbot
    Route::get('/chatbot', [ChatbotController::class, 'index'])->name('chatbot.index');
    Route::post('/chatbot/message', [ChatbotController::class, 'message'])->name('chatbot.message');

    // Pesticide Inventory Management
    Route::middleware(['page_access:inventory'])->group(function () {
        // Pesticide Stock (Parent page with tabs)
        Route::get('/pesticidesindex', [PesticideIndexController::class, 'index'])->name('pesticidesindex.index');
        
        Route::get('/pesticides', [PesticideController::class, 'index'])->name('pesticides.index');
        Route::post('/pesticides', [PesticideController::class, 'store'])->name('pesticides.store');
        Route::put('/pesticides/{pesticide}', [PesticideController::class, 'update'])->name('pesticides.update');
        Route::delete('/pesticides/{pesticide}', [PesticideController::class, 'destroy'])->name('pesticides.destroy');

        // Pesticide Distribution Management
        Route::get('/distributions', [DistributionController::class, 'index'])->name('distributions.index');
        Route::post('/distributions', [DistributionController::class, 'store'])->name('distributions.store');
        Route::put('/distributions/{distribution}', [DistributionController::class, 'update'])->name('distributions.update');
        Route::delete('/distributions/{distribution}', [DistributionController::class, 'destroy'])->name('distributions.destroy');
    });

    // Writing Management (Parent page with tabs)
    Route::middleware(['page_access:writing_suite'])->group(function () {
        Route::get('/writing', [WritingController::class, 'index'])->name('writing.index');
        Route::get('/archive', [WritingController::class, 'archive'])->name('writing.archive');
        
        // Document pages
        Route::get('/editdocument/{document}', [WritingController::class, 'edit'])->name('documents.edit');
        Route::get('/postedview/{document}', [WritingController::class, 'postedView'])->name('documents.postedview');
        
        // Document CRUD operations
        Route::post('/documents', [WritingController::class, 'store'])->name('documents.store');
        Route::put('/documents/{document}', [WritingController::class, 'update'])->name('documents.update');
        Route::delete('/documents/{document}', [WritingController::class, 'destroy'])->name('documents.destroy');
        
        // Document interactions
        Route::post('/documents/{document}/approve', [WritingController::class, 'approve'])->name('documents.approve');
        Route::post('/documents/{document}/like', [WritingController::class, 'like'])->name('documents.like');
        Route::post('/documents/{document}/bookmark', [WritingController::class, 'bookmark'])->name('documents.bookmark');
        Route::put('/documents/{document}/status', [WritingController::class, 'updateStatus'])->name('documents.updateStatus');
        Route::delete('/documents/{document}/images/{image}', [WritingController::class, 'deleteImage'])->name('documents.images.delete');
        
        // Comments
        Route::get('/documents/{document}/comments', [CommentController::class, 'index'])->name('comments.index');
        Route::post('/comments', [CommentController::class, 'store'])->name('comments.store');
        Route::put('/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
        Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
    });

        // Noticeboard - specific routes before parameterized routes
    Route::middleware(['page_access:noticeboard'])->group(function () {
        Route::get('/noticeboard/announcements', [NoticeController::class, 'announcements'])->name('noticeboard.announcements');
        Route::get('/noticeboard/event', [NoticeController::class, 'events'])->name('noticeboard.event');
        Route::get('/noticeboard/meeting', [NoticeController::class, 'meetings'])->name('noticeboard.meeting');
        Route::get('/noticeboard/reminder', [NoticeController::class, 'reminders'])->name('noticeboard.reminder');
        Route::get('/noticeboard/{notice}/download', [NoticeController::class, 'download'])->name('noticeboard.download');
        Route::get('/noticeboard/{notice}/download-all', [NoticeController::class, 'downloadAll'])->name('noticeboard.downloadAll');
        Route::get('/noticeboard', [NoticeController::class, 'index'])->name('noticeboard.index');
        Route::post('/noticeboard', [NoticeController::class, 'store'])->name('noticeboard.store');
        Route::post('/noticeboard/{notice}', [NoticeController::class, 'update'])->name('noticeboard.update');
        Route::delete('/noticeboard/{notice}', [NoticeController::class, 'destroy'])->name('noticeboard.destroy');
    });
    // Whereabouts Routes
    Route::get('/whereabouts', [App\Http\Controllers\Whereabouts\WhereaboutsController::class, 'index'])->name('whereabouts.index');
    Route::post('/whereabouts', [App\Http\Controllers\Whereabouts\WhereaboutsController::class, 'store'])->name('whereabouts.store');
    Route::post('/whereabouts/bulk', [App\Http\Controllers\Whereabouts\WhereaboutsController::class, 'bulkStore'])->name('whereabouts.bulk.store');
    Route::post('/whereabouts/bulk-reset', [App\Http\Controllers\Whereabouts\WhereaboutsController::class, 'bulkReset'])->name('whereabouts.bulk.reset');
    Route::post('/whereabouts/reorder', [App\Http\Controllers\Whereabouts\WhereaboutsController::class, 'reorder'])->name('whereabouts.reorder');
    Route::delete('/whereabouts/{id}', [App\Http\Controllers\Whereabouts\WhereaboutsController::class, 'destroy'])->name('whereabouts.destroy');

    // Taskboard
    Route::get('/taskboard', [TaskboardController::class, 'index'])->name('taskboard.index');
    Route::post('/tasks', [TaskboardController::class, 'store'])->name('tasks.store');
    Route::put('/tasks/{task}', [TaskboardController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskboardController::class, 'destroy'])->name('tasks.destroy');
    // API routes for dashboard widgets
    Route::get('/api/writeups', [WritingController::class, 'getWriteupsForWidget'])->name('api.writeups');
    Route::get('/api/notices', [NoticeController::class, 'getNoticesForWidget'])->name('api.notices');
    Route::get('/api/whereabouts', [App\Http\Controllers\Whereabouts\WhereaboutsController::class, 'getWhereaboutsForWidget'])->name('api.whereabouts');
    Route::get('/api/user-stats', [UserController::class, 'getStats'])->name('api.user-stats');
    Route::get('/api/weather', [WeatherController::class, 'getWeather'])->name('weather.get');
    Route::get('/api/my-tasks', [TaskboardController::class, 'getMyTasks'])->name('api.my-tasks');

    // Request and Forms (User Side)
    Route::get('/forms', [FormHubController::class, 'userForms'])->name('forms.index');
    Route::get('/requests', [FormSubmissionController::class, 'index'])->name('requests.index');
    Route::get('/requests/{submission}', [FormSubmissionController::class, 'viewSubmission'])->name('requests.show');

    Route::get('/forms/{id}', [FormSubmissionController::class, 'show'])->name('forms.show');
});

// Biocon user management route, accessible to admin, superadmin, and biocon roles
Route::middleware(['auth', 'verified','role:admin,superadmin,biocon'])->group(function () {
    // Route::get('/biocon/testpage',[UserRoleController::class,'biocon'])->name('biocon');
});

// PSF user management route, accessible to admin, superadmin, and pfs roles
Route::middleware(['auth', 'verified','role:admin,superadmin,psf'])->group(function () {
    // Add PSF-specific routes here
});

// PHPS user management route, accessible to admin, superadmin, and phps roles
Route::middleware(['auth', 'verified','role:admin,superadmin,phps'])->group(function () {
    // Add PHPS-specific routes here
});

// accessible to admin and superadmin roles
Route::middleware(['auth', 'verified','role:admin,superadmin'])->group(function () {
    // Make the sidebar link work by serving new page here as well
    Route::get('/admin/employeemanagement', [EmployeeManagementController::class, 'index'])->name('admin');
    // Employee Management (Users as Employees)
    Route::get('/employees', [EmployeeManagementController::class, 'index'])->name('employees.index');
    Route::get('/employees/create', [EmployeeManagementController::class, 'create'])->name('employees.create');
    Route::post('/employees', [EmployeeManagementController::class, 'store'])->name('employees.store');
    Route::put('/employees/{id}', [EmployeeManagementController::class, 'update'])->name('employees.update');
    Route::get('/employees/{id}', [EmployeeManagementController::class, 'show'])->name('employees.show');
    
    // Budget Management
    Route::middleware(['page_access:management'])->group(function () {
        Route::get('/budgetmanagement', [BudgetManagementController::class, 'index'])->name('budgetmanagement.index');
        Route::post('/funds', [BudgetManagementController::class, 'storeFund'])->name('funds.store');
        Route::put('/funds/{fund}', [BudgetManagementController::class, 'updateFund'])->name('funds.update');
        Route::delete('/funds/{fund}', [BudgetManagementController::class, 'destroyFund'])->name('funds.destroy');
        Route::post('/fund-transactions', [BudgetManagementController::class, 'storeTransaction'])->name('fund-transactions.store');
        Route::put('/fund-transactions/{transaction}', [BudgetManagementController::class, 'updateTransaction'])->name('fund-transactions.update');
        Route::delete('/fund-transactions/{transaction}', [BudgetManagementController::class, 'destroyTransaction'])->name('fund-transactions.destroy');
        Route::post('/travel-expenses', [BudgetManagementController::class, 'storeTravelExpense'])->name('travel-expenses.store');
        Route::put('/travel-expenses/{expense}', [BudgetManagementController::class, 'updateTravelExpense'])->name('travel-expenses.update');
        Route::delete('/travel-expenses/{expense}', [BudgetManagementController::class, 'destroyTravelExpense'])->name('travel-expenses.destroy');
        // PPMP Routes
        Route::post('/budgetmanagement/ppmp', [BudgetManagementController::class, 'storePPMP'])->name('budgetmanagement.ppmp.store');
        Route::post('/budgetmanagement/ppmp/funding-details', [BudgetManagementController::class, 'storeFundingDetails'])->name('budgetmanagement.ppmp.funding-details.store');
        Route::put('/budgetmanagement/ppmp/funding-details/{fundingDetail}', [BudgetManagementController::class, 'updateFundingDetails'])->name('budgetmanagement.ppmp.funding-details.update');
        Route::delete('/budgetmanagement/ppmp/funding-details/{fundingDetail}', [BudgetManagementController::class, 'destroyFundingDetails'])->name('budgetmanagement.ppmp.funding-details.destroy');
        Route::put('/budgetmanagement/ppmp/{ppmpProject}', [BudgetManagementController::class, 'updatePPMP'])->name('budgetmanagement.ppmp.update');
        Route::delete('/budgetmanagement/ppmp/{ppmpProject}', [BudgetManagementController::class, 'destroyPPMP'])->name('budgetmanagement.ppmp.destroy');
        
        // PPMP Subtotal Highlights Routes
        Route::get('/budgetmanagement/ppmp/highlights', [BudgetManagementController::class, 'getHighlights'])->name('budgetmanagement.ppmp.highlights.index');
        Route::post('/budgetmanagement/ppmp/highlights', [BudgetManagementController::class, 'storeHighlight'])->name('budgetmanagement.ppmp.highlights.store');
        Route::put('/budgetmanagement/ppmp/highlights/{highlight}', [BudgetManagementController::class, 'updateHighlight'])->name('budgetmanagement.ppmp.highlights.update');
        Route::delete('/budgetmanagement/ppmp/highlights/{highlight}', [BudgetManagementController::class, 'destroyHighlight'])->name('budgetmanagement.ppmp.highlights.destroy');
        
        Route::get('/budget-management/analytics', [BudgetManagementController::class, 'analytics'])->name('budget-management.analytics');
        Route::get('/budget-management/export', [BudgetManagementController::class, 'exportFunds'])->name('budget-management.export');
    });
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

    // Helpdesk (Admin Side)
    Route::get('/helpdesk', [HelpdeskController::class, 'index'])->name('helpdesk.index');
    Route::get('/helpdesk/all-requests', [HelpdeskController::class, 'assignments'])->name('helpdesk.all-requests');
    Route::get('/helpdesk/submission/{submission}', [FormSubmissionController::class, 'view'])->name('helpdesk.submission.show');
    Route::patch('/helpdesk/submission/{submission}/status', [FormSubmissionController::class, 'updateStatus'])->name('helpdesk.submission.updateStatus');
    Route::patch('/helpdesk/submission/{submission}/assignment', [HelpdeskController::class, 'updateAssignment'])->name('helpdesk.submission.updateAssignment');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';