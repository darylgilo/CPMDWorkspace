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
        Schema::create('ppmp_timelines', function (Blueprint $table) {
            $table->id();
            
            // Foreign keys to both ppmp_projects and ppmp_funding_details tables
            $table->foreignId('ppmp_project_id')->constrained()->onDelete('cascade');
            $table->foreignId('ppmp_funding_detail_id')->constrained()->onDelete('cascade');
            
            // Group 3: Timeline information
            $table->string('start_procurement'); // Column 6: Start of Procurement (MM/YYYY)
            $table->string('end_procurement'); // Column 7: End of Procurement (MM/YYYY)
            $table->string('delivery_period'); // Column 8: Expected Delivery/Implementation Period
            
            $table->timestamps();
            
            // Indexes
            $table->index('ppmp_project_id');
            $table->index('ppmp_funding_detail_id');
            $table->index('start_procurement');
            $table->index('end_procurement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppmp_timelines');
    }
};
