import CustomPagination from '@/components/CustomPagination';
import DistributionLineChart from '@/components/DistributionLineChart';
import SearchBar from '@/components/SearchBar';
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
    'Region I (Ilocos Region)': { lat: 16.0288, lng: 120.3442 },
    'Region II (Cagayan Valley)': { lat: 16.6219, lng: 121.9348 },
    'Region III (Central Luzon)': { lat: 15.4786, lng: 120.6292 },
    'Region IV-A (CALABARZON)': { lat: 14.069, lng: 121.1768 },
    'Region V (Bicol Region)': { lat: 13.1391, lng: 123.7438 },
    'Region VI (Western Visayas)': { lat: 10.7167, lng: 122.5667 },
    'Region VII (Central Visayas)': { lat: 10.3157, lng: 123.8854 },
    'Region VIII (Eastern Visayas)': { lat: 11.2444, lng: 125.0052 },
    'Region IX (Zamboanga Peninsula)': { lat: 7.8878, lng: 122.5496 },
    'Region X (Northern Mindanao)': { lat: 8.4542, lng: 124.6319 },
    'Region XI (Davao Region)': { lat: 7.0731, lng: 125.6128 },
    'Region XII (SOCCSKSARGEN)': { lat: 6.9214, lng: 122.2791 },
    'Region XIII (Caraga)': { lat: 9.7479, lng: 125.5402 },
    'Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)': {
        lat: 7.3637,
        lng: 124.2475,
    },
    'National Capital Region (NCR)': { lat: 14.5995, lng: 120.9842 },
    'Cordillera Administrative Region (CAR)': { lat: 16.4023, lng: 120.596 },
    'MIMAROPA Region': { lat: 12.8797, lng: 121.774 },
};

// NCR Cities with their coordinates
const NCR_CITIES = {
    'City of Caloocan': { lat: 14.6591, lng: 120.9720 },
    'City of Las Piñas': { lat: 14.4445, lng: 120.9768 },
    'City of Makati': { lat: 14.5547, lng: 121.0244 },
    'City of Malabon': { lat: 14.6601, lng: 120.9444 },
    'City of Mandaluyong': { lat: 14.5794, lng: 121.0353 },
    'City of Manila': { lat: 14.5995, lng: 120.9842 },
    'City of Marikina': { lat: 14.6507, lng: 121.0353 },
    'City of Muntinlupa': { lat: 14.4096, lng: 121.0244 },
    'City of Navotas': { lat: 14.6678, lng: 120.9497 },
    'City of Parañaque': { lat: 14.4793, lng: 121.0197 },
    'Pasay City': { lat: 14.5378, lng: 121.0014 },
    'City of Pasig': { lat: 14.5764, lng: 121.0851 },
    'Quezon City': { lat: 14.6760, lng: 121.0437 },
    'City of San Juan': { lat: 14.6018, lng: 121.0344 },
    'City of Taguig': { lat: 14.5176, lng: 121.0582 },
    'City of Valenzuela': { lat: 14.6998, lng: 120.9830 },
};

