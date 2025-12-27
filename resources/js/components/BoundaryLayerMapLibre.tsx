import { LocationData } from '@/components/StatisticsMap';
import { BoundaryDataLoader } from '@/utils/boundaryDataLoader';
import { BoundaryLayerConfig } from '@/utils/philippineBoundaries';
import maplibregl from 'maplibre-gl';
import React, { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

interface BoundaryLayerMapLibreProps {
    config: BoundaryLayerConfig;
    choroplethData?: { [key: string]: number };
    pesticideData?: {
        [key: string]: Array<{ type: string; quantity: number; unit: string }>;
    };
    maxValue?: number;
    colorScheme?: 'green' | 'blue' | 'red' | 'orange' | 'purple';
    onFeatureClick?: (location: LocationData) => void;
    selectedRegion?: string;
}

export const BoundaryLayerMapLibre: React.FC<BoundaryLayerMapLibreProps> = ({
    config,
    choroplethData,
    maxValue,
    colorScheme = 'green',
    onFeatureClick,
    selectedRegion,
}) => {
    const { current: map } = useMap();
    const layerId = `boundary-${config.level}-${config.resolution}`;
    const sourceId = `boundary-source-${config.level}-${config.resolution}`;

    // Refs for cleanup and state management
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);
    const cleanupInProgress = useRef(false);

    // Cleanup function to safely remove map layers and sources
    const cleanupMapResources = useCallback(() => {
        if (cleanupInProgress.current || !isMounted.current) {
            return;
        }

        cleanupInProgress.current = true;
        const currentMap = mapInstanceRef.current;

        try {
            // Clear any pending timeouts
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
                cleanupTimeoutRef.current = null;
            }

            if (!currentMap) {
                cleanupInProgress.current = false;
                return;
            }

            // Helper function to safely remove a layer
            const removeLayerSafely = (id: string) => {
                try {
                    if (currentMap.getLayer && currentMap.getLayer(id)) {
                        currentMap.removeLayer(id);
                    }
                } catch (e) {
                    console.warn(`Error removing layer ${id}:`, e);
                }
            };

            // Remove main layer and highlight layer
            removeLayerSafely(layerId);
            removeLayerSafely(`${layerId}-highlight`);

            // Remove all layers that use this source
            try {
                const mapLayers = currentMap.getStyle()?.layers || [];
                for (const layer of mapLayers) {
                    if ('source' in layer && layer.source === sourceId) {
                        removeLayerSafely(layer.id);
                    }
                }
            } catch (e) {
                console.warn('Error removing source-dependent layers:', e);
            }

            // Only remove the source if it exists
            if (currentMap.getSource && currentMap.getSource(sourceId)) {
                cleanupTimeoutRef.current = setTimeout(() => {
                    try {
                        if (
                            isMounted.current &&
                            currentMap &&
                            currentMap.removeSource
                        ) {
                            currentMap.removeSource(sourceId);
                        }
                    } catch (e) {
                        console.warn(`Error removing source ${sourceId}:`, e);
                    } finally {
                        if (isMounted.current) {
                            cleanupInProgress.current = false;
                        }
                    }
                }, 50);
            } else {
                cleanupInProgress.current = false;
            }
        } catch (error) {
            console.warn('Error during map cleanup:', error);
            if (isMounted.current) {
                cleanupInProgress.current = false;
            }
        }
    }, [layerId, sourceId]);

    useEffect(() => {
        if (!map) {
            mapInstanceRef.current = null;
            return;
        }

        const mapInstance = map.getMap();
        if (!mapInstance) {
            mapInstanceRef.current = null;
            return;
        }

        // Update the map instance ref
        mapInstanceRef.current = mapInstance;
        isMounted.current = true;

        // Cleanup if not visible
        if (!config.visible) {
            cleanupMapResources();
            return;
        }

        // Load boundary data and add to map
        const loadBoundaryData = async () => {
            if (!mapInstance) return;

            try {
                // Clean up existing resources first
                cleanupMapResources();

                // Small delay to ensure cleanup is complete before adding new resources
                await new Promise((resolve) => setTimeout(resolve, 50));

                // Use the BoundaryDataLoader utility to load and convert data
                const geoJsonData = await BoundaryDataLoader.loadBoundaryData(
                    config.level,
                    config.resolution,
                    selectedRegion,
                    choroplethData,
                );

                console.log(
                    `Loaded ${geoJsonData.features?.length || 0} features for ${config.level} level at ${config.resolution} resolution`,
                );

                // Add source to map
                mapInstance.addSource(sourceId, {
                    type: 'geojson',
                    data: geoJsonData,
                });

                // Create layer style based on choropleth data
                let paintProperties: Record<string, unknown> = {
                    'fill-color': '#e5e7eb', // Light gray default
                    'fill-opacity': 0.5,
                    'fill-outline-color': '#9ca3af', // Border color
                };

                if (choroplethData && maxValue) {
                    // Create choropleth style - only show regions with data
                    paintProperties = {
                        'fill-color': [
                            'case',
                            ['boolean', ['get', 'isSelected'], false],
                            '#1E4E45', // Highlight color for selected region
                            ['>', ['get', 'value'], 0],
                            [
                                'interpolate',
                                ['linear'],
                                ['get', 'value'],
                                0,
                                getColorForValue(0, maxValue, colorScheme),
                                maxValue,
                                getColorForValue(
                                    maxValue,
                                    maxValue,
                                    colorScheme,
                                ),
                            ],
                            'rgba(0, 0, 0, 0)', // Transparent for regions with no data
                        ],
                        'fill-opacity': [
                            'case',
                            ['boolean', ['get', 'isSelected'], false],
                            0.7,
                            ['>', ['get', 'value'], 0],
                            0.7,
                            0, // Completely transparent for regions with no data
                        ],
                    };
                } else if (selectedRegion) {
                    // Highlight selected region even without choropleth data
                    paintProperties = {
                        'fill-color': [
                            'case',
                            ['boolean', ['get', 'isSelected'], false],
                            '#1E4E45', // Highlight color for selected region
                            '#e5e7eb', // Light gray for non-selected regions
                        ],
                        'fill-opacity': [
                            'case',
                            ['boolean', ['get', 'isSelected'], false],
                            0.5, // Lower opacity to prevent text overlay
                            0.3,
                        ],
                        'fill-outline-color': '#9ca3af', // Border color
                    };
                }

                // Add layer to map
                if (!mapInstance.getLayer(layerId)) {
                    mapInstance.addLayer({
                        id: layerId,
                        type: 'fill',
                        source: sourceId,
                        paint: paintProperties,
                        layout: {
                            visibility: 'visible',
                        },
                    });

                    // Add hover interaction - only for regions with data
                    mapInstance.on(
                        'mouseenter',
                        layerId,
                        (e: maplibregl.MapLayerMouseEvent) => {
                            if (e.features && e.features.length > 0) {
                                const feature = e.features[0];
                                const featureValue =
                                    feature.properties?.value || 0;
                                // Only show hover effect for regions with data
                                if (featureValue > 0) {
                                    mapInstance.getCanvas().style.cursor =
                                        'pointer';
                                    mapInstance.setPaintProperty(
                                        layerId,
                                        'fill-opacity',
                                        0.8,
                                    );
                                }
                            }
                        },
                    );

                    mapInstance.on('mouseleave', layerId, () => {
                        mapInstance.getCanvas().style.cursor = '';
                        if (choroplethData && maxValue) {
                            mapInstance.setPaintProperty(
                                layerId,
                                'fill-opacity',
                                0.7,
                            );
                        } else {
                            mapInstance.setPaintProperty(
                                layerId,
                                'fill-opacity',
                                0.3,
                            );
                        }
                    });

                    // Add click interaction
                    const handleClick = (e: maplibregl.MapLayerMouseEvent) => {
                        if (!e.features || !e.features.length) return;

                        const feature = e.features[0];
                        const featureValue = feature.properties?.value || 0;

                        if (featureValue > 0 && onFeatureClick) {
                            const locationData: LocationData = {
                                id: String(feature.id || 'unknown'),
                                name: feature.properties?.name || 'Unknown',
                                latitude: e.lngLat.lat,
                                longitude: e.lngLat.lng,
                                value: featureValue,
                                region: feature.properties?.region || '',
                                province: feature.properties?.province || '',
                                municipality:
                                    feature.properties?.municipality || '',
                                label: 'Distribution Data',
                                description: `${featureValue} units distributed`,
                                pesticideData: [],
                            };
                            onFeatureClick(locationData);
                        }
                    };

                    // Only add the event listener if the layer exists
                    if (mapInstance.getLayer(layerId)) {
                        mapInstance.on('click', layerId, handleClick);
                    }

                    return () => {
                        if (
                            mapInstance &&
                            typeof mapInstance.off === 'function'
                        ) {
                            try {
                                mapInstance.off('click', layerId, handleClick);
                            } catch (error) {
                                console.warn(
                                    'Error removing click handler:',
                                    error,
                                );
                            }
                        }
                    };
                }
            } catch (error) {
                console.error('Error loading boundary data:', error);
            }
        };

        // Load boundary data in a way that respects component mount state
        const loadData = async () => {
            try {
                await loadBoundaryData();
            } catch (error) {
                if (isMounted.current) {
                    console.error('Error loading boundary data:', error);
                }
            }
        };

        loadData();

        // Cleanup function
        return () => {
            isMounted.current = false;
            cleanupMapResources();
        };
    }, [
        map,
        config.visible,
        config.level,
        config.resolution,
        selectedRegion,
        layerId,
        sourceId,
        choroplethData,
        maxValue,
        cleanupMapResources,
        colorScheme,
        onFeatureClick,
    ]);

    // Update layer style when choropleth data changes
    useEffect(() => {
        if (!map) return;

        const mapInstance = map.getMap();
        if (
            !mapInstance ||
            typeof mapInstance.getLayer !== 'function' ||
            !mapInstance.getLayer(layerId)
        ) {
            return;
        }
        if (!mapInstance || !mapInstance.getLayer(layerId)) {
            return;
        }

        // Create layer style based on choropleth data
        let paintProperties: Record<string, unknown> = {
            'fill-color': '#e5e7eb', // Light gray default
            'fill-opacity': 0.5,
            'fill-outline-color': '#9ca3af', // Border color
        };

        if (choroplethData && maxValue) {
            // Create choropleth style - only show regions with data
            paintProperties = {
                'fill-color': [
                    'case',
                    ['boolean', ['get', 'isSelected'], false],
                    '#1E4E45', // Highlight color for selected region
                    ['>', ['get', 'value'], 0],
                    [
                        'interpolate',
                        ['linear'],
                        ['get', 'value'],
                        0,
                        getColorForValue(0, maxValue, colorScheme),
                        maxValue,
                        getColorForValue(maxValue, maxValue, colorScheme),
                    ],
                    'rgba(0, 0, 0, 0)', // Transparent for regions with no data
                ],
                'fill-opacity': [
                    'case',
                    ['boolean', ['get', 'isSelected'], false],
                    0.7,
                    ['>', ['get', 'value'], 0],
                    0.7,
                    0, // Completely transparent for regions with no data
                ],
            };
        } else if (selectedRegion) {
            // Highlight selected region even without choropleth data
            paintProperties = {
                'fill-color': [
                    'case',
                    ['boolean', ['get', 'isSelected'], false],
                    '#1E4E45', // Highlight color for selected region
                    '#e5e7eb', // Light gray for non-selected regions
                ],
                'fill-opacity': [
                    'case',
                    ['boolean', ['get', 'isSelected'], false],
                    0.5, // Lower opacity to prevent text overlay
                    0.3,
                ],
                'fill-outline-color': '#9ca3af', // Border color
            };
        }

        // Update paint properties safely
        try {
            mapInstance.setPaintProperty(
                layerId,
                'fill-color',
                paintProperties['fill-color'],
            );
            mapInstance.setPaintProperty(
                layerId,
                'fill-opacity',
                paintProperties['fill-opacity'],
            );
            if (paintProperties['fill-outline-color']) {
                mapInstance.setPaintProperty(
                    layerId,
                    'fill-outline-color',
                    paintProperties['fill-outline-color'],
                );
            }
        } catch (error) {
            console.warn('Error updating map paint properties:', error);
        }
    }, [map, choroplethData, maxValue, colorScheme, selectedRegion, layerId]);

    return null;
};

