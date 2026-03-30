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
            $table->enum('role', [
                'user',
                'admin', 
                'superadmin',
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
                'ICS',
                'HR',
                'Others'
            ])->default('user')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['user','admin','superadmin','BIOCON','PFS','PHPS'])->default('user')->change();
        });
    }
};
