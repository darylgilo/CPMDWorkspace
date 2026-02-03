import PhilippineLocationSelector from '@/components/PhilippineLocationSelector';
import { useState } from 'react';

export default function LocationTest() {
    const [location, setLocation] = useState('');
    const [locationIds, setLocationIds] = useState({});

    return (
        <div className="mx-auto max-w-2xl p-8">
            <h1 className="mb-6 text-2xl font-bold">
                Philippine Location Selector Test
            </h1>

            <div className="space-y-4">
                <PhilippineLocationSelector
                    value={location}
                    onChange={setLocation}
                    onLocationSelect={setLocationIds}
                    required={true}
                />

                <div className="mt-6 rounded-lg bg-gray-100 p-4">
                    <h2 className="mb-2 text-lg font-semibold">
                        Selected Location:
                    </h2>
                    <p className="text-sm">
                        {location || 'No location selected'}
                    </p>

                    <h2 className="mt-4 mb-2 text-lg font-semibold">
                        Location IDs:
                    </h2>
                    <pre className="rounded bg-white p-2 text-xs">
                        {JSON.stringify(locationIds, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
