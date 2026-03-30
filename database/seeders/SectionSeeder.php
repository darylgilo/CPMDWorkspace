<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // CPMD Sections
        $cpmdSections = [
            ['name' => 'Office of the Chief', 'code' => 'OC_CHIEF', 'office' => 'CPMD', 'display_order' => 1],
            ['name' => 'OC-Admin Support Unit', 'code' => 'OC_ADMIN', 'office' => 'CPMD', 'display_order' => 2],
            ['name' => 'OC-Special Project Unit', 'code' => 'OC_SPU', 'office' => 'CPMD', 'display_order' => 3],
            ['name' => 'OC-ICT Unit', 'code' => 'OC_ICT', 'office' => 'CPMD', 'display_order' => 4],
            ['name' => 'BIOCON Section', 'code' => 'BIOCON', 'office' => 'CPMD', 'display_order' => 5],
            ['name' => 'PFS Section', 'code' => 'PFS', 'office' => 'CPMD', 'display_order' => 6],
            ['name' => 'PHPS Section', 'code' => 'PHPS', 'office' => 'CPMD', 'display_order' => 7],
        ];

        // DO Sections
        $doSections = [
            ['name' => 'DO Main Office', 'code' => 'DO_MAIN', 'office' => 'DO', 'display_order' => 1],
            ['name' => 'DO Support Unit', 'code' => 'DO_SUPPORT', 'office' => 'DO', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'DO_OTHERS', 'office' => 'DO', 'display_order' => 3],
        ];

        // ADO RDPSS Sections
        $adoRdpssSections = [
            ['name' => 'ADO RDPSS Main', 'code' => 'RDPSS_MAIN', 'office' => 'ADO RDPSS', 'display_order' => 1],
            ['name' => 'ADO RDPSS Support', 'code' => 'RDPSS_SUPPORT', 'office' => 'ADO RDPSS', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'RDPSS_OTHERS', 'office' => 'ADO RDPSS', 'display_order' => 3],
        ];

        // ADO RS Sections
        $adoRsSections = [
            ['name' => 'ADO RS Main', 'code' => 'RS_MAIN', 'office' => 'ADO RS', 'display_order' => 1],
            ['name' => 'ADO RS Support', 'code' => 'RS_SUPPORT', 'office' => 'ADO RS', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'RS_OTHERS', 'office' => 'ADO RS', 'display_order' => 3],
        ];

        // PMO Sections
        $pmoSections = [
            ['name' => 'PMO Main Office', 'code' => 'PMO_MAIN', 'office' => 'PMO', 'display_order' => 1],
            ['name' => 'PMO Project Unit', 'code' => 'PMO_PROJECT', 'office' => 'PMO', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'PMO_OTHERS', 'office' => 'PMO', 'display_order' => 3],
        ];

        // BIOTECH Sections
        $biotechSections = [
            ['name' => 'Head office', 'code' => 'BIOTECH_HEAD', 'office' => 'BIOTECH', 'display_order' => 1],
            ['name' => 'Technical support', 'code' => 'BIOTECH_TECH', 'office' => 'BIOTECH', 'display_order' => 2],
            ['name' => 'Administrative support', 'code' => 'BIOTECH_ADMIN', 'office' => 'BIOTECH', 'display_order' => 3],
            ['name' => 'Others', 'code' => 'BIOTECH_OTHERS', 'office' => 'BIOTECH', 'display_order' => 4],
        ];

        // NSIC Sections
        $nsicSections = [
            ['name' => 'NSIC Main Office', 'code' => 'NSIC_MAIN', 'office' => 'NSIC', 'display_order' => 1],
            ['name' => 'NSIC Operations', 'code' => 'NSIC_OPERATIONS', 'office' => 'NSIC', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'NSIC_OTHERS', 'office' => 'NSIC', 'display_order' => 3],
        ];

        // ADMINISTRATIVE Sections
        $administrativeSections = [
            ['name' => 'Human Resource Section', 'code' => 'ADMIN_HR', 'office' => 'ADMINISTRATIVE', 'display_order' => 1],
            ['name' => 'Budget Section', 'code' => 'ADMIN_BUDGET', 'office' => 'ADMINISTRATIVE', 'display_order' => 2],
            ['name' => 'General Services Section', 'code' => 'ADMIN_GS', 'office' => 'ADMINISTRATIVE', 'display_order' => 3],
            ['name' => 'Accounting Section', 'code' => 'ADMIN_ACCOUNTING', 'office' => 'ADMINISTRATIVE', 'display_order' => 4],
            ['name' => 'Information and Computer Section', 'code' => 'ADMIN_ICS', 'office' => 'ADMINISTRATIVE', 'display_order' => 5],
            ['name' => 'Cashier Section', 'code' => 'ADMIN_CASHIER', 'office' => 'ADMINISTRATIVE', 'display_order' => 6],
            ['name' => 'Property and Supply Section', 'code' => 'ADMIN_PS', 'office' => 'ADMINISTRATIVE', 'display_order' => 7],
            ['name' => 'Record Section', 'code' => 'ADMIN_RECORD', 'office' => 'ADMINISTRATIVE', 'display_order' => 8],
            ['name' => 'Others', 'code' => 'ADMIN_OTHERS', 'office' => 'ADMINISTRATIVE', 'display_order' => 9],
        ];

        // CRPSD Sections
        $crpsdSections = [
            ['name' => 'CRPSD Main', 'code' => 'CRPSD_MAIN', 'office' => 'CRPSD', 'display_order' => 1],
            ['name' => 'CRPSD Field Operations', 'code' => 'CRPSD_FIELD', 'office' => 'CRPSD', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'CRPSD_OTHERS', 'office' => 'CRPSD', 'display_order' => 3],
        ];

        // AED Sections
        $aedSections = [
            ['name' => 'AED Main Office', 'code' => 'AED_MAIN', 'office' => 'AED', 'display_order' => 1],
            ['name' => 'AED Extension Services', 'code' => 'AED_EXTENSION', 'office' => 'AED', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'AED_OTHERS', 'office' => 'AED', 'display_order' => 3],
        ];

        // PPSSD Sections
        $ppssdSections = [
            ['name' => 'PPSSD Main', 'code' => 'PPSSD_MAIN', 'office' => 'PPSSD', 'display_order' => 1],
            ['name' => 'PPSSD Plant Services', 'code' => 'PPSSD_PLANT', 'office' => 'PPSSD', 'display_order' => 2],
            ['name' => 'Others', 'code' => 'PPSSD_OTHERS', 'office' => 'PPSSD', 'display_order' => 3],
        ];

        // NPQSD Sections
        $npqsdSections = [
            ['name' => 'Office of the Chief', 'code' => 'NPQSD_CHIEF', 'office' => 'NPQSD', 'display_order' => 1],
            ['name' => 'Import', 'code' => 'NPQSD_IMPORT', 'office' => 'NPQSD', 'display_order' => 2],
            ['name' => 'Export', 'code' => 'NPQSD_EXPORT', 'office' => 'NPQSD', 'display_order' => 3],
            ['name' => 'Domestic', 'code' => 'NPQSD_DOMESTIC', 'office' => 'NPQSD', 'display_order' => 4],
            ['name' => 'Administrative', 'code' => 'NPQSD_ADMIN', 'office' => 'NPQSD', 'display_order' => 5],
            ['name' => 'Others', 'code' => 'NPQSD_OTHERS', 'office' => 'NPQSD', 'display_order' => 6],
        ];

        // NSQCS Sections
        $nsqcsSections = [
            ['name' => 'Office of the chief', 'code' => 'NSQCS_CHIEF', 'office' => 'NSQCS', 'display_order' => 1],
            ['name' => 'Support services', 'code' => 'NSQCS_SUPPORT', 'office' => 'NSQCS', 'display_order' => 2],
            ['name' => 'Seed certification', 'code' => 'NSQCS_CERT', 'office' => 'NSQCS', 'display_order' => 3],
            ['name' => 'Seed testing', 'code' => 'NSQCS_TESTING', 'office' => 'NSQCS', 'display_order' => 4],
            ['name' => 'Plant Material Certification', 'code' => 'NSQCS_PLANT', 'office' => 'NSQCS', 'display_order' => 5],
            ['name' => 'Others', 'code' => 'NSQCS_OTHERS', 'office' => 'NSQCS', 'display_order' => 6],
        ];

        // BPI Center Sections (generic for all centers)
        $bpiCenterSections = [
            ['name' => 'Center Head Office', 'code' => 'BPI_HEAD', 'office' => 'Baguio BPI center', 'display_order' => 1],
            ['name' => 'Research Division', 'code' => 'BPI_RESEARCH', 'office' => 'Baguio BPI center', 'display_order' => 2],
            ['name' => 'Production Division', 'code' => 'BPI_PRODUCTION', 'office' => 'Baguio BPI center', 'display_order' => 3],
            ['name' => 'Quality Control Section', 'code' => 'BPI_QC', 'office' => 'Baguio BPI center', 'display_order' => 4],
        ];

        // Insert all sections
        $allSections = array_merge(
            $cpmdSections,
            $doSections,
            $adoRdpssSections,
            $adoRsSections,
            $pmoSections,
            $biotechSections,
            $nsicSections,
            $administrativeSections,
            $crpsdSections,
            $aedSections,
            $ppssdSections,
            $npqsdSections,
            $nsqcsSections,
            $bpiCenterSections
        );

        foreach ($allSections as $section) {
            \App\Models\Section::create($section);
        }

        // Create BPI center sections for other centers
        $bpiCenters = [
            'Davao BPI center',
            'Guimaras BPI center', 
            'La Granja BPI center',
            'Los Baños BPI center'
        ];

        foreach ($bpiCenters as $center) {
            foreach ($bpiCenterSections as $section) {
                \App\Models\Section::create([
                    'name' => $section['name'],
                    'code' => $section['code'] . '_' . strtoupper(str_replace(' ', '_', $center)),
                    'office' => $center,
                    'display_order' => $section['display_order']
                ]);
            }
        }
    }
}
