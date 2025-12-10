import React, { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Region {
    REGION_ID: string;
    REGION: string;
}

interface Province {
    PROVINCE_ID: string;
    PROVINCE: string;
    REGION: string;
    REGION_ID: string;
}

interface Municipality {
    MUNICIPALITY_ID: string;
    MUNICIPALITY: string;
    PROVINCE: string;
    PROVINCE_ID: string;
}

interface Barangay {
    BARANGAY_ID: string;
    BARANGAY: string;
    MUNICIPALITY: string;
    MUNICIPALITY_ID: string;
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
function parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    return lines.slice(1).map(line => {
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

        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    }).filter(obj => Object.values(obj).some(v => v !== ''));
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
    const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
    const [selectedBarangay, setSelectedBarangay] = useState<string>('');

    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);

    const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
    const [filteredMunicipalities, setFilteredMunicipalities] = useState<Municipality[]>([]);
    const [filteredBarangays, setFilteredBarangays] = useState<Barangay[]>([]);

    const [loading, setLoading] = useState(true);

    // Load all CSV data on component mount
    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);

                // Load all CSV files in parallel
                const [regionsRes, provincesRes, municipalitiesRes, barangaysRes] = await Promise.all([
                    fetch('/csv/regions.csv'),
                    fetch('/csv/provinces.csv'),
                    fetch('/csv/municipalities.csv'),
                    fetch('/csv/barangays.csv'),
                ]);

                const [regionsText, provincesText, municipalitiesText, barangaysText] = await Promise.all([
                    regionsRes.text(),
                    provincesRes.text(),
                    municipalitiesRes.text(),
                    barangaysRes.text(),
                ]);

                // Parse CSV data
                const regionsData = parseCSV(regionsText) as Region[];
                const provincesData = parseCSV(provincesText) as Province[];
                const municipalitiesData = parseCSV(municipalitiesText) as Municipality[];
                const barangaysData = parseCSV(barangaysText) as Barangay[];

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
                (p) => p.REGION_ID === selectedRegion
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
                (m) => m.PROVINCE_ID === selectedProvince
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
                (b) => b.MUNICIPALITY_ID === selectedMunicipality
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
            if (initialIds.provinceId && initialIds.provinceId !== selectedProvince) {
                setSelectedProvince(initialIds.provinceId);
            }
            if (initialIds.municipalityId && initialIds.municipalityId !== selectedMunicipality) {
                setSelectedMunicipality(initialIds.municipalityId);
            }
            if (initialIds.barangayId && initialIds.barangayId !== selectedBarangay) {
                setSelectedBarangay(initialIds.barangayId);
            }
            return;
        }

        // Fallback to parsing string value if no IDs and no current selection
        if (value && !selectedRegion && !selectedProvince && !selectedMunicipality && !selectedBarangay) {
            // Parse the location string (format: "Barangay, Municipality, Province, Region")
            const parts = value.split(',').map(part => part.trim());

            if (parts.length >= 2) {
                // ... (Existing parsing logic) ...
                // Re-implementation is safer to ensure it works
                // If we have 4 parts, it includes barangay
                let foundBarangay: Barangay | undefined,
                    foundMunicipality: Municipality | undefined,
                    foundProvince: Province | undefined,
                    foundRegion: Region | undefined;

                if (parts.length === 4) {
                    const [barangayName, municipalityName, provinceName, regionName] = parts;
                    foundRegion = regions.find(r => r.REGION.toLowerCase() === regionName.toLowerCase());
                    if (foundRegion) {
                        foundProvince = provinces.find(p =>
                            p.PROVINCE.toLowerCase() === provinceName.toLowerCase() &&
                            p.REGION_ID === foundRegion!.REGION_ID
                        );
                        if (foundProvince) {
                            foundMunicipality = municipalities.find(m =>
                                m.MUNICIPALITY.toLowerCase() === municipalityName.toLowerCase() &&
                                m.PROVINCE_ID === foundProvince!.PROVINCE_ID
                            );
                            if (foundMunicipality) {
                                foundBarangay = barangays.find(b =>
                                    b.BARANGAY.toLowerCase() === barangayName.toLowerCase() &&
                                    b.MUNICIPALITY_ID === foundMunicipality!.MUNICIPALITY_ID
                                );
                            }
                        }
                    }
                }
                else if (parts.length === 3) {
                    const [municipalityName, provinceName, regionName] = parts;
                    foundRegion = regions.find(r => r.REGION.toLowerCase() === regionName.toLowerCase());
                    if (foundRegion) {
                        foundProvince = provinces.find(p =>
                            p.PROVINCE.toLowerCase() === provinceName.toLowerCase() &&
                            p.REGION_ID === foundRegion!.REGION_ID
                        );
                        if (foundProvince) {
                            foundMunicipality = municipalities.find(m =>
                                m.MUNICIPALITY.toLowerCase() === municipalityName.toLowerCase() &&
                                m.PROVINCE_ID === foundProvince!.PROVINCE_ID
                            );
                        }
                    }
                }

                if (foundRegion) {
                    setSelectedRegion(foundRegion.REGION_ID);
                    if (foundProvince) setSelectedProvince(foundProvince.PROVINCE_ID);
                    if (foundMunicipality) setSelectedMunicipality(foundMunicipality.MUNICIPALITY_ID);
                    if (foundBarangay) setSelectedBarangay(foundBarangay.BARANGAY_ID);
                }
            }
        }
    }, [value, initialIds, loading, regions, provinces, municipalities, barangays, selectedRegion, selectedProvince, selectedMunicipality, selectedBarangay]);

    // Update parent component when location changes
    useEffect(() => {
        // Emit structured IDs
        if (onLocationSelect) {
            onLocationSelect({
                regionId: selectedRegion,
                provinceId: selectedProvince,
                municipalityId: selectedMunicipality,
                barangayId: selectedBarangay
            });
        }

        // Emit string value (Legacy/Display support)
        if (selectedBarangay || selectedMunicipality) {
            const region = regions.find((r) => r.REGION_ID === selectedRegion);
            const province = provinces.find((p) => p.PROVINCE_ID === selectedProvince);
            const municipality = municipalities.find((m) => m.MUNICIPALITY_ID === selectedMunicipality);
            const barangay = barangays.find((b) => b.BARANGAY_ID === selectedBarangay);

            const parts = [
                barangay?.BARANGAY,
                municipality?.MUNICIPALITY,
                province?.PROVINCE,
                region?.REGION,
            ].filter(Boolean);

            const locationString = parts.join(', ');

            // Only fire onChange if value actually changed/is different (prevents infinite loops if parent updates value)
            if (locationString && locationString !== value) {
                onChange(locationString);
            }
        }
    }, [selectedRegion, selectedProvince, selectedMunicipality, selectedBarangay, regions, provinces, municipalities, barangays, onLocationSelect, onChange, value]);

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
                <p className="text-sm text-muted-foreground">Loading locations...</p>
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
                    <SelectTrigger id="region" className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                        <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {regions.map((region) => (
                            <SelectItem key={region.REGION_ID} value={region.REGION_ID}>
                                {region.REGION}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Province */}
            <div className="space-y-2">
                <Label htmlFor="province">
                    Province {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={selectedProvince}
                    onValueChange={handleProvinceChange}
                    disabled={disabled || !selectedRegion}
                    required={required}
                >
                    <SelectTrigger id="province" className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                        <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {filteredProvinces.map((province) => (
                            <SelectItem key={province.PROVINCE_ID} value={province.PROVINCE_ID}>
                                {province.PROVINCE}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Municipality/City */}
            <div className="space-y-2">
                <Label htmlFor="municipality">
                    Municipality/City {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={selectedMunicipality}
                    onValueChange={handleMunicipalityChange}
                    disabled={disabled || !selectedProvince}
                    required={required}
                >
                    <SelectTrigger id="municipality" className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                        <SelectValue placeholder="Select Municipality/City" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {filteredMunicipalities.map((municipality) => (
                            <SelectItem key={municipality.MUNICIPALITY_ID} value={municipality.MUNICIPALITY_ID}>
                                {municipality.MUNICIPALITY}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Barangay */}
            <div className="space-y-2">
                <Label htmlFor="barangay">
                    Barangay {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                    value={selectedBarangay}
                    onValueChange={setSelectedBarangay}
                    disabled={disabled || !selectedMunicipality}
                    required={required}
                >
                    <SelectTrigger id="barangay" className="border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                        <SelectValue placeholder="Select Barangay" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 dark:border-neutral-700 dark:bg-neutral-900">
                        {filteredBarangays.map((barangay) => (
                            <SelectItem key={barangay.BARANGAY_ID} value={barangay.BARANGAY_ID}>
                                {barangay.BARANGAY}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
