import PhilippineLocationSelector from '@/components/PhilippineLocationSelector';
import { useState } from 'react';

export default function LocationTest() {
    const [location, setLocation] = useState('');
    const [locationIds, setLocationIds] = useState({});

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Philippine Location Selector Test</h1>
            
            <div className="space-y-4">
                <PhilippineLocationSelector
                    value={location}
                    onChange={setLocation}
                    onLocationSelect={setLocationIds}
                    required={true}
                />
                
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Selected Location:</h2>
                    <p className="text-sm">{location || 'No location selected'}</p>
                    
                    <h2 className="text-lg font-semibold mt-4 mb-2">Location IDs:</h2>
                    <pre className="text-xs bg-white p-2 rounded">
                        {JSON.stringify(locationIds, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
