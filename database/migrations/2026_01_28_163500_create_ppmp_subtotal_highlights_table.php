<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ppmp_subtotal_highlights', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to ppmp_projects table
            $table->foreignId('ppmp_project_id')->constrained()->onDelete('cascade');
            
            // Status of the subtotal (FINAL or INDICATIVE)
            $table->enum('status', ['FINAL', 'INDICATIVE'])->default('INDICATIVE');
            
            // User who created the highlight (for tracking purposes)
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->timestamps();
            
            // Indexes
            $table->index('ppmp_project_id');
            $table->index('status');
            $table->index('user_id');
            
            // Unique constraint to prevent duplicate highlights per project
            $table->unique(['ppmp_project_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppmp_subtotal_highlights');
    }
};
