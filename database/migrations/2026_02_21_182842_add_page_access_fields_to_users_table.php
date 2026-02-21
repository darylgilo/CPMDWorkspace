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
            $table->boolean('can_access_noticeboard')->default(true);
            $table->boolean('can_access_writing_suite')->default(true);
            $table->boolean('can_access_management')->default(true);
            $table->boolean('can_access_inventory')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['can_access_noticeboard', 'can_access_writing_suite', 'can_access_management', 'can_access_inventory']);
        });
    }
};
