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
        Schema::create('pesticides', function (Blueprint $table) {
            $table->id();
            $table->string('brand_name');
            $table->string('active_ingredient');
            $table->string('mode_of_action');
            $table->string('type_of_pesticide');
            $table->string('unit');
            $table->date('received_date');
            $table->date('production_date');
            $table->date('expiry_date');
            $table->string('source_of_fund');
            $table->decimal('quantity', 10, 2);
            $table->decimal('stock', 10, 2)->default(0);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pesticides');
    }
};
