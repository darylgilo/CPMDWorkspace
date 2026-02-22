<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['not_started', 'in_progress', 'in_review', 'completed', 'cancelled'])->default('not_started');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->integer('progress')->default(0); // 0-100
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->json('assignees')->nullable(); // array of user IDs
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
