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
        Schema::table('tasks', function (Blueprint $table) {
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
            ])->nullable()->after('assignees');
            
            $table->foreignId('section_id')->nullable()->after('office')->constrained('sections')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropColumn(['office', 'section_id']);
        });
    }
};
