// PSGC Code to Region Name Mapping
export const PSGC_TO_REGION: { [key: string]: string } = {
    '100000000': 'Region I (Ilocos Region)',
    '200000000': 'Region II (Cagayan Valley)',
    '300000000': 'Region III (Central Luzon)',
    '400000000': 'Region IV-A (CALABARZON)',
    '500000000': 'Region V (Bicol Region)',
    '600000000': 'Region VI (Western Visayas)',
    '700000000': 'Region VII (Central Visayas)',
    '800000000': 'Region VIII (Eastern Visayas)',
    '900000000': 'Region IX (Zamboanga Peninsula)',
    '1000000000': 'Region X (Northern Mindanao)',
    '1100000000': 'Region XI (Davao Region)',
    '1200000000': 'Region XII (SOCCSKSARGEN)',
    '1300000000': 'National Capital Region (NCR)',
    '1400000000': 'Cordillera Administrative Region (CAR)',
    '1700000000': 'MIMAROPA Region',
    '1600000000': 'Region XIII (Caraga)',
    '1900000000': 'Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)',
};

// Region Name to PSGC Code Mapping (reverse lookup)
export const REGION_TO_PSGC: { [key: string]: string } = {};
Object.entries(PSGC_TO_REGION).forEach(([psgc, region]) => {
    REGION_TO_PSGC[region] = psgc;
});

// Function to get region name from PSGC code
export function getRegionFromPSGC(psgc: string): string {
    // Handle both 9-digit and 10-digit PSGC codes
    let regionPsgc: string;

    if (psgc.length === 10) {
        // 10-digit format: first digit + 9 zeros (e.g., 1000000000)
        regionPsgc = psgc.substring(0, 1) + '000000000';
    } else {
        // 9-digit format: first 2 digits + 7 zeros (e.g., 100000000)
        regionPsgc = psgc.substring(0, 2) + '0000000';
    }

    return PSGC_TO_REGION[regionPsgc] || 'Unknown';
}

// Function to get PSGC code from region name
export function getPSGCFromRegion(region: string): string {
    return REGION_TO_PSGC[region] || '';
}

// Function to get all available region files for a specific region
export function getRegionFilesForRegion(region: string): string[] {
    const regionPsgc = getPSGCFromRegion(region);
    if (!regionPsgc) return [];

    // Return the province/district files for this region
    return [`provdists-region-${regionPsgc}.0.01.json`];
}
