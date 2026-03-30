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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('office', [
                'DO',
                'ADO RDPSS', 
                'ADO RS',
                'PMO',
                'BIOTECH',
                'NSIC',
                'ADMINISTRATIVE',
                'CPMD',
                'CRPSD',
                'AED',
                'PPSSD',
                'NPQSD',
                'NSQCS',
                'Baguio BPI center',
                'Davao BPI center',
                'Guimaras BPI center',
                'La Granja BPI center',
                'Los Baños BPI center',
                'Others'
            ])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('office', [
                'DO',
                'ADO RDPSS', 
                'ADO RS',
                'PMO',
                'BIOTECH',
                'NSIC',
                'ADMINISTRATIVE',
                'CPMD',
                'CRPSD',
                'AED',
                'PPSSD',
                'NPQSD',
                'NSQCS',
                'Others'
            ])->change();
        });
    }
};
