import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

interface Region {
    adm1_psgc: string;
    adm1_en: string;
}

interface Province {
    adm1_psgc: string;
    adm2_psgc: string;
    adm2_en: string;
    geo_level: string;
}

interface Municipality {
    adm1_psgc: string;
    adm2_psgc: string;
    adm3_psgc: string;
    adm3_en: string;
    geo_level: string;
}

interface Barangay {
    adm1_psgc: string;
    adm2_psgc: string;
    adm3_psgc: string;
    adm4_psgc: string;
    adm4_en: string;
    geo_level: string;
}

interface LocationIds {
    regionId?: string;
    provinceId?: string;
    municipalityId?: string;
    barangayId?: string;
}

interface PhilippineLocationSelectorProps {
    value?: string;
    initialIds?: LocationIds;
    onChange: (location: string) => void;
    onLocationSelect?: (ids: LocationIds) => void;
    required?: boolean;
    disabled?: boolean;
}

// Helper function to parse CSV
function parseCSV(csvText: string): Record<string, string>[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());

    return lines
        .slice(1)
        .map((line) => {
            // Handle quoted values that may contain commas
            const values: string[] = [];
            let currentValue = '';
            let insideQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());

            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            return obj;
        })
        .filter((obj) => Object.values(obj).some((v) => v !== ''));
}

