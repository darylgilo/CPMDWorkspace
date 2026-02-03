<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('travel_expenses', function (Blueprint $table) {
            $table->id();
            $table->string('doctrack_no')->unique();
            $table->string('name');
            $table->date('date_of_travel');
            $table->string('destination');
            $table->text('purpose');
            $table->foreignId('fund_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('ppmp_project_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('ppmp_funding_detail_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Indexes
            $table->index(['fund_id', 'ppmp_project_id']);
            $table->index('ppmp_funding_detail_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('travel_expenses');
    }
};