// Extract region from travel location string
const extractRegionFromLocation = (location: string): string => {
    // Match the new region names from the CSV
    const regionPatterns = [
        'Region I (Ilocos Region)',
        'Region II (Cagayan Valley)',
        'Region III (Central Luzon)',
        'Region IV-A (CALABARZON)',
        'Region V (Bicol Region)',
        'Region VI (Western Visayas)',
        'Region VII (Central Visayas)',
        'Region VIII (Eastern Visayas)',
        'Region IX (Zamboanga Peninsula)',
        'Region X (Northern Mindanao)',
        'Region XI (Davao Region)',
        'Region XII (SOCCSKSARGEN)',
        'Region XIII (Caraga)',
        'National Capital Region (NCR)',
        'Cordillera Administrative Region (CAR)',
        'MIMAROPA Region',
        'Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)',
    ];

    for (const region of regionPatterns) {
        if (location.includes(region)) {
            return region;
        }
    }

    return 'Unknown';
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
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [chartYear, setChartYear] = useState<number>(
        new Date().getFullYear(),
    );
    // const [chartMonth, setChartMonth] = useState<number>(new Date().getMonth());
    // const [chartViewType, setChartViewType] = useState<'monthly' | 'yearly'>('monthly');
    const itemsPerPage = 10;
    type ViewMode = 'map' | 'table';
    type AdminLevel = 'region' | 'province' | 'municipality';

    const [viewMode, setViewMode] = useState<ViewMode>('map'); // Default to map view
    const [adminLevel, setAdminLevel] = useState<AdminLevel>('region');

    // Process distribution data for map visualization at region / province / municipality levels
    const { regionData, provinceData, municipalityData } = useMemo(() => {
        const regionMap = new Map<string, LocationData>();
        const provinceMap = new Map<string, LocationData>();
        const municipalityMap = new Map<string, LocationData>();

        const getRegionCoords = (region: string) => {
            const coords =
                PHILIPPINE_REGIONS[region as keyof typeof PHILIPPINE_REGIONS];
            if (coords) {
                return { latitude: coords.lat, longitude: coords.lng };
            }
            return { latitude: 12.8797, longitude: 121.774 };
        };

        const getProvinceCoords = (region: string, province: string) => {
            const detail = locationDetails.find(
                (d) => d.region === region && d.province === province,
            );
            if (detail) {
                return {
                    latitude: detail.latitude,
                    longitude: detail.longitude,
                };
            }
            return getRegionCoords(region);
        };

        const getMunicipalityCoords = (
            region: string,
            province: string,
            municipality: string,
        ) => {
            const detail = locationDetails.find(
                (d) =>
                    d.region === region &&
                    d.province === province &&
                    d.municipality === municipality,
            );
            if (detail) {
                return {
                    latitude: detail.latitude,
                    longitude: detail.longitude,
                };
            }
            return getProvinceCoords(region, province);
        };

        const addPesticideData = (
            existing: LocationData | undefined,
            type: string,
            quantity: number,
            unit: string,
        ): LocationData['pesticideData'] => {
            const list = existing?.pesticideData
                ? [...existing.pesticideData]
                : [];
            const found = list.find((p) => p.type === type && p.unit === unit);
            if (found) {
                found.quantity += quantity;
            } else {
                list.push({ type, quantity, unit });
            }
            return list;
        };

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

            const quantity = Number(distribution.quantity || 0);
            const pesticideType =
                distribution.pesticide?.type_of_pesticide || 'Unknown';
            const unit = distribution.pesticide?.unit || 'units';

            // ---- Region level aggregation ----
            if (region && region !== 'Unknown') {
                const existingRegion = regionMap.get(region);
                const regionCoords = getRegionCoords(region);
                regionMap.set(region, {
                    id: region,
                    name: region,
                    latitude: existingRegion?.latitude || regionCoords.latitude,
                    longitude:
                        existingRegion?.longitude || regionCoords.longitude,
                    value: (existingRegion?.value || 0) + quantity,
                    label: 'Distribution Data',
                    description: `${(existingRegion?.value || 0) + quantity} total units distributed`,
                    region,
                    province: existingRegion?.province,
                    municipality: existingRegion?.municipality,
                    barangay: existingRegion?.barangay,
                    pesticideData: addPesticideData(
                        existingRegion,
                        pesticideType,
                        quantity,
                        unit,
                    ),
                });
            }

            // ---- Province level aggregation ----
            if (province && province !== 'Unknown') {
                const key = `${region}::${province}`;
                const existingProvince = provinceMap.get(key);
                const coords = getProvinceCoords(region, province);
                provinceMap.set(key, {
                    id: key,
                    name: province,
                    latitude: existingProvince?.latitude || coords.latitude,
                    longitude: existingProvince?.longitude || coords.longitude,
                    value: (existingProvince?.value || 0) + quantity,
                    label: 'Distribution Data',
                    description: `${(existingProvince?.value || 0) + quantity} total units distributed`,
                    region,
                    province,
                    municipality: existingProvince?.municipality,
                    barangay: existingProvince?.barangay,
                    pesticideData: addPesticideData(
                        existingProvince,
                        pesticideType,
                        quantity,
                        unit,
                    ),
                });
            }

            // ---- Municipality level aggregation ----
            if (municipality && municipality !== 'Unknown') {
                const key = `${region}::${province}::${municipality}`;
                const existingMunicipality = municipalityMap.get(key);
                const coords = getMunicipalityCoords(
                    region,
                    province,
                    municipality,
                );
                municipalityMap.set(key, {
                    id: key,
                    name: municipality,
                    latitude: existingMunicipality?.latitude || coords.latitude,
                    longitude:
                        existingMunicipality?.longitude || coords.longitude,
                    value: (existingMunicipality?.value || 0) + quantity,
                    label: 'Distribution Data',
                    description: `${(existingMunicipality?.value || 0) + quantity} total units distributed`,
                    region,
                    province,
                    municipality,
                    barangay,
                    pesticideData: addPesticideData(
                        existingMunicipality,
                        pesticideType,
                        quantity,
                        unit,
                    ),
                });
            }
        });

        // ---- Add all NCR cities to municipality data for comprehensive mapping ----
        Object.entries(NCR_CITIES).forEach(([cityName, coords]) => {
            const key = `National Capital Region (NCR)::NCR::${cityName}`;
            
            // Check if we already have data for this city from distributions
            const existingCity = municipalityMap.get(key);
            
            // Add the city even if no distribution data exists (for complete map visualization)
            municipalityMap.set(key, {
                id: key,
                name: cityName,
                latitude: existingCity?.latitude || coords.lat,
                longitude: existingCity?.longitude || coords.lng,
                value: existingCity?.value || 0,
                label: 'Distribution Data',
                description: existingCity?.description || 'No distribution data available',
                region: 'National Capital Region (NCR)',
                province: 'NCR',
                municipality: cityName,
                barangay: existingCity?.barangay,
                pesticideData: existingCity?.pesticideData || [],
            });
        });

        return {
            regionData: Array.from(regionMap.values()),
            provinceData: Array.from(provinceMap.values()),
            municipalityData: Array.from(municipalityMap.values()),
        };
    }, [distributions, locationDetails, NCR_CITIES]);

    // Pick dataset based on selected admin level
    const mapData = useMemo(() => {
        if (adminLevel === 'province') {
            return provinceData.map((item) => ({
                ...item,
                name: item.province || item.name,
                region: item.region || extractRegionFromLocation(item.name),
            }));
        }
        if (adminLevel === 'municipality') {
            return municipalityData.map((item) => ({
                ...item,
                name: item.municipality || item.name,
                province:
                    item.province || extractProvinceFromLocation(item.name),
                region: item.region || extractRegionFromLocation(item.name),
            }));
        }
        // For region level
        return regionData.map((item) => ({
            ...item,
            name: item.region || item.name,
            region: item.region || item.name,
        }));
    }, [adminLevel, regionData, provinceData, municipalityData]);

    // Filter data based on selected filters and search
    const filteredMapData = useMemo(() => {
        let filtered = mapData;

        if (selectedRegion !== 'all') {
            filtered = filtered.filter(
                (item) => item.region === selectedRegion,
            );
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.name.toLowerCase().includes(query) ||
                    item.region?.toLowerCase().includes(query) ||
                    item.province?.toLowerCase().includes(query) ||
                    item.municipality?.toLowerCase().includes(query) ||
                    (item.description?.toLowerCase().includes(query) ?? false),
            );
        }

        return filtered;
    }, [mapData, selectedRegion, searchQuery]);

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

    // Get paginated data for table view
    const paginatedTableData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredMapData
            .sort((a, b) => b.value - a.value)
            .slice(startIndex, endIndex);
    }, [filteredMapData, currentPage]);

    // Reset current page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, []);

    // Generate line chart data for distribution trends over time
    const lineChartData = useMemo(() => {
        // Get unique pesticide types from the data
        const pesticideTypes = [
            ...new Set(
                distributions?.data
                    ?.map((d) => d.pesticide?.type_of_pesticide)
                    .filter((type): type is string => Boolean(type)) || [],
            ),
        ].slice(0, 5); // Limit to top 5 for readability

        // Group distributions by month, year, and pesticide type
        const monthlyData: Record<string, Record<string, number>> = {};

        // Initialize all months with zero values
        const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        months.forEach((month) => {
            monthlyData[month] = {};
            pesticideTypes.forEach((type) => {
                monthlyData[month][type] = 0;
            });
        });

        // Process actual distribution data
        distributions?.data?.forEach((distribution) => {
            if (
                distribution.received_date &&
                distribution.pesticide?.type_of_pesticide
            ) {
                const date = new Date(distribution.received_date);
                const month = months[date.getMonth()]; // Get month name
                const year = date.getFullYear(); // Get year
                const pesticideType = distribution.pesticide.type_of_pesticide;

                // Only include data from the selected year
                if (
                    year === chartYear &&
                    pesticideTypes.includes(pesticideType) &&
                    monthlyData[month]
                ) {
                    monthlyData[month][pesticideType] += Number(
                        distribution.quantity || 0,
                    );
                }
            }
        });

        // Convert to array format for chart
        const chartData = months.map((month) => ({
            month,
            ...monthlyData[month],
        }));

        return { data: chartData, pesticideTypes, monthlyData };
    }, [distributions, chartYear]);

    // Generate trend data for statistics
    // const trendData = useMemo(() => {
    //     // Calculate current period totals
    //     const currentTotal = filteredMapData.reduce((sum, item) => sum + item.value, 0);
    //     const currentAvg = filteredMapData.length > 0 ? Math.round(currentTotal / filteredMapData.length) : 0;
    //     const currentLocations = filteredMapData.length;

    //     // Simulate previous period data (you can replace this with actual historical data)
    //     const previousTotal = Math.round(currentTotal * 0.85); // Simulate 15% growth
    //     const previousAvg = Math.round(currentAvg * 0.9);
    //     const previousLocations = Math.max(0, currentLocations - 2);

    //     return [
    //         {
    //             label: 'Total Distribution',
    //             value: currentTotal,
    //             previousValue: previousTotal,
    //             trend: (currentTotal > previousTotal ? 'up' : currentTotal < previousTotal ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    //             unit: 'units'
    //         },
    //         {
    //             label: 'Average per Location',
    //             value: currentAvg,
    //             previousValue: previousAvg,
    //             trend: (currentAvg > previousAvg ? 'up' : currentAvg < previousAvg ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    //             unit: 'units'
    //         },
    //         {
    //             label: 'Active Locations',
    //             value: currentLocations,
    //             previousValue: previousLocations,
    //             trend: (currentLocations > previousLocations ? 'up' : currentLocations < previousLocations ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    //             unit: ''
    //         }
    //     ];
    // }, [filteredMapData]);

    const handleLocationClick = () => {
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
                                ? 'bg-[#1E514B] text-white hover:bg-[#1E514B]/90 dark:text-white'
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
                                ? 'bg-[#1E514B] text-white hover:bg-[#1E514B]/90 dark:text-white'
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
            <Card className="border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>

                    {/* Admin level toggle: Region / Provincial / Municipal */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant={
                                adminLevel === 'region' ? 'default' : 'outline'
                            }
                            className={
                                adminLevel === 'region'
                                    ? 'bg-[#1E514B] text-white hover:bg-[#1E514B]/90 dark:text-white'
                                    : ''
                            }
                            size="sm"
                            onClick={() => setAdminLevel('region')}
                        >
                            Region
                        </Button>
                        <Button
                            variant={
                                adminLevel === 'province'
                                    ? 'default'
                                    : 'outline'
                            }
                            className={
                                adminLevel === 'province'
                                    ? 'bg-[#1E514B] text-white hover:bg-[#1E514B]/90 dark:text-white'
                                    : ''
                            }
                            size="sm"
                            onClick={() => setAdminLevel('province')}
                        >
                            Provincial
                        </Button>
                        <Button
                            variant={
                                adminLevel === 'municipality'
                                    ? 'default'
                                    : 'outline'
                            }
                            className={
                                adminLevel === 'municipality'
                                    ? 'bg-[#1E514B] text-white hover:bg-[#1E514B]/90 dark:text-white'
                                    : ''
                            }
                            size="sm"
                            onClick={() => setAdminLevel('municipality')}
                        >
                            Municipal
                        </Button>
                    </div>

                    {/* Region filter dropdown */}
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
                            selectedRegion={selectedRegion}
                            adminLevel={adminLevel}
                        />
                    </div>

                    {/* Top Locations Sidebar */}
                    <div className="space-y-4">
                        <Card className="border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
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

                        <Card className="border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
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
                <div className="overflow-x-auto">
                    <Card className="mt-4 border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900">
                        <div className="p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold">
                                    Location Distribution Details
                                </h3>
                                <div className="w-64">
                                    <SearchBar
                                        search={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        placeholder="Search locations..."
                                    />
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Region</TableHead>
                                        {adminLevel !== 'region' && (
                                            <TableHead>Province</TableHead>
                                        )}
                                        {adminLevel === 'municipality' && (
                                            <TableHead>Municipality</TableHead>
                                        )}
                                        <TableHead className="text-right">
                                            Quantity
                                        </TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedTableData.map((location) => (
                                        <TableRow key={location.id}>
                                            <TableCell className="font-medium">
                                                {adminLevel === 'region'
                                                    ? location.region ||
                                                      location.name
                                                    : adminLevel === 'province'
                                                      ? location.province ||
                                                        location.name
                                                      : location.municipality ||
                                                        location.name}
                                            </TableCell>
                                            <TableCell>
                                                {location.region || 'N/A'}
                                            </TableCell>
                                            {adminLevel !== 'region' && (
                                                <TableCell>
                                                    {location.province || 'N/A'}
                                                </TableCell>
                                            )}
                                            {adminLevel === 'municipality' && (
                                                <TableCell>
                                                    {location.municipality ||
                                                        'N/A'}
                                                </TableCell>
                                            )}
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
                            {filteredMapData.length > 0 && (
                                <div className="mt-4">
                                    <CustomPagination
                                        currentPage={currentPage}
                                        totalItems={filteredMapData.length}
                                        perPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Statistics Trend Section - Only show in table view */}
            {viewMode === 'table' && (
                <>
                    {/* Line Chart Section */}
                    <DistributionLineChart
                        title="Pesticide Distribution Trend"
                        data={lineChartData.data}
                        distributions={distributions?.data}
                        lines={lineChartData.pesticideTypes.map(
                            (type, index) => ({
                                dataKey: type,
                                name: type,
                                color: [
                                    '#10b981', // emerald-500
                                    '#3b82f6', // blue-500
                                    '#f59e0b', // amber-500
                                    '#ef4444', // red-500
                                    '#8b5cf6', // violet-500
                                ][index % 5],
                            }),
                        )}
                        height={350}
                        className="mt-6"
                        onYearChange={setChartYear}
                        // onMonthChange={setChartMonth}
                        // onViewTypeChange={setChartViewType}
                    />
                </>
            )}
        </div>
    );
}
