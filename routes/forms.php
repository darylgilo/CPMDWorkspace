<?php

use App\Http\Controllers\FormBuilderController;
use App\Http\Controllers\FormHubController;
use App\Http\Controllers\FormSubmissionController;
use Illuminate\Support\Facades\Route;

// Apply authentication middleware to all form routes
Route::middleware(['auth', 'verified'])->group(function () {

// Form Management Routes - Admin only
Route::middleware(['role:admin,superadmin'])->prefix('form-management')->name('form-management.')->group(function () {
    Route::get('/', [FormHubController::class, 'index'])->name('index');
    Route::get('/analytics', [FormHubController::class, 'analytics'])->name('analytics');
    Route::get('/submissions', [FormHubController::class, 'submissions'])->name('submissions');
});

// Form Builder Routes - Admin only
Route::middleware(['role:admin,superadmin'])->prefix('forms')->name('form-builder.')->group(function () {
    Route::get('/create', [FormBuilderController::class, 'create'])->name('create');
    Route::post('/', [FormBuilderController::class, 'store'])->name('store');
    Route::get('/{form}/edit', [FormBuilderController::class, 'edit'])->name('edit');
    Route::put('/{form}', [FormBuilderController::class, 'update'])->name('update');
    Route::post('/{form}/publish', [FormBuilderController::class, 'publish'])->name('publish');
    Route::post('/{form}/archive', [FormBuilderController::class, 'archive'])->name('archive');
    Route::delete('/{form}', [FormBuilderController::class, 'destroy'])->name('destroy');
    Route::post('/{form}/duplicate', [FormBuilderController::class, 'duplicate'])->name('duplicate');
    Route::get('/{form}/export', [FormBuilderController::class, 'export'])->name('export');
    Route::post('/import', [FormBuilderController::class, 'import'])->name('import');
});

// Form Submission Routes - All authenticated users
Route::prefix('forms')->group(function () {
    Route::get('/{form}', [FormSubmissionController::class, 'show'])->name('forms.show');
    Route::post('/{form}', [FormSubmissionController::class, 'store'])->name('forms.store');
    Route::get('/{form}/submissions', [FormSubmissionController::class, 'index'])->name('forms.submissions');
    Route::get('/submissions/{submission}', [FormSubmissionController::class, 'view'])->name('submissions.view');
    Route::put('/submissions/{submission}/status', [FormSubmissionController::class, 'updateStatus'])->name('submissions.update-status');
});

});
