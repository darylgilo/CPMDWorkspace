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
        Schema::create('ppmp_projects', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to funds table (Source of Funds)
            $table->foreignId('fund_id')->constrained()->onDelete('cascade');
            
            // Group 1: General Description and Type of Project
            $table->text('general_description'); // Column 1: General Description and Objective
            $table->enum('project_type', ['Goods', 'Infrastructure', 'Consulting Services']); // Column 2: Type of Project
            
            // User tracking
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Indexes
            $table->index(['fund_id', 'project_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppmp_projects');
    }
};
