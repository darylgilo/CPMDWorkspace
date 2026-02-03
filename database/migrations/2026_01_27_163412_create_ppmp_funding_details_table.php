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
        Schema::create('ppmp_funding_details', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to ppmp_projects table
            $table->foreignId('ppmp_project_id')->constrained()->onDelete('cascade');
            
            // Group 2: Quantity and Size, Mode of Procurement, Pre-Procurement, Source of Funds, Budget, Documents, Remarks
            $table->string('quantity_size'); // Column 3: Quantity and Size
            $table->string('mode_of_procurement')->nullable(); // Column 4: Mode of Procurement
            $table->enum('pre_procurement_conference', ['Yes', 'No'])->default('No'); // Column 5: Pre-Procurement Conference
            $table->decimal('estimated_budget', 15, 2); // Column 10: Estimated Budget
            $table->string('supporting_documents')->default('Market Scoping, Technical Specifications'); // Column 11: Supporting Documents
            $table->text('remarks')->nullable(); // Column 12: Remarks
            
            $table->timestamps();
            
            // Indexes
            $table->index('ppmp_project_id');
            $table->index('estimated_budget');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppmp_funding_details');
    }
};
