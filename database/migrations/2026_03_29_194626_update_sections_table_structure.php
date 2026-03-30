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
        // Drop the existing sections table and recreate with proper structure
        Schema::dropIfExists('sections');
        
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
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
            ]);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
            
            
            $table->index(['office', 'is_active']);
        });

        
        // Update users table to reference section
        if (!Schema::hasColumn('users', 'section_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('section_id')->nullable()->after('office');
                $table->foreign('section_id')->references('id')->on('sections')->onDelete('set null');
            });
        }

        // Drop the old cpmd enum field if it exists
        if (Schema::hasColumn('users', 'cpmd')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('cpmd');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sections');
        
        // Restore the old cpmd enum field
        if (Schema::hasColumn('users', 'section_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
                
                $table->enum('cpmd', ['Office of the Chief','OC-Admin Support Unit','OC-Special Project Unit','OC-ICT Unit','BIOCON Section','PFS Section','PHPS Section','Others'])->default('Others');
            });
        }
    }
};
