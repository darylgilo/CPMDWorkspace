import StatisticsMap, { LocationData } from '@/components/StatisticsMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BarChart3, Filter, MapPin, TrendingUp } from 'lucide-react';

interface Distribution {
    id: number;
    pesticide_id: number;
    pesticide?: {
        id: number;
        brand_name: string;
        type_of_pesticide: string;
        unit: string;
    };
    quantity: number;
    travel_purpose: string;
    travel_location: string;
    region_id?: number | null;
    province_id?: number | null;
    municipality_id?: number | null;
    barangay_id?: number | null;
    received_by: string;
    received_date: string;
    user_id: number;
    created_at?: string;
}

interface LocationDetails {
    id: string;
    name: string;
    region: string;
    province: string;
    municipality: string;
    barangay: string;
    latitude: number;
    longitude: number;
}

interface PageProps {
    distributions: {
        data: Distribution[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    availablePesticides: Array<Record<string, unknown>>[];
    search: string;
    perPage: number;
    distributionAnalytics: {
        totalDistributions: number;
        totalDistributed: number;
        thisYear: number;
    };
    locationDetails: LocationDetails[];
    [key: string]: unknown;
}

// Philippine regions with approximate coordinates for mapping
const PHILIPPINE_REGIONS = {
    'Region I': { lat: 16.0288, lng: 120.3442 },
    'Region II': { lat: 16.6219, lng: 121.9348 },
    'Region III': { lat: 15.4786, lng: 120.6292 },
    'Region IV-A': { lat: 14.069, lng: 121.1768 },
    'Region IV-B': { lat: 10.2125, lng: 123.7651 },
    'Region V': { lat: 13.1391, lng: 123.7438 },
    'Region VI': { lat: 10.7167, lng: 122.5667 },
    'Region VII': { lat: 10.3157, lng: 123.8854 },
    'Region VIII': { lat: 11.2444, lng: 125.0052 },
    'Region IX': { lat: 7.8878, lng: 122.5496 },
    'Region X': { lat: 8.4542, lng: 124.6319 },
    'Region XI': { lat: 7.0731, lng: 125.6128 },
    'Region XII': { lat: 6.9214, lng: 122.2791 },
    'Region XIII': { lat: 9.7479, lng: 125.5402 },
    BARMM: { lat: 7.3637, lng: 124.2475 },
    NCR: { lat: 14.5995, lng: 120.9842 },
    CAR: { lat: 16.4023, lng: 120.596 },
};

// Extract region from travel location string
const extractRegionFromLocation = (location: string): string => {
    const regionMatch = location.match(/Region\s+[XIV]+|NCR|CAR|BARMM/i);
    return regionMatch ? regionMatch[0] : 'Unknown';
};

// Extract province from travel location string
const extractProvinceFromLocation = (location: string): string => {
    const parts = location.split(',').map((part) => part.trim());
    // Province is usually the second to last part
    if (parts.length >= 2) {
        return parts[parts.length - 2];
    }
    return 'Unknown';
};

// Extract municipality from travel location string
const extractMunicipalityFromLocation = (location: string): string => {
    const parts = location.split(',').map((part) => part.trim());
    // Municipality is usually the third to last part
    if (parts.length >= 3) {
        return parts[parts.length - 3];
    }
    return 'Unknown';
};

// Extract barangay from travel location string
const extractBarangayFromLocation = (location: string): string => {
    const parts = location.split(',').map((part) => part.trim());
    // Barangay is usually the first part if it contains "Barangay" or "Brgy"
    const barangayPart = parts.find(
        (part) =>
            part.toLowerCase().includes('barangay') ||
            part.toLowerCase().includes('brgy'),
    );
    return barangayPart || parts[0] || 'Unknown';
};

export default function DistributionMap() {
    const { props } = usePage<PageProps>();
    const {
        distributions,

        locationDetails = [],
    } = props;

    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

    // Process distribution data for map visualization
    const mapData = useMemo(() => {
        const locationMap = new Map<string, LocationData>();

        distributions?.data?.forEach((distribution) => {
            if (!distribution.travel_location) return;

            const region = extractRegionFromLocation(
                distribution.travel_location,
            );
            const province = extractProvinceFromLocation(
                distribution.travel_location,
            );
            const municipality = extractMunicipalityFromLocation(
                distribution.travel_location,
            );
            const barangay = extractBarangayFromLocation(
                distribution.travel_location,
            );

            // Use the most specific location available
            const locationKey =
                barangay !== 'Unknown'
                    ? barangay
                    : municipality !== 'Unknown'
                      ? municipality
                      : province !== 'Unknown'
                        ? province
                        : region;

            const existing = locationMap.get(locationKey);
            const quantity = Number(distribution.quantity || 0);

            // Get coordinates from location details or use region coordinates
            let latitude = 12.8797; // Default to Philippines center
            let longitude = 121.774;

            const locationDetail = locationDetails.find(
                (detail) =>
                    detail.name
                        .toLowerCase()
                        .includes(locationKey.toLowerCase()) ||
                    locationKey
                        .toLowerCase()
                        .includes(detail.name.toLowerCase()),
            );

            if (locationDetail) {
                latitude = locationDetail.latitude;
                longitude = locationDetail.longitude;
            } else {
                // Use region coordinates as fallback
                const regionCoords =
                    PHILIPPINE_REGIONS[
                        region as keyof typeof PHILIPPINE_REGIONS
                    ];
                if (regionCoords) {
                    latitude = regionCoords.lat;
                    longitude = regionCoords.lng;
                }
            }

            locationMap.set(locationKey, {
                id: locationKey,
                name: locationKey,
                latitude,
                longitude,
                value: existing ? existing.value + quantity : quantity,
                label: distribution.pesticide?.brand_name || 'Unknown',
                description: `${distribution.quantity} ${distribution.pesticide?.unit || 'units'} distributed`,
                region,
                province,
                municipality,
                barangay,
            });
        });

        return Array.from(locationMap.values());
    }, [distributions, locationDetails]);

    // Filter data based on selected filters
    const filteredMapData = useMemo(() => {
        let filtered = mapData;

        if (selectedRegion !== 'all') {
            filtered = filtered.filter(
                (item) => item.region === selectedRegion,
            );
        }

        return filtered;
    }, [mapData, selectedRegion]);

    // Get unique regions for filter
    const uniqueRegions = useMemo(() => {
        return [
            ...new Set(
                mapData
                    .map((item) => item.region)
                    .filter((region): region is string => Boolean(region)),
            ),
        ];
    }, [mapData]);

    // Get top locations by quantity
    const topLocations = useMemo(() => {
        return [...filteredMapData]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredMapData]);

    const handleLocationClick = (location: LocationData) => {
        console.log('Location clicked:', location);
        // You can add more detailed view or navigation here
    };

    const handleExport = (data: LocationData[]) => {
        const csvContent = [
            [
                'Location',
                'Region',
                'Province',
                'Municipality',
                'Quantity',
                'Description',
            ],
            ...data.map((item) => [
                item.name,
                item.region,
                item.province,
                item.municipality,
                item.value,
                item.description,
            ]),
        ]
            .map((row) => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'distribution-map-data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Distribution Map
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Geographical visualization of pesticide distributions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'map' ? 'default' : 'outline'}
                        className={
                            viewMode === 'map'
                                ? 'bg-[#163832] hover:bg-[#163832]/90'
                                : ''
                        }
                        size="sm"
                        onClick={() => setViewMode('map')}
                    >
                        <MapPin className="mr-2 h-4 w-4" />
                        Map View
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        className={
                            viewMode === 'table'
                                ? 'bg-[#163832] hover:bg-[#163832]/90'
                                : ''
                        }
                        size="sm"
                        onClick={() => setViewMode('table')}
                    >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Table View
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>
                    <Select
                        value={selectedRegion}
                        onValueChange={setSelectedRegion}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Regions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {uniqueRegions.map((region) => (
                                <SelectItem
                                    key={region || 'unknown'}
                                    value={region || 'unknown'}
                                >
                                    {region}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Main Content */}
            {viewMode === 'map' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Map */}
                    <div className="lg:col-span-3">
                        <StatisticsMap
                            data={filteredMapData}
                            title="Pesticide Distribution Map"
                            height="600px"
                            valueLabel="Quantity"
                            colorScheme="green"
                            showFilters={false}
                            onLocationClick={handleLocationClick}
                            onExport={handleExport}
                        />
                    </div>

                    {/* Top Locations Sidebar */}
                    <div className="space-y-4">
                        <Card className="p-4">
                            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                <TrendingUp className="h-4 w-4" />
                                Top Locations
                            </h3>
                            <div className="space-y-3">
                                {topLocations.map((location, index) => (
                                    <div
                                        key={location.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">
                                                {location.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {location.region}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="secondary">
                                                {location.value}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground">
                                                #{index + 1}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-4">
                            <h3 className="mb-3 font-semibold">
                                Distribution Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Total Quantity:
                                    </span>
                                    <span className="font-medium">
                                        {filteredMapData.reduce(
                                            (sum, item) => sum + item.value,
                                            0,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Average per Location:
                                    </span>
                                    <span className="font-medium">
                                        {filteredMapData.length > 0
                                            ? Math.round(
                                                  filteredMapData.reduce(
                                                      (sum, item) =>
                                                          sum + item.value,
                                                      0,
                                                  ) / filteredMapData.length,
                                              )
                                            : 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Highest Distribution:
                                    </span>
                                    <span className="font-medium">
                                        {topLocations[0]?.value || 0}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                // Table View
                <Card>
                    <div className="p-4">
                        <h3 className="mb-4 font-semibold">
                            Location Distribution Details
                        </h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Province</TableHead>
                                    <TableHead>Municipality</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMapData
                                    .sort((a, b) => b.value - a.value)
                                    .map((location) => (
                                        <TableRow key={location.id}>
                                            <TableCell className="font-medium">
                                                {location.name}
                                            </TableCell>
                                            <TableCell>
                                                {location.region}
                                            </TableCell>
                                            <TableCell>
                                                {location.province}
                                            </TableCell>
                                            <TableCell>
                                                {location.municipality}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary">
                                                    {location.value}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {location.description}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    );
}
