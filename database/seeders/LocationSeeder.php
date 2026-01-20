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
            // Include all entries (both provinces and districts)
            if (!in_array($row['geo_level'], ['Prov', 'Dist'])) {
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
        
        // List of independent component cities (use their own ID as province_id)
        $independentCities = [
            '330100000',  // City of Angeles
            '331400000',  // City of Olongapo
            '431200000',  // City of Lucena
            '630200000',  // City of Bacolod
            '631000000',  // City of Iloilo
            '730600000',  // City of Cebu
            '731100000',  // City of Lapu-Lapu
            '731300000',  // City of Mandaue
            '831600000',  // City of Tacloban
            '931700000',  // City of Zamboanga
            '1030500000', // City of Cagayan De Oro
            '1030900000', // City of Iligan
            '1130700000', // City of Davao
            '1230800000', // City of General Santos
            '1430300000', // City of Baguio
            '1630400000', // City of Butuan
            '1731500000', // City of Puerto Princesa
        ];
        
        foreach ($rows as $row) {
            // Include both municipalities and cities
            if (!in_array($row['geo_level'], ['Mun', 'City'])) {
                continue;
            }
            
            $provinceId = $row['adm2_psgc'];
            
            // For independent component cities, use their own ID as province_id
            if (in_array($row['adm3_psgc'], $independentCities)) {
                $provinceId = $row['adm3_psgc'];
            }
            
            // Skip if province doesn't exist (except for independent cities)
            if (!in_array($row['adm3_psgc'], $independentCities) && !DB::table('provinces')->where('id', $provinceId)->exists()) {
                $this->command->warn("Skipping municipality {$row['adm3_en']} - Province ID $provinceId not found");
                continue;
            }
            
            $insert[] = [
                'id' => $row['adm3_psgc'],
                'name' => mb_convert_encoding($row['adm3_en'], 'UTF-8', 'UTF-8'),
                'province_id' => $provinceId,
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
        
        // Mapping for incorrect municipality IDs in barangays CSV
        $municipalityMapping = [
            '1380610000' => '1381200000', // City of Pasig
            '1380611000' => '1381300000', // Quezon City  
            '1380612000' => '1380600000', // City of Manila
            '1380613000' => '1380700000', // City of Marikina  
            '1380614000' => '1380800000', // City of Muntinlupa
            // All Manila variations should map to City of Manila
            '1380601000' => '1380600000', // City of Manila
            '1380602000' => '1380600000', // City of Manila
            '1380603000' => '1380600000', // City of Manila
            '1380604000' => '1380600000', // City of Manila
            '1380605000' => '1380600000', // City of Manila
            '1380606000' => '1380600000', // City of Manila
            '1380607000' => '1380600000', // City of Manila
            '1380608000' => '1380600000', // City of Manila
            '1380609000' => '1380600000', // City of Manila
        ];
        
        foreach ($rows as $row) {
            // Include only barangays, skip sub-municipalities
            if ($row['geo_level'] !== 'Bgy') {
                continue;
            }
            
            // Map incorrect municipality IDs to correct ones
            $municipalityId = $row['adm3_psgc'];
            if (isset($municipalityMapping[$municipalityId])) {
                $municipalityId = $municipalityMapping[$municipalityId];
            }
            
            // Skip if municipality ID is null or 0
            if (!$municipalityId || $municipalityId === '0') {
                $this->command->warn("Skipping barangay {$row['adm4_en']} - Invalid Municipality ID {$row['adm3_psgc']}");
                continue;
            }
            
            // Skip if municipality doesn't exist
            if (!DB::table('municipalities')->where('id', $municipalityId)->exists()) {
                $this->command->warn("Skipping barangay {$row['adm4_en']} - Municipality ID $municipalityId not found");
                continue;
            }
            
            $insert[] = [
                'id' => $row['adm4_psgc'],
                'name' => mb_convert_encoding($row['adm4_en'], 'UTF-8', 'UTF-8'),
                'municipality_id' => $municipalityId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        $this->chunkInsert('barangays', $insert);
    }
}
