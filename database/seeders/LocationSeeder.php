<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::disableQueryLog();
        Schema::disableForeignKeyConstraints();

        $this->command->info('Seeding Regions...');
        $this->seedRegions();
        
        $this->command->info('Seeding Provinces...');
        $this->seedProvinces();
        
        $this->command->info('Seeding Municipalities...');
        $this->seedMunicipalities();
        
        $this->command->info('Seeding Barangays...');
        $this->seedBarangays();

        Schema::enableForeignKeyConstraints();
    }

    private function parseCsv($filename)
    {
        $path = public_path('csv/' . $filename);
        if (!File::exists($path)) {
            $this->command->warn("File not found: $path");
            return [];
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $header = str_getcsv(array_shift($lines));
        // Clean headers (sometimes BOM issues occur)
        $header = array_map(function($h) { return trim($h, "\"\r\n\xEF\xBB\xBF"); }, $header);

        $data = [];
        foreach ($lines as $line) {
            $row = str_getcsv($line);
            if (count($row) === count($header)) {
                $data[] = array_combine($header, $row);
            }
        }
        return $data;
    }

    private function chunkInsert($table, $data) {
        $data = collect($data)->unique('id')->toArray();
        foreach (array_chunk($data, 1000) as $chunk) {
            try {
                // Use insert instead of upsert for initial seeding
                DB::table($table)->insert($chunk);
            } catch (\Exception $e) {
                // If insert fails due to duplicate keys, try upsert
                try {
                    DB::table($table)->upsert($chunk, ['id'], ['name', 'updated_at']);
                } catch (\Exception $e2) {
                    // Log error when both fail
                    if ($this->command) {
                        $this->command->error("Error inserting into $table: " . $e2->getMessage());
                    } else {
                        \Log::error("Error inserting into $table: " . $e2->getMessage());
                    }
                }
            }
        }
    }

    private function seedRegions()
    {
        $rows = $this->parseCsv('PH_Adm1_Regions.csv');
        $insert = [];
        foreach ($rows as $row) {
            $insert[] = [
                'id' => $row['adm1_psgc'],
                'name' => $row['adm1_en'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        $this->chunkInsert('regions', $insert);
    }

    private function seedProvinces()
    {
        $rows = $this->parseCsv('PH_Adm2_ProvDists.csv');
        $insert = [];
        foreach ($rows as $row) {
            // Skip entries that are not provinces (like NCR districts)
            if ($row['geo_level'] !== 'Prov') {
                continue;
            }
            
            $insert[] = [
                'id' => $row['adm2_psgc'],
                'name' => $row['adm2_en'],
                'region_id' => $row['adm1_psgc'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        $this->chunkInsert('provinces', $insert);
    }

    private function seedMunicipalities()
    {
        $rows = $this->parseCsv('PH_Adm3_MuniCities.csv');
        $insert = [];
        foreach ($rows as $row) {
            // Skip if province doesn't exist
            if (!DB::table('provinces')->where('id', $row['adm2_psgc'])->exists()) {
                $this->command->warn("Skipping municipality {$row['adm3_en']} - Province ID {$row['adm2_psgc']} not found");
                continue;
            }
            
            $insert[] = [
                'id' => $row['adm3_psgc'],
                'name' => mb_convert_encoding($row['adm3_en'], 'UTF-8', 'UTF-8'),
                'province_id' => $row['adm2_psgc'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        $this->chunkInsert('municipalities', $insert);
    }

    private function seedBarangays()
    {
        $rows = $this->parseCsv('PH_Adm4_BgySubMuns.csv');
        $insert = [];
        foreach ($rows as $row) {
            // Skip if municipality doesn't exist
            if (!DB::table('municipalities')->where('id', $row['adm3_psgc'])->exists()) {
                $this->command->warn("Skipping barangay {$row['adm4_en']} - Municipality ID {$row['adm3_psgc']} not found");
                continue;
            }
            
            $insert[] = [
                'id' => $row['adm4_psgc'],
                'name' => mb_convert_encoding($row['adm4_en'], 'UTF-8', 'UTF-8'),
                'municipality_id' => $row['adm3_psgc'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        $this->chunkInsert('barangays', $insert);
    }
}
