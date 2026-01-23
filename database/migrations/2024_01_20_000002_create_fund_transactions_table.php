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
        Schema::create('fund_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fund_id')->constrained()->onDelete('cascade');
            $table->string('doctrack_no');
            $table->string('pr_no');
            $table->text('specific_items');
            $table->string('category');
            $table->decimal('amount_pr', 15, 2);
            $table->string('resolution_no');
            $table->string('supplier');
            $table->string('po_no');
            $table->decimal('amount_po', 15, 2);
            $table->decimal('balance', 15, 2);
            $table->date('delivery_date')->nullable();
            $table->string('dv_no')->nullable();
            $table->decimal('amount_dv', 15, 2)->nullable();
            $table->date('payment_date')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['fund_id', 'doctrack_no']);
            $table->index('pr_no');
            $table->index('po_no');
            $table->index('delivery_date');
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_transactions');
    }
};