export default function PhilippineLocationSelector({
    value = '',
    initialIds,
    onChange,
    onLocationSelect,
    required = false,
    disabled = false,
}: PhilippineLocationSelectorProps) {
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedMunicipality, setSelectedMunicipality] =
        useState<string>('');
    const [selectedBarangay, setSelectedBarangay] = useState<string>('');

    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);

    const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
    const [filteredMunicipalities, setFilteredMunicipalities] = useState<
        Municipality[]
    >([]);
    const [filteredBarangays, setFilteredBarangays] = useState<Barangay[]>([]);

    const [loading, setLoading] = useState(true);

    // Load all CSV data on component mount
    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);

                // Load all CSV files in parallel
                const [
                    regionsRes,
                    provincesRes,
                    municipalitiesRes,
                    barangaysRes,
                ] = await Promise.all([
                    fetch('/csv/PH_Adm1_Regions.csv'),
                    fetch('/csv/PH_Adm2_ProvDists.csv'),
                    fetch('/csv/PH_Adm3_MuniCities.csv'),
                    fetch('/csv/PH_Adm4_BgySubMuns.csv'),
                ]);

                const [
                    regionsText,
                    provincesText,
                    municipalitiesText,
                    barangaysText,
                ] = await Promise.all([
                    regionsRes.text(),
                    provincesRes.text(),
                    municipalitiesRes.text(),
                    barangaysRes.text(),
                ]);

                // Parse CSV data
                const regionsData = parseCSV(
                    regionsText,
                ) as unknown as Region[];
                const provincesData = parseCSV(
                    provincesText,
                ) as unknown as Province[];
                const municipalitiesData = parseCSV(
                    municipalitiesText,
                ) as unknown as Municipality[];
                const barangaysData = parseCSV(
                    barangaysText,
                ) as unknown as Barangay[];

                setRegions(regionsData);
                setProvinces(provincesData);
                setMunicipalities(municipalitiesData);
                setBarangays(barangaysData);

                setLoading(false);
            } catch (error) {
                console.error('Error loading location data:', error);
                setLoading(false);
            }
        };

        loadAllData();
    }, []);

    // Filter provinces when region is selected
    useEffect(() => {
        if (selectedRegion && provinces.length > 0) {
            const filtered = provinces.filter(
                (p) => p.adm1_psgc === selectedRegion && p.geo_level === 'Prov',
            );
            setFilteredProvinces(filtered);
        } else {
            setFilteredProvinces([]);
            if (!selectedRegion) setSelectedProvince(''); // Only clear if region cleared, prevent loop if setting from ID
        }
    }, [selectedRegion, provinces]);

    // Filter municipalities when province is selected
    useEffect(() => {
        if (selectedProvince && municipalities.length > 0) {
            const filtered = municipalities.filter(
                (m) => m.adm2_psgc === selectedProvince,
            );
            setFilteredMunicipalities(filtered);
        } else {
            setFilteredMunicipalities([]);
            if (!selectedProvince) setSelectedMunicipality('');
        }
    }, [selectedProvince, municipalities]);

    // Filter barangays when municipality is selected
    useEffect(() => {
        if (selectedMunicipality && barangays.length > 0) {
            const filtered = barangays.filter(
                (b) => b.adm3_psgc === selectedMunicipality,
            );
            setFilteredBarangays(filtered);
        } else {
            setFilteredBarangays([]);
            if (!selectedMunicipality) setSelectedBarangay('');
        }
    }, [selectedMunicipality, barangays]);

    // Parse incoming value/IDs and set initial selections
    useEffect(() => {
        if (loading || regions.length === 0) return;

        // Prefer structured IDs if available
        if (initialIds) {
            // Check if we need to update to avoid infinite loops or overwriting user selection
            // We use a simple check: if the passed initialIds are different from current state, update.
            // But beware: initialIds might be invariant.

            if (initialIds.regionId && initialIds.regionId !== selectedRegion) {
                setSelectedRegion(initialIds.regionId);
            }
            // Cascading updates (province depends on region) happen via other effects or need manual setting?
            // Since we load all data at once, we can set all IDs at once.
            if (
                initialIds.provinceId &&
                initialIds.provinceId !== selectedProvince
            ) {
                setSelectedProvince(initialIds.provinceId);
            }
            if (
                initialIds.municipalityId &&
                initialIds.municipalityId !== selectedMunicipality
            ) {
                setSelectedMunicipality(initialIds.municipalityId);
            }
            if (
                initialIds.barangayId &&
                initialIds.barangayId !== selectedBarangay
            ) {
                setSelectedBarangay(initialIds.barangayId);
            }
            return;
        }

        // Fallback to parsing string value if no IDs and no current selection
        if (
            value &&
            !selectedRegion &&
            !selectedProvince &&
            !selectedMunicipality &&
            !selectedBarangay
        ) {
            // Parse the location string (format: "Barangay, Municipality, Province, Region")
            const parts = value.split(',').map((part) => part.trim());

            if (parts.length >= 2) {
                // ... (Existing parsing logic) ...
                // Re-implementation is safer to ensure it works
                // If we have 4 parts, it includes barangay
                let foundBarangay: Barangay | undefined,
                    foundMunicipality: Municipality | undefined,
                    foundProvince: Province | undefined,
                    foundRegion: Region | undefined;

                if (parts.length === 4) {
                    const [
                        barangayName,
                        municipalityName,
                        provinceName,
                        regionName,
                    ] = parts;
                    foundRegion = regions.find(
                        (r) =>
                            r.adm1_en.toLowerCase() ===
                            regionName.toLowerCase(),
                    );
                    if (foundRegion) {
                        foundProvince = provinces.find(
                            (p) =>
                                p.adm2_en.toLowerCase() ===
                                    provinceName.toLowerCase() &&
                                p.adm1_psgc === foundRegion!.adm1_psgc,
                        );
                        if (foundProvince) {
                            foundMunicipality = municipalities.find(
                                (m) =>
                                    m.adm3_en.toLowerCase() ===
                                        municipalityName.toLowerCase() &&
                                    m.adm2_psgc === foundProvince!.adm2_psgc,
                            );
                            if (foundMunicipality) {
                                foundBarangay = barangays.find(
                                    (b) =>
                                        b.adm4_en.toLowerCase() ===
                                            barangayName.toLowerCase() &&
                                        b.adm3_psgc ===
                                            foundMunicipality!.adm3_psgc,
                                );
                            }
                        }
                    }
                } else if (parts.length === 3) {
                    const [municipalityName, provinceName, regionName] = parts;
                    foundRegion = regions.find(
                        (r) =>
                            r.adm1_en.toLowerCase() ===
                            regionName.toLowerCase(),
                    );
                    if (foundRegion) {
                        foundProvince = provinces.find(
                            (p) =>
                                p.adm2_en.toLowerCase() ===
                                    provinceName.toLowerCase() &&
                                p.adm1_psgc === foundRegion!.adm1_psgc,
                        );
                        if (foundProvince) {
                            foundMunicipality = municipalities.find(
                                (m) =>
                                    m.adm3_en.toLowerCase() ===
                                        municipalityName.toLowerCase() &&
                                    m.adm2_psgc === foundProvince!.adm2_psgc,
                            );
                        }
                    }
                }

                if (foundRegion) {
                    setSelectedRegion(foundRegion.adm1_psgc);
                    if (foundProvince)
                        setSelectedProvince(foundProvince.adm2_psgc);
                    if (foundMunicipality)
                        setSelectedMunicipality(foundMunicipality.adm3_psgc);
                    if (foundBarangay)
                        setSelectedBarangay(foundBarangay.adm4_psgc);
                }
            }
        }
    }, [
        value,
        initialIds,
        loading,
        regions,
        provinces,
        municipalities,
        barangays,
        selectedRegion,
        selectedProvince,
        selectedMunicipality,
        selectedBarangay,
    ]);

    // Update parent component when location changes
    useEffect(() => {
        // Emit structured IDs
        if (onLocationSelect) {
            onLocationSelect({
                regionId: selectedRegion,
                provinceId: selectedProvince,
                municipalityId: selectedMunicipality,
                barangayId: selectedBarangay,
            });
        }

        // Emit string value (Legacy/Display support)
        if (selectedBarangay || selectedMunicipality) {
            const region = regions.find((r) => r.adm1_psgc === selectedRegion);
            const province = provinces.find(
                (p) => p.adm2_psgc === selectedProvince,
            );
            const municipality = municipalities.find(
                (m) => m.adm3_psgc === selectedMunicipality,
            );
            const barangay = barangays.find(
                (b) => b.adm4_psgc === selectedBarangay,
            );

            const parts = [
                barangay?.adm4_en,
                municipality?.adm3_en,
                province?.adm2_en,
                region?.adm1_en,
            ].filter(Boolean);

            const locationString = parts.join(', ');

            // Only fire onChange if value actually changed/is different (prevents infinite loops if parent updates value)
            if (locationString && locationString !== value) {
                onChange(locationString);
            }
        }
    }, [
        selectedRegion,
        selectedProvince,
        selectedMunicipality,
        selectedBarangay,
        regions,
        provinces,
        municipalities,
        barangays,
        onLocationSelect,
        onChange,
        value,
    ]);

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value);
        setSelectedProvince('');
        setSelectedMunicipality('');
        setSelectedBarangay('');
        setFilteredProvinces([]);
        setFilteredMunicipalities([]);
        setFilteredBarangays([]);
    };

    const handleProvinceChange = (value: string) => {
        setSelectedProvince(value);
        setSelectedMunicipality('');
        setSelectedBarangay('');
        setFilteredMunicipalities([]);
        setFilteredBarangays([]);
    };

    const handleMunicipalityChange = (value: string) => {
        setSelectedMunicipality(value);
        setSelectedBarangay('');
        setFilteredBarangays([]);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Loading locations...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Region */}
            <div className="space-y-2">
                <Label htmlFor="region">
                    Region {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={selectedRegion}
                    onValueChange={handleRegionChange}
                    disabled={disabled}
                    required={required}
                >
                    <SelectTrigger
                        id="region"
                        className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950"
                    >
                        <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {regions.map((region) => (
                            <SelectItem
                                key={region.adm1_psgc}
                                value={region.adm1_psgc}
                            >
                                {region.adm1_en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Province */}
            <div className="space-y-2">
                <Label htmlFor="province">
                    Province{' '}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={selectedProvince}
                    onValueChange={handleProvinceChange}
                    disabled={disabled || !selectedRegion}
                    required={required}
                >
                    <SelectTrigger
                        id="province"
                        className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950"
                    >
                        <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {filteredProvinces.map((province) => (
                            <SelectItem
                                key={province.adm2_psgc}
                                value={province.adm2_psgc}
                            >
                                {province.adm2_en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Municipality/City */}
            <div className="space-y-2">
                <Label htmlFor="municipality">
                    Municipality/City{' '}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={selectedMunicipality}
                    onValueChange={handleMunicipalityChange}
                    disabled={disabled || !selectedProvince}
                    required={required}
                >
                    <SelectTrigger
                        id="municipality"
                        className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950"
                    >
                        <SelectValue placeholder="Select Municipality/City" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {filteredMunicipalities.map((municipality) => (
                            <SelectItem
                                key={municipality.adm3_psgc}
                                value={municipality.adm3_psgc}
                            >
                                {municipality.adm3_en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Barangay */}
            <div className="space-y-2">
                <Label htmlFor="barangay">
                    Barangay{' '}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={selectedBarangay}
                    onValueChange={setSelectedBarangay}
                    disabled={disabled || !selectedMunicipality}
                    required={required}
                >
                    <SelectTrigger
                        id="barangay"
                        className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950"
                    >
                        <SelectValue placeholder="Select Barangay" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {filteredBarangays.map((barangay) => (
                            <SelectItem
                                key={barangay.adm4_psgc}
                                value={barangay.adm4_psgc}
                            >
                                {barangay.adm4_en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
