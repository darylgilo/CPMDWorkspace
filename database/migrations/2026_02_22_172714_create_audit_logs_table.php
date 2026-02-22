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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('module'); // e.g., 'Budget Management'
            $table->string('action'); // e.g., 'Added', 'Updated', 'Deleted'
            $table->string('model_type')->nullable(); // e.g., 'App\Models\Fund'
            $table->unsignedBigInteger('model_id')->nullable();
            $table->text('details'); // e.g., 'Updated Fund: General Fund - Amount changed from 100 to 150'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
