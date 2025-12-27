import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';
import { AdministrativeLevel, Resolution } from './philippineBoundaries';
import {
    getPSGCFromRegion,
    getRegionFilesForRegion,
    getRegionFromPSGC,
} from './regionMapping';

export interface BoundaryFileInfo {
    path: string;
    isTopoJSON: boolean;
    level: AdministrativeLevel;
    resolution: Resolution;
}

export class BoundaryDataLoader {
    private static readonly BASE_PATH = '/map/2023';

    static getBoundaryFilePath(
        level: AdministrativeLevel,
        resolution: Resolution,
        selectedRegion?: string,
    ): BoundaryFileInfo {
        const resolutionPath = this.getResolutionPath(resolution);
        let path = '';
        let isTopoJSON = true;

        switch (level) {
            case 'country':
                path = `${this.BASE_PATH}/topojson/country/${resolutionPath}/country.topo.0.01.json`;
                isTopoJSON = true;
                break;

            case 'region':
                // Use specific region file if selected, otherwise use default
                if (selectedRegion) {
                    const regionFiles = getRegionFilesForRegion(selectedRegion);
                    if (regionFiles.length > 0) {
                        path = `${this.BASE_PATH}/geojson/regions/${resolutionPath}/${regionFiles[0]}`;
                        isTopoJSON = false;
                        break;
                    }
                }
                // Fallback to default region file
                path = `${this.BASE_PATH}/geojson/regions/${resolutionPath}/provdists-region-1000000000.0.01.json`;
                isTopoJSON = false;
                break;

            case 'province':
                // Use a representative province file (can be extended to load multiple provinces)
                path = `${this.BASE_PATH}/topojson/provdists/${resolutionPath}/municities-provdist-1001300000.topo.0.01.json`;
                isTopoJSON = true;
                break;

            case 'municipality':
                // Use municipality TopoJSON files
                path = `${this.BASE_PATH}/topojson/municities/${resolutionPath}/bgysubmuns-municity-1001301000.topo.0.01.json`;
                isTopoJSON = true;
                break;

            case 'barangay':
                // Use municipality files for barangay level (contains barangay subdivisions)
                path = `${this.BASE_PATH}/topojson/municities/${resolutionPath}/bgysubmuns-municity-1001301000.topo.0.01.json`;
                isTopoJSON = true;
                break;

            default:
                // Fallback to regions
                path = `${this.BASE_PATH}/geojson/regions/${resolutionPath}/provdists-region-1000000000.0.01.json`;
                isTopoJSON = false;
        }

        return { path, isTopoJSON, level, resolution };
    }

