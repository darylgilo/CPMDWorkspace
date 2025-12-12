import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Layers, Maximize2, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
    ._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

const MapViewUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({
    center,
    zoom,
}) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    return null;
};

const getColorForValue = (
    value: number,
    maxValue: number,
    scheme: string,
): string => {
    const intensity = maxValue > 0 ? value / maxValue : 0;

    const colors = {
        green: [`#22c55e`, `#16a34a`, `#15803d`, `#166534`, `#14532d`],
        blue: [`#3b82f6`, `#2563eb`, `#1d4ed8`, `#1e40af`, `#1e3a8a`],
        red: [`#ef4444`, `#dc2626`, `#b91c1c`, `#991b1b`, `#7f1d1d`],
        orange: [`#f97316`, `#ea580c`, `#c2410c`, `#9a3412`, `#7c2d12`],
        purple: [`#a855f7`, `#9333ea`, `#7c3aed`, `#6d28d9`, `#5b21b6`],
    };

    const schemeColors = colors[scheme as keyof typeof colors] || colors.green;
    const index = Math.min(
        Math.floor(intensity * schemeColors.length),
        schemeColors.length - 1,
    );
    return schemeColors[index];
};

const createCustomIcon = (
    color: string,
    value: number,
    label: string,
): L.DivIcon => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                position: relative;
            ">
                <div style="
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 11px;
                    white-space: nowrap;
                    pointer-events: none;
                ">
                    ${label}
                </div>
            </div>
        `,
        iconSize: [32, 57],
        iconAnchor: [16, 57],
        popupAnchor: [0, -57],
    });
};

export const StatisticsMap: React.FC<StatisticsMapProps> = ({
    data,
    title = 'Statistics Map',
    height = '500px',
    showControls = true,
    centerLatitude = 12.8797,  // Center of the Philippines
    centerLongitude = 121.774,  // Center of the Philippines
    zoom = 6,
    minZoom = 5,  // Prevent zooming out too far
    valueLabel = 'Value',
    colorScheme = 'green',
    onLocationClick,
    onExport,
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [filteredData, setFilteredData] = useState<LocationData[]>(data);
    // const [selectedRegion, setSelectedRegion] = useState<string>('all');
    // const [sortBy, setSortBy] = useState<'name' | 'value'>('value');

    useEffect(() => {
        setFilteredData(data);
    }, [data]);

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
    const maxValue = Math.max(...filteredData.map((item) => item.value), 1);

    // const handleRegionFilter = (region: string) => {
    //     setSelectedRegion(region);
    //     if (region === 'all') {
    //         setFilteredData(data);
    //     } else {
    //         setFilteredData(data.filter((item) => item.region === region));
    //     }
    // };

    // const handleSort = (sort: 'name' | 'value') => {
    //     setSortBy(sort);
    //     const sorted = [...filteredData].sort((a, b) => {
    //         if (sort === 'name') return a.name.localeCompare(b.name);
    //         return b.value - a.value;
    //     });
    //     setFilteredData(sorted);
    // };

    const handleResetView = () => {
        // setSelectedRegion('all');
        setFilteredData(data);
        // setSortBy('value');
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
                <MapContainer
                    center={[centerLatitude, centerLongitude]}
                    zoom={zoom}
                    minZoom={minZoom}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={!isFullscreen}
                    maxBounds={[
                        [4.5, 114], // Southwest coordinates (lat, lng)
                        [21.5, 128]  // Northeast coordinates (lat, lng)
                    ]}
                    maxBoundsViscosity={1.0} // Keeps the bounds strict
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapViewUpdater
                        center={[centerLatitude, centerLongitude]}
                        zoom={zoom}
                    />

                    {filteredData.map((location) => {
                        const color = getColorForValue(
                            location.value,
                            maxValue,
                            colorScheme,
                        );
                        const displayName = location.municipality || location.name;
                        const icon = createCustomIcon(
                            color,
                            location.value,
                            displayName,
                        );

                        return (
                            <Marker
                                key={location.id}
                                position={[
                                    location.latitude,
                                    location.longitude,
                                ]}
                                icon={icon}
                                eventHandlers={{
                                    click: () => onLocationClick?.(location),
                                }}
                            >
                                <Popup>
                                    <div className="min-w-[200px] p-2">
                                        <h4 className="mb-2 text-sm font-semibold">
                                            {location.name}
                                        </h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    {valueLabel}:
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2"
                                                >
                                                    {location.value}
                                                </Badge>
                                            </div>
                                            {location.region && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        Region:
                                                    </span>
                                                    <span>
                                                        {location.region}
                                                    </span>
                                                </div>
                                            )}
                                            {location.province && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        Province:
                                                    </span>
                                                    <span>
                                                        {location.province}
                                                    </span>
                                                </div>
                                            )}
                                            {location.municipality && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        Municipality:
                                                    </span>
                                                    <span>
                                                        {location.municipality}
                                                    </span>
                                                </div>
                                            )}
                                            {location.barangay && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        Barangay:
                                                    </span>
                                                    <span>
                                                        {location.barangay}
                                                    </span>
                                                </div>
                                            )}
                                            {location.description && (
                                                <div className="mt-2 border-t pt-2">
                                                    <p className="text-muted-foreground">
                                                        {location.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

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
