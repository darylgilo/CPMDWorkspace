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
        Schema::create('regions', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // Use REGION_ID from CSV
            $table->string('name'); // REGION from CSV
            $table->timestamps();
        });

        Schema::create('provinces', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // Use PROVINCE_ID from CSV
            $table->string('name'); // PROVINCE from CSV
            $table->foreignId('region_id')->constrained('regions')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('municipalities', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // Use MUNICIPALITY_ID from CSV
            $table->string('name'); // MUNICIPALITY from CSV
            $table->foreignId('province_id')->constrained('provinces')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('barangays', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // Use BARANGAY_ID from CSV
            $table->string('name'); // BARANGAY from CSV
            $table->foreignId('municipality_id')->constrained('municipalities')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barangays');
        Schema::dropIfExists('municipalities');
        Schema::dropIfExists('provinces');
        Schema::dropIfExists('regions');
    }
};