    static async loadBoundaryData(
        level: AdministrativeLevel,
        resolution: Resolution,
        selectedRegion?: string,
        choroplethData?: { [key: string]: number },
    ): Promise<GeoJSON.FeatureCollection> {
        if (level === 'region') {
            // Load all regions for better visibility, filtered by data availability
            return this.loadAllRegions(
                resolution,
                selectedRegion,
                choroplethData,
            );
        }

        if (level === 'province') {
            // Build province features from all region files and attach values per province
            return this.loadAllProvincesFromRegions(
                resolution,
                selectedRegion,
                choroplethData,
            );
        }

        if (level === 'municipality') {
            // Load municipalities grouped by province, but include only those with data
            return this.loadAllMunicipalitiesFromProvinces(
                resolution,
                selectedRegion,
                choroplethData,
            );
        }

        const fileInfo = this.getBoundaryFilePath(
            level,
            resolution,
            selectedRegion,
        );

        try {
            console.log(`Loading boundary data from: ${fileInfo.path}`);

            const response = await fetch(fileInfo.path);
            if (!response.ok) {
                throw new Error(
                    `Failed to load boundary data: ${response.statusText}`,
                );
            }

            const data = await response.json();
            let geoJsonData: GeoJSON.FeatureCollection = data;

            // Convert TopoJSON to GeoJSON if needed
            if (fileInfo.isTopoJSON && data.type === 'Topology') {
                try {
                    const topoData = data as Topology;
                    const objectKey = Object.keys(topoData.objects)[0];
                    geoJsonData = feature(
                        topoData,
                        topoData.objects[objectKey],
                    ) as GeoJSON.FeatureCollection;
                    console.log(
                        `Converted TopoJSON to GeoJSON: ${objectKey}, ${geoJsonData.features?.length || 0} features`,
                    );
                } catch (error) {
                    console.error(
                        'Error converting TopoJSON to GeoJSON:',
                        error,
                    );
                    // Fallback to empty GeoJSON
                    geoJsonData = {
                        type: 'FeatureCollection',
                        features: [],
                    };
                }
            }

            // For non-region/province levels, we currently just attach region name if available
            if (geoJsonData.features) {
                geoJsonData.features = geoJsonData.features.map(
                    (feature: GeoJSON.Feature) => {
                        if (
                            feature.properties &&
                            feature.properties.adm1_psgc
                        ) {
                            const regionName = getRegionFromPSGC(
                                feature.properties.adm1_psgc.toString(),
                            );
                            return {
                                ...feature,
                                properties: {
                                    ...feature.properties,
                                    region: regionName,
                                },
                            };
                        }
                        return feature;
                    },
                );
            }

            return geoJsonData;
        } catch (error) {
            console.error(
                `Error loading boundary data for ${level} at ${resolution}:`,
                error,
            );
            // Return empty GeoJSON on error
            return {
                type: 'FeatureCollection',
                features: [],
            };
        }
    }

    // Minimal CSV parser for simple comma-separated values with optional quotes
    private static parseCSV(csvText: string): Record<string, string>[] {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];

        const headers = lines[0]
            .split(',')
            .map((h) => h.replace(/"/g, '').trim());

        const rows: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const values: string[] = [];
            let current = '';
            let insideQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const ch = line[j];
                if (ch === '"') {
                    insideQuotes = !insideQuotes;
                } else if (ch === ',' && !insideQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += ch;
                }
            }
            values.push(current.trim());

            const row: Record<string, string> = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            rows.push(row);
        }

