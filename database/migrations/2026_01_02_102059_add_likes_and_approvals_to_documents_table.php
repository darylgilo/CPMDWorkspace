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
        Schema::table('documents', function (Blueprint $table) {
            $table->integer('likes_count')->default(0)->after('status');
            $table->integer('approvals_count')->default(0)->after('likes_count');
            $table->timestamp('approved_at')->nullable()->after('approvals_count');
            $table->foreignId('approved_by')->nullable()->constrained('users')->after('approved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['likes_count', 'approvals_count', 'approved_at', 'approved_by']);
        });
    }
};
