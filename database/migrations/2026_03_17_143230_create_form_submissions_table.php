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
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Submitting user
            $table->string('submitter_name')->nullable(); // For non-authenticated submissions
            $table->string('submitter_email')->nullable();
            $table->string('status')->default('submitted'); // submitted, reviewed, approved, rejected
            $table->enum('priority', ['urgent', 'high', 'medium', 'low'])->default('medium');
            $table->json('assignees')->nullable(); // For multiple assignees
            $table->text('notes')->nullable(); // Admin notes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};