        return rows;
    }

    static async loadMultipleBoundaryFiles(
        level: AdministrativeLevel,
        resolution: Resolution,
        regionCodes?: string[],
    ): Promise<GeoJSON.FeatureCollection> {
        if (level === 'region' && regionCodes && regionCodes.length > 0) {
            // Load multiple region files
            const resolutionPath = this.getResolutionPath(resolution);
            const promises = regionCodes.map(async (code) => {
                const path = `${this.BASE_PATH}/geojson/regions/${resolutionPath}/provdists-region-${code}.0.01.json`;
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        return await response.json();
                    }
                    return null;
                } catch (error) {
                    console.warn(`Failed to load region ${code}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const allFeatures: GeoJSON.Feature[] = [];

            results.forEach((result) => {
                if (result && result.features) {
                    allFeatures.push(...result.features);
                }
            });

            return {
                type: 'FeatureCollection',
                features: allFeatures,
            };
        }

        // For other levels, use the single file loader
        return this.loadBoundaryData(level, resolution);
    }

    private static getResolutionPath(resolution: Resolution): string {
        switch (resolution) {
            case 'low':
                return 'lowres';
            case 'high':
                return 'highres';
            case 'medium':
            default:
                return 'medres';
        }
    }

    static async loadAllRegions(
        resolution: Resolution,
        selectedRegion?: string,
        choroplethData?: { [key: string]: number },
    ): Promise<GeoJSON.FeatureCollection> {
        const resolutionPath = this.getResolutionPath(resolution);
        const regionsPath = `${this.BASE_PATH}/geojson/regions/${resolutionPath}`;

        // All PSGC codes for regions (based on actual CSV data)
        const regionPsgcCodes = [
            '100000000',
            '200000000',
            '300000000',
            '400000000',
            '500000000',
            '600000000',
            '700000000',
            '800000000',
            '900000000',
            '1000000000',
            '1100000000',
            '1200000000',
            '1300000000',
            '1400000000',
            '1600000000',
            '1700000000',
            '1900000000', // Added missing BARMM region
        ];

        try {
            const promises = regionPsgcCodes.map(async (psgc) => {
                const filename = `provdists-region-${psgc}.0.01.json`;
                const path = `${regionsPath}/${filename}`;

                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const data = await response.json();

                        // Add region names to feature properties and filter by data availability
                        if (data.features) {
                            data.features = data.features
                                .map((feature: GeoJSON.Feature) => {
                                    if (
                                        feature.properties &&
                                        feature.properties.adm1_psgc
                                    ) {
                                        const regionName = getRegionFromPSGC(
                                            feature.properties.adm1_psgc.toString(),
                                        );
                                        const hasData =
                                            choroplethData &&
                                            choroplethData[regionName] &&
                                            choroplethData[regionName] > 0;

                                        return {
                                            ...feature,
                                            properties: {
                                                ...feature.properties,
                                                name: regionName,
                                                region: regionName,
                                                isSelected:
                                                    regionName ===
                                                    selectedRegion,
                                                hasData: hasData,
                                                value:
                                                    hasData && choroplethData
                                                        ? choroplethData[
                                                              regionName
                                                          ] || 0
                                                        : 0,
                                            },
                                        };
                                    }
                                    return feature;
                                })
                                .filter((feature: GeoJSON.Feature) => {
                                    // Show all regions when "All Regions" is selected, but highlight those with data
                                    if (
                                        !selectedRegion ||
                                        selectedRegion === 'All Regions' ||
                                        selectedRegion === 'all'
                                    ) {
                                        return true; // Show all regions regardless of data
                                    }
                                    // When a specific region is selected, only show that region
                                    return (
                                        feature.properties &&
                                        feature.properties.isSelected === true
                                    );
                                });
                        }

                        return data;
                    }
                    console.warn(`Failed to load region file: ${filename}`);
                    return null;
                } catch (error) {
                    console.warn(`Error loading region ${psgc}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const allFeatures: GeoJSON.Feature[] = [];

            results.forEach((result) => {
                if (result && result.features) {
                    allFeatures.push(...result.features);
                }
            });

            console.log(
                `Loaded ${allFeatures.length} features from all regions`,
            );

            return {
                type: 'FeatureCollection',
                features: allFeatures,
            };
        } catch (error) {
            console.error('Error loading all regions:', error);
            return {
                type: 'FeatureCollection',
                features: [],
            };
        }
    }

    /**
     * Load all provinces by iterating all region GeoJSON files and treating each feature
     * as a province/district. Attach province name (adm2_en), region name and value/hasData
     * based on choroplethData keyed by province name.
     */
    static async loadAllProvincesFromRegions(
        resolution: Resolution,
        selectedRegion?: string,
        choroplethData?: { [key: string]: number },
    ): Promise<GeoJSON.FeatureCollection> {
        const resolutionPath = this.getResolutionPath(resolution);
        const regionsPath = `${this.BASE_PATH}/geojson/regions/${resolutionPath}`;

        const regionPsgcCodes = [
            '100000000',
            '200000000',
            '300000000',
            '400000000',
            '500000000',
            '600000000',
            '700000000',
            '800000000',
            '900000000',
            '1000000000',
            '1100000000',
            '1200000000',
            '1300000000',
            '1400000000',
            '1600000000',
            '1700000000',
            '1900000000',
        ];

        try {
            const promises = regionPsgcCodes.map(async (psgc) => {
                const filename = `provdists-region-${psgc}.0.01.json`;
                const path = `${regionsPath}/${filename}`;

                try {
                    const response = await fetch(path);
                    if (!response.ok) {
                        console.warn(
                            `Failed to load region file for provinces: ${filename}`,
                        );
                        return null;
                    }

                    const data = await response.json();
                    if (!data.features) return null;

                    data.features = data.features
                        .map((feature: GeoJSON.Feature) => {
                            if (
                                !feature.properties ||
                                !feature.properties.adm1_psgc ||
                                !feature.properties.adm2_en
                            ) {
                                return null;
                            }

                            const regionName = getRegionFromPSGC(
                                feature.properties.adm1_psgc.toString(),
                            );
                            const provinceName = feature.properties
                                .adm2_en as string;

                            if (!provinceName || provinceName === 'Unknown') {
                                return null;
                            }

                            const hasData = !!(
                                choroplethData &&
                                choroplethData[provinceName] &&
                                choroplethData[provinceName] > 0
                            );

                            // If a specific region is selected, skip provinces outside it
                            if (
                                selectedRegion &&
                                selectedRegion !== 'all' &&
                                selectedRegion !== 'All Regions' &&
                                regionName !== selectedRegion
                            ) {
                                return null;
                            }

                            return {
                                ...feature,
                                properties: {
                                    ...feature.properties,
                                    name: provinceName,
                                    region: regionName,
                                    province: provinceName,
                                    hasData,
                                    value:
                                        hasData && choroplethData
                                            ? choroplethData[provinceName] || 0
                                            : 0,
                                },
                            } as GeoJSON.Feature;
                        })
                        .filter((f: GeoJSON.Feature | null) => f !== null)
                        // Only keep provinces that actually have data
                        .filter(
                            (f: GeoJSON.Feature) =>
                                f.properties && f.properties.hasData === true,
                        );

                    return data;
                } catch (error) {
                    console.warn(
                        `Error loading provinces from region ${psgc}:`,
                        error,
                    );
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const allFeatures: GeoJSON.Feature[] = [];

            results.forEach((result) => {
                if (result && result.features) {
                    allFeatures.push(...result.features);
                }
            });

            return {
                type: 'FeatureCollection',
                features: allFeatures,
            };
        } catch (error) {
            console.error('Error loading all provinces from regions:', error);
            return {
                type: 'FeatureCollection',
                features: [],
            };
        }
    }

    /**
     * Load all municipalities by iterating province-level TopoJSON files and extracting
     * municipality (adm3_en) features. Attach region, province, municipality names and
     * value/hasData based on choroplethData keyed by municipality name.
     */
    static async loadAllMunicipalitiesFromProvinces(
        resolution: Resolution,
        selectedRegion?: string,
        choroplethData?: { [key: string]: number },
    ): Promise<GeoJSON.FeatureCollection> {
        try {
            const resolutionPath = this.getResolutionPath(resolution);
            const provdistsPath = `${this.BASE_PATH}/topojson/provdists/${resolutionPath}`;

            // Load province CSV to get list of all provinces and their PSGC codes
            const provincesRes = await fetch('/csv/PH_Adm2_ProvDists.csv');
            if (!provincesRes.ok) {
                throw new Error(
                    'Failed to load provinces CSV for municipalities',
                );
            }

            const provincesText = await provincesRes.text();

            type ProvinceRow = {
                adm1_psgc: string;
                adm2_psgc: string;
                adm2_en: string;
                geo_level: string;
            };

            const provinces = this.parseCSV(
                provincesText,
            ) as unknown as ProvinceRow[];

            // Filter only actual provinces
            let filteredProvinces = provinces.filter(
                (p) => p.geo_level === 'Prov' && p.adm2_psgc,
            );

            // If a specific region is selected, restrict provinces to that region
            if (
                selectedRegion &&
                selectedRegion !== 'all' &&
                selectedRegion !== 'All Regions'
            ) {
                const regionPsgc = getPSGCFromRegion(selectedRegion);
                if (regionPsgc) {
                    filteredProvinces = filteredProvinces.filter(
                        (p) => p.adm1_psgc === regionPsgc,
                    );
                }
            }

            const promises = filteredProvinces.map(async (province) => {
                const filename = `municities-provdist-${province.adm2_psgc}.topo.0.01.json`;
                const path = `${provdistsPath}/${filename}`;

                try {
                    const response = await fetch(path);
                    if (!response.ok) {
                        console.warn(
                            `Failed to load municipality file: ${filename}`,
                        );
                        return null;
                    }

                    const data = await response.json();
                    if (data.type !== 'Topology') {
                        return null;
                    }

                    const topoData = data as Topology;
                    const objectKey = Object.keys(topoData.objects)[0];
                    const geoJson = feature(
                        topoData,
                        topoData.objects[objectKey],
                    ) as GeoJSON.FeatureCollection;

                    if (!geoJson.features) return null;

                    geoJson.features = geoJson.features
                        .map((f: GeoJSON.Feature) => {
                            if (
                                !f.properties ||
                                !f.properties.adm1_psgc ||
                                !f.properties.adm2_psgc ||
                                !f.properties.adm3_en
                            ) {
                                return null;
                            }

                            const regionName = getRegionFromPSGC(
                                f.properties.adm1_psgc.toString(),
                            );
                            const municipalityName =
                                (f.properties.adm3_en as string) || '';
                            const provinceName = province.adm2_en;

                            if (
                                !municipalityName ||
                                municipalityName === 'Unknown'
                            ) {
                                return null;
                            }

                            const dataKey = `${provinceName}::${municipalityName}`;

                            const hasData = !!(
                                choroplethData &&
                                choroplethData[dataKey] &&
                                choroplethData[dataKey] > 0
                            );

                            if (!hasData) {
                                return null;
                            }

                            return {
                                ...f,
                                properties: {
                                    ...f.properties,
                                    name: municipalityName,
                                    region: regionName,
                                    province: provinceName,
                                    municipality: municipalityName,
                                    hasData,
                                    value: choroplethData
                                        ? choroplethData[dataKey] || 0
                                        : 0,
                                },
                            } as GeoJSON.Feature;
                        })
                        .filter((f: GeoJSON.Feature | null) => f !== null);

                    return geoJson;
                } catch (error) {
                    console.warn(
                        `Error loading municipalities from province file ${filename}:`,
                        error,
                    );
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const allFeatures: GeoJSON.Feature[] = [];

            results.forEach((result) => {
                if (result && result.features) {
                    allFeatures.push(...result.features);
                }
            });

            return {
                type: 'FeatureCollection',
                features: allFeatures,
            };
        } catch (error) {
            console.error(
                'Error loading all municipalities from provinces:',
                error,
            );
            return {
                type: 'FeatureCollection',
                features: [],
            };
        }
    }

    static async loadAllProvinces(
        resolution: Resolution,
    ): Promise<GeoJSON.FeatureCollection> {
        const resolutionPath = this.getResolutionPath(resolution);
        const provincesPath = `${this.BASE_PATH}/topojson/provdists/${resolutionPath}`;

        try {
            // Get list of province files (this would require an API endpoint or index file)
            // For now, load a few representative provinces
            const provinceFiles = [
                'municities-provdist-1001300000.topo.0.01.json', // Abra
                'municities-provdist-1001800000.topo.0.01.json', // Agusan del Norte
                'municities-provdist-1003500000.topo.0.01.json', // Aklan
            ];

            const promises = provinceFiles.map(async (filename) => {
                const path = `${provincesPath}/${filename}`;
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.type === 'Topology') {
                            const topoData = data as Topology;
                            const objectKey = Object.keys(topoData.objects)[0];
                            return feature(
                                topoData,
                                topoData.objects[objectKey],
                            ) as GeoJSON.FeatureCollection;
                        }
                        return data;
                    }
                    return null;
                } catch (error) {
                    console.warn(
                        `Failed to load province file ${filename}:`,
                        error,
                    );
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const allFeatures: GeoJSON.Feature[] = [];

            results.forEach((result) => {
                if (result && result.features) {
                    allFeatures.push(...result.features);
                }
            });

            return {
                type: 'FeatureCollection',
                features: allFeatures,
            };
        } catch (error) {
            console.error('Error loading all provinces:', error);
            return {
                type: 'FeatureCollection',
                features: [],
            };
        }
    }
}
