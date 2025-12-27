import L, { GeoJSON } from 'leaflet';

export type AdministrativeLevel =
    | 'country'
    | 'region'
    | 'province'
    | 'municipality'
    | 'barangay';
export type Resolution = 'high' | 'medium' | 'low';

export interface BoundaryLayerConfig {
    level: AdministrativeLevel;
    resolution: Resolution;
    visible: boolean;
    style?: L.PathOptions;
    fillStyle?: L.PathOptions;
}

export interface BoundaryData {
    type: AdministrativeLevel;
    name: string;
    geoJson?: GeoJSON.FeatureCollection;
    topoJson?: unknown;
    loaded: boolean;
    error?: string;
}

class PhilippineBoundaryLoader {
    private cache: Map<string, BoundaryData> = new Map();
    private baseUrl: string = '/maps/philippines/2023'; // Adjust based on your map files location

    async loadBoundaryData(
        level: AdministrativeLevel,
        resolution: Resolution = 'medium',
    ): Promise<BoundaryData> {
        const cacheKey = `${level}-${resolution}`;

        console.log(
            `PhilippineBoundaryLoader - Loading ${level} at ${resolution} resolution`,
        );

        if (this.cache.has(cacheKey)) {
            console.log(
                `PhilippineBoundaryLoader - Found ${cacheKey} in cache`,
            );
            return this.cache.get(cacheKey)!;
        }

        const boundaryData: BoundaryData = {
            type: level,
            name: this.getLevelName(level),
            loaded: false,
        };

        try {
            // Try TopoJSON first (smaller file size)
            const topoJsonUrl = `${this.baseUrl}/topojson/${this.getFileName(level, resolution, 'topojson')}`;
            console.log(
                `PhilippineBoundaryLoader - Trying TopoJSON URL: ${topoJsonUrl}`,
            );
            const response = await fetch(topoJsonUrl);

            if (response.ok) {
                const topoJsonData = await response.json();
                boundaryData.topoJson = topoJsonData;
                boundaryData.loaded = true;
                console.log(
                    `PhilippineBoundaryLoader - Successfully loaded TopoJSON for ${level}`,
                );
            } else {
                // Fallback to GeoJSON
                const geoJsonUrl = `${this.baseUrl}/geojson/${this.getFileName(level, resolution, 'geojson')}`;
                console.log(
                    `PhilippineBoundaryLoader - Trying GeoJSON URL: ${geoJsonUrl}`,
                );
                const geoResponse = await fetch(geoJsonUrl);

                if (geoResponse.ok) {
                    const geoJsonData = await geoResponse.json();
                    boundaryData.geoJson = geoJsonData;
                    boundaryData.loaded = true;
                    console.log(
                        `PhilippineBoundaryLoader - Successfully loaded GeoJSON for ${level}`,
                    );
                } else {
                    throw new Error(
                        `Failed to load both TopoJSON and GeoJSON for ${level}. TopoJSON status: ${response.status}, GeoJSON status: ${geoResponse.status}`,
                    );
                }
            }
        } catch (error) {
            boundaryData.error =
                error instanceof Error ? error.message : 'Unknown error';
            console.error(
                `PhilippineBoundaryLoader - Error loading ${level}:`,
                boundaryData.error,
            );
        }

        this.cache.set(cacheKey, boundaryData);
        console.log(
            `PhilippineBoundaryLoader - Cached ${cacheKey}:`,
            boundaryData,
        );
        return boundaryData;
    }

    private getFileName(
        level: AdministrativeLevel,
        resolution: Resolution,
        format: 'topojson' | 'geojson',
    ): string {
        const levelMap = {
            country: 'phl',
            region: 'phl-regions',
            province: 'phl-provdists',
            municipality: 'phl-municities',
            barangay: 'phl-barangays',
        };

        const resolutionMap = {
            high: 'hires',
            medium: 'medres',
            low: 'lowres',
        };

        return `${levelMap[level]}.${resolutionMap[resolution]}.${format}`;
    }