// Helper function to get color based on value
function getColorForValue(
    value: number,
    maxValue: number,
    colorScheme: string,
): string {
    const ratio = value / maxValue;

    const colorSchemes = {
        green: [
            '#1E4E45',
            '#1E4E45',
            '#1E4E45',
            '#1E4E45',
            '#1E4E45',
            '#1E4E45',
            '#1E4E45',
            '#1E4E45',
        ],
        blue: [
            '#eff3ff',
            '#deebf7',
            '#c6dbef',
            '#9ecae1',
            '#6baed6',
            '#4292c6',
            '#2171b5',
            '#08519c',
        ],
        red: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
        orange: [
            '#fff5eb',
            '#fee6ce',
            '#fdd0a2',
            '#fdae6b',
            '#fd8d3c',
            '#e6550d',
            '#a63603',
        ],
        purple: [
            '#f2f0f7',
            '#dadaeb',
            '#bcbddc',
            '#9e9ac8',
            '#807dba',
            '#6a51a3',
            '#54278f',
        ],
    };

    const colors =
        colorSchemes[colorScheme as keyof typeof colorSchemes] ||
        colorSchemes.green;
    const index = Math.floor(ratio * (colors.length - 1));
    return colors[Math.min(index, colors.length - 1)];
}

export default BoundaryLayerMapLibre;
