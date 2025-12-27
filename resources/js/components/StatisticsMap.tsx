import BoundaryLayerMapLibre from '@/components/BoundaryLayerMapLibre';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Layers, Maximize2, RotateCcw } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Map, { MapRef } from 'react-map-gl/maplibre';

declare global {
    interface Window {
        maplibregl: typeof maplibregl;
    }
}

// Make maplibregl available globally for plugins
window.maplibregl = maplibregl;

export interface LocationData {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    value: number;
    label?: string;
    description?: string;
    region?: string;
    province?: string;
    municipality?: string;
    barangay?: string;
    pesticideData?: Array<{
        type: string;
        quantity: number;
        unit: string;
    }>;
}

interface StatisticsMapProps {
    data: LocationData[];
    title?: string;
    height?: string;
    showFilters?: boolean;
    showControls?: boolean;
    centerLatitude?: number;
    centerLongitude?: number;
    zoom?: number;
    minZoom?: number;
    valueLabel?: string;
    colorScheme?: 'green' | 'blue' | 'red' | 'orange' | 'purple';
    onLocationClick?: (location: LocationData) => void;
    onExport?: (data: LocationData[]) => void;
    selectedRegion?: string;
    adminLevel?: 'region' | 'province' | 'municipality';
}

interface MapControlsProps {
    onResetView: () => void;
    onToggleFullscreen: () => void;
    onExport?: () => void;
    showExport?: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
    onResetView,
    onToggleFullscreen,
    onExport,
    showExport = false,
}) => {
    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 backdrop-blur-sm"
                    >
                        <Layers className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onResetView}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onToggleFullscreen}>
                        <Maximize2 className="mr-2 h-4 w-4" />
                        Toggle Fullscreen
                    </DropdownMenuItem>
                    {showExport && onExport && (
                        <DropdownMenuItem onClick={onExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export const StatisticsMap: React.FC<StatisticsMapProps> = (props) => {
    const {
        data,
        title = 'Statistics Map',
        height = '500px',
        showControls = true,
        centerLatitude = 12.8797, // Center of the Philippines
        centerLongitude = 121.774, // Center of the Philippines
        zoom = 6,
        valueLabel = 'Value',
        colorScheme = 'green',
        onLocationClick,
        onExport,
        selectedRegion,
        adminLevel = 'region',
    } = props;

    const mapRef = useRef<MapRef>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [filteredData, setFilteredData] = useState<LocationData[]>(data);
    const [popupInfo, setPopupInfo] = useState<LocationData | null>(null);

    useEffect(() => {
        setFilteredData(data);
    }, [data]);

    // Close popup when filters driving the map view change
    useEffect(() => {
        setPopupInfo(null);
    }, [adminLevel, selectedRegion]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen]);

    // const regions = [
    //     ...new Set(
    //         data
    //             .map((item) => item.region)
    //             .filter((region): region is string => Boolean(region)),
    //     ),
    // ];
    const maxValue = Math.max(...data.map((item) => item.value), 1);

    // Create choropleth data
    const choroplethData = useMemo(() => {
        const dataMap: { [key: string]: number } = {};
        data.forEach((location) => {
            let key: string | undefined;

            if (
                adminLevel === 'municipality' &&
                location.province &&
                location.name
            ) {
                // Use province + municipality to avoid collisions for same-named municipalities
                key = `${location.province}::${location.name}`;
            } else {
                // For region and province levels, keep using the location name
                key = location.name || location.region;
            }

            if (key && key !== 'Unknown') {
                const currentValue = dataMap[key] || 0;
                dataMap[key] = currentValue + location.value;
            }
        });
        return dataMap;
    }, [data, adminLevel]);

    // Create pesticide data mapping
    const pesticideDataMap = useMemo(() => {
        const dataMap: {
            [key: string]: Array<{
                type: string;
                quantity: number;
                unit: string;
            }>;
        } = {};
        data.forEach((location) => {
            let key: string | undefined;

            if (
                adminLevel === 'municipality' &&
                location.province &&
                location.name
            ) {
                key = `${location.province}::${location.name}`;
            } else {
                key = location.name || location.region;
            }

            if (
                key &&
                key !== 'Unknown' &&
                location.pesticideData &&
                location.pesticideData.length > 0
            ) {
                dataMap[key] = location.pesticideData;
            }
        });

        return dataMap;
    }, [data, adminLevel]);

    const handleLocationClick = (location: LocationData) => {
        setPopupInfo(location);
        if (onLocationClick) {
            onLocationClick(location);
        }
    };

    const handleClosePopup = () => {
        setPopupInfo(null);
    };

    const handleResetView = () => {
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [centerLongitude, centerLatitude],
                zoom: zoom,
                duration: 1000,
            });
        }
        setFilteredData(data);
    };

    const handleToggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleExport = () => {
        if (onExport) {
            onExport(filteredData);
        }
    };

    const mapContainerHeight = isFullscreen ? '100vh' : height;

    return (
        <Card
            className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        >
            <div className="border-b p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-sm text-muted-foreground">
                            {filteredData.length} locations • Total {valueLabel}
                            :{' '}
                            {filteredData.reduce(
                                (sum, item) => sum + item.value,
                                0,
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative" style={{ height: mapContainerHeight }}>
                <Map
                    ref={mapRef}
                    mapLib={maplibregl}
                    initialViewState={{
                        longitude: centerLongitude,
                        latitude: centerLatitude,
                        zoom: zoom,
                    }}
                    minZoom={2}
                    maxBounds={[
                        [100, -10], // Southwest coordinates (lng, lat) - expanded bounds
                        [140, 30], // Northeast coordinates (lng, lat) - expanded bounds
                    ]}
                    style={{ height: '100%', width: '100%' }}
                    mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                    onClick={(e) => {
                        // Handle map clicks to close popup
                        if (e.originalEvent && !e.defaultPrevented) {
                            handleClosePopup();
                        }
                    }}
                >
                    {/* Boundary layer with choropleth based on selected admin level */}
                    <BoundaryLayerMapLibre
                        config={{
                            level: adminLevel,
                            resolution: 'medium',
                            visible: true,
                        }}
                        choroplethData={choroplethData}
                        pesticideData={pesticideDataMap}
                        maxValue={maxValue}
                        colorScheme={colorScheme}
                        onFeatureClick={handleLocationClick}
                        selectedRegion={selectedRegion}
                    />

                    {/* Popup for location details */}
                    {popupInfo && (
                        <div className="absolute top-4 left-4 z-[1000] max-w-sm rounded-lg bg-white p-4 shadow-lg">
                            {/* Close button in top-right corner of popup */}
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={handleClosePopup}
                                    className="rounded-md p-2 text-2xl leading-none font-bold text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600"
                                    aria-label="Close popup"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="pr-10">
                                <h3 className="text-lg font-semibold">
                                    {popupInfo.name}
                                </h3>
                            </div>
                            <div className="space-y-1 text-sm">
                                {adminLevel !== 'region' &&
                                    popupInfo.region && (
                                        <div>
                                            <strong>Region:</strong>{' '}
                                            {popupInfo.region}
                                        </div>
                                    )}
                                {adminLevel !== 'province' &&
                                    popupInfo.province && (
                                        <div>
                                            <strong>Province:</strong>{' '}
                                            {popupInfo.province}
                                        </div>
                                    )}
                                {adminLevel !== 'municipality' &&
                                    popupInfo.municipality && (
                                        <div>
                                            <strong>Municipality:</strong>{' '}
                                            {popupInfo.municipality}
                                        </div>
                                    )}
                                <div>
                                    <strong>{valueLabel}:</strong>{' '}
                                    {popupInfo.value.toLocaleString()}
                                </div>
                                {popupInfo.pesticideData &&
                                    popupInfo.pesticideData.length > 0 && (
                                        <div>
                                            <strong>
                                                Pesticide Distribution:
                                            </strong>
                                            <ul className="ml-2 list-inside list-disc">
                                                {popupInfo.pesticideData.map(
                                                    (
                                                        pesticide: {
                                                            type: string;
                                                            quantity: number;
                                                            unit: string;
                                                        },
                                                        index: number,
                                                    ) => (
                                                        <li
                                                            key={index}
                                                            className="flex items-center"
                                                        >
                                                            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500"></span>
                                                            {pesticide.type}:{' '}
                                                            {pesticide.quantity}{' '}
                                                            {pesticide.unit}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </Map>

                {showControls && (
                    <MapControls
                        onResetView={handleResetView}
                        onToggleFullscreen={handleToggleFullscreen}
                        onExport={onExport ? handleExport : undefined}
                        showExport={!!onExport}
                    />
                )}
            </div>
        </Card>
    );
};

export default StatisticsMap;