    private getLevelName(level: AdministrativeLevel): string {
        const names = {
            country: 'Philippines',
            region: 'Regions',
            province: 'Provinces/Districts',
            municipality: 'Municipalities/Cities',
            barangay: 'Barangays/Sub-Municipalities',
        };
        return names[level];
    }

    createGeoJsonLayer(
        boundaryData: BoundaryData,
        style?: L.PathOptions,
    ): L.GeoJSON | null {
        if (!boundaryData.loaded || !boundaryData.geoJson) {
            return null;
        }

        const defaultStyle: L.PathOptions = {
            color: '#3388ff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2,
            fillColor: '#3388ff',
            ...style,
        };

        return L.geoJSON(boundaryData.geoJson, {
            style: defaultStyle,
            onEachFeature: (feature, layer) => {
                if (feature.properties) {
                    const popupContent = this.createPopupContent(
                        feature.properties,
                        boundaryData.type,
                    );
                    layer.bindPopup(popupContent);
                }
            },
        });
    }

    createTopoJsonLayer(): L.GeoJSON | null {
        // TopoJSON support not implemented - using GeoJSON instead
        console.warn(
            'TopoJSON support not implemented, falling back to GeoJSON',
        );
        return null;
    }

    private getTopoJsonObjectName(level: AdministrativeLevel): string {
        const objectNames = {
            country: 'phl',
            region: 'phl-regions',
            province: 'phl-provdists',
            municipality: 'phl-municities',
            barangay: 'phl-barangays',
        };
        return objectNames[level];
    }

    private createPopupContent(
        properties: Record<string, unknown>,
        level: AdministrativeLevel,
    ): string {
        const commonProps = [
            'NAME',
            'name',
            'Region',
            'Province',
            'Municipality',
            'Barangay',
        ];
        const relevantProps = Object.entries(properties)
            .filter(([key]) =>
                commonProps.some((prop) =>
                    key.toLowerCase().includes(prop.toLowerCase()),
                ),
            )
            .slice(0, 5);

        if (relevantProps.length === 0) {
            return `<div><strong>${this.getLevelName(level)}</strong><br>No details available</div>`;
        }

        const content = relevantProps
            .map(
                ([key, value]) =>
                    `<div><strong>${key}:</strong> ${value}</div>`,
            )
            .join('');

        return `<div>${content}</div>`;
    }

    clearCache(): void {
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}

export const philippineBoundaryLoader = new PhilippineBoundaryLoader();

// Utility functions for boundary styling
export const createBoundaryStyle = (
    level: AdministrativeLevel,
    color: string = '#3388ff',
): L.PathOptions => {
    const baseStyle: L.PathOptions = {
        color,
        weight: 1.5,
        opacity: 0.8,
        fillOpacity: 0.1,
        fillColor: color,
    };

    // Adjust styling based on administrative level
    switch (level) {
        case 'country':
            return { ...baseStyle, weight: 3, opacity: 1 };
        case 'region':
            return { ...baseStyle, weight: 2.5, opacity: 0.9 };
        case 'province':
            return { ...baseStyle, weight: 2, opacity: 0.8 };
        case 'municipality':
            return { ...baseStyle, weight: 1.5, opacity: 0.7 };
        case 'barangay':
            return { ...baseStyle, weight: 1, opacity: 0.6 };
        default:
            return baseStyle;
    }
};

export const createChoroplethStyle = (
    value: number,
    maxValue: number,
    colorScheme: 'green' | 'blue' | 'red' | 'orange' | 'purple' = 'green',
): L.PathOptions => {
    const intensity = maxValue > 0 ? value / maxValue : 0;

    const colorSchemes = {
        green: ['#1E4E45', '#1E4E45', '#1E4E45', '#1E4E45', '#1E4E45'],
        blue: ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8'],
        red: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
        orange: ['#feedde', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d'],
        purple: ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba'],
    };

    const colors = colorSchemes[colorScheme];
    const colorIndex = Math.min(
        Math.floor(intensity * colors.length),
        colors.length - 1,
    );
    const color = colors[colorIndex];

    return {
        color,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6 + intensity * 0.4,
        fillColor: color,
    };
};
