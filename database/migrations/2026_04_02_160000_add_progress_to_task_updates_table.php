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
        Schema::table('task_updates', function (Blueprint $table) {
            $table->unsignedTinyInteger('progress')->nullable()->after('description')->comment('Progress percentage at the time of this update');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_updates', function (Blueprint $table) {
            $table->dropColumn('progress');
        });
    }
};
