<?php

namespace App\Http\Controllers\PesticideManagement;

use App\Http\Controllers\Controller;
use App\Models\Distribution;
use App\Models\Pesticide;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DistributionController extends Controller
{
    /**
     * Display a listing of distributions.
     */
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        
        $query = Distribution::with(['user', 'pesticide'])
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->whereHas('pesticide', function($q) use ($search) {
                        $q->where('brand_name', 'like', "%{$search}%")
                          ->orWhere('type_of_pesticide', 'like', "%{$search}%");
                    })
                    ->orWhere('travel_purpose', 'like', "%{$search}%")
                    ->orWhere('received_by', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc');

        $distributions = $query->paginate($perPage);

        // Calculate analytics
        $analytics = [
            'totalDistributions' => Distribution::count(),
            'totalDistributed' => Distribution::sum('quantity'),
            'thisMonth' => Distribution::whereMonth('created_at', now()->month)->count(),
            'thisWeek' => Distribution::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
        ];

        // Get available pesticides with stock
        $pesticides = Pesticide::where('stock', '>', 0)
            ->orderBy('type_of_pesticide')
            ->orderBy('brand_name')
            ->get()
            ->map(function ($pesticide) {
                return [
                    'id' => $pesticide->id,
                    'brand_name' => $pesticide->brand_name,
                    'type_of_pesticide' => $pesticide->type_of_pesticide,
                    'stock' => $pesticide->stock,
                    'unit' => $pesticide->unit,
                ];
            });

        return Inertia::render('PesticideInventory/Distribution', [
            'distributions' => $distributions,
            'pesticides' => $pesticides,
            'search' => $search,
            'perPage' => $perPage,
            'analytics' => $analytics,
        ]);
    }

    /**
     * Store a newly created distribution.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pesticide_id' => 'required|exists:pesticides,id',
            'quantity' => 'required|numeric|min:0.01',
            'travel_purpose' => 'required|string|max:255',
            'travel_location' => 'required|string|max:255',
            'received_by' => 'required|string|max:255',
            'received_date' => 'required|date',
        ]);

        // Parse location from travel_location string and get IDs
        $locationIds = $this->getLocationIdsFromString($validated['travel_location']);
        
        // Merge location IDs with validated data
        $data = array_merge($validated, $locationIds);

        DB::beginTransaction();
        try {
            // Get the specific pesticide
            $pesticide = Pesticide::findOrFail($validated['pesticide_id']);
            
            // Check if enough stock is available
            if ($pesticide->stock < $validated['quantity']) {
                return back()
                    ->with('error', 'Insufficient stock available. Current stock: ' . $pesticide->stock . ' ' . $pesticide->unit);
            }

            // Create distribution record
            Distribution::create(array_merge($data, ['user_id' => auth()->id()]));

            // Update pesticide stock
            $pesticide->stock -= $validated['quantity'];
            $pesticide->save();

            DB::commit();

            return Inertia::location('/pesticidesindex?tab=distribution');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to record distribution: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified distribution.
     */
    public function update(Request $request, Distribution $distribution)
    {
        $validated = $request->validate([
            'pesticide_id' => 'required|exists:pesticides,id',
            'quantity' => 'required|numeric|min:0.01',
            'travel_purpose' => 'required|string|max:255',
            'travel_location' => 'required|string|max:255',
            'received_by' => 'required|string|max:255',
            'received_date' => 'required|date',
        ]);

        // Parse location from travel_location string and get IDs
        $locationIds = $this->getLocationIdsFromString($validated['travel_location']);
        
        // Merge location IDs with validated data
        $data = array_merge($validated, $locationIds);

        DB::beginTransaction();
        try {
            // Get the new pesticide
            $newPesticide = Pesticide::findOrFail($validated['pesticide_id']);
            
            // Check if the pesticide is being changed
            if ($distribution->pesticide_id != $validated['pesticide_id']) {
                // Restore stock to old pesticide
                $oldPesticide = $distribution->pesticide;
                $oldPesticide->stock += $distribution->quantity;
                $oldPesticide->save();
                
                // Check if new pesticide has enough stock
                if ($newPesticide->stock < $validated['quantity']) {
                    return back()
                        ->with('error', 'Insufficient stock available. Current stock: ' . $newPesticide->stock . ' ' . $newPesticide->unit);
                }
                
                // Deduct from new pesticide
                $newPesticide->stock -= $validated['quantity'];
                $newPesticide->save();
            } else {
                // Same pesticide, adjust stock based on quantity difference
                $quantityDiff = $validated['quantity'] - $distribution->quantity;
                
                if ($quantityDiff > $newPesticide->stock) {
                    return back()
                        ->with('error', 'Insufficient stock available. Current stock: ' . $newPesticide->stock . ' ' . $newPesticide->unit);
                }
                
                $newPesticide->stock -= $quantityDiff;
                $newPesticide->save();
            }
            
            // Update the distribution record
            $distribution->update($data);

            DB::commit();

            return Inertia::location('/pesticidesindex?tab=distribution');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update distribution: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified distribution.
     */
    public function destroy(Distribution $distribution)
    {
        DB::beginTransaction();
        try {
            // Restore stock to pesticide
            $pesticide = $distribution->pesticide;
            $pesticide->stock += $distribution->quantity;
            $pesticide->save();

            $distribution->delete();

            DB::commit();

            return Inertia::location('/pesticidesindex?tab=distribution');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to delete distribution: ' . $e->getMessage());
        }
    }

    /**
     * Parse location string and get corresponding IDs
     * Expected format: "Barangay Name, Municipality Name, Province Name, Region Name"
     */
    private function getLocationIdsFromString($locationString)
    {
        $locationIds = [
            'region_id' => null,
            'province_id' => null,
            'municipality_id' => null,
            'barangay_id' => null,
        ];

        if (empty($locationString)) {
            return $locationIds;
        }

        // Split the location string by comma and trim each part
        $parts = array_map('trim', explode(',', $locationString));
        
        // Reverse the order to process from region to barangay
        $parts = array_reverse($parts);

        try {
            // Find region (last part)
            if (isset($parts[0]) && !empty($parts[0])) {
                $region = \App\Models\Region::where('name', 'like', '%' . $parts[0] . '%')->first();
                if ($region) {
                    $locationIds['region_id'] = $region->id;
                }
            }

            // Find province (second to last)
            if (isset($parts[1]) && !empty($parts[1]) && $locationIds['region_id']) {
                $province = \App\Models\Province::where('name', 'like', '%' . $parts[1] . '%')
                    ->where('region_id', $locationIds['region_id'])
                    ->first();
                if ($province) {
                    $locationIds['province_id'] = $province->id;
                }
            }

            // Find municipality (third to last)
            if (isset($parts[2]) && !empty($parts[2]) && $locationIds['province_id']) {
                $municipality = \App\Models\Municipality::where('name', 'like', '%' . $parts[2] . '%')
                    ->where('province_id', $locationIds['province_id'])
                    ->first();
                if ($municipality) {
                    $locationIds['municipality_id'] = $municipality->id;
                }
            }

            // Find barangay (first part)
            if (isset($parts[3]) && !empty($parts[3]) && $locationIds['municipality_id']) {
                $barangay = \App\Models\Barangay::where('name', 'like', '%' . $parts[3] . '%')
                    ->where('municipality_id', $locationIds['municipality_id'])
                    ->first();
                if ($barangay) {
                    $locationIds['barangay_id'] = $barangay->id;
                }
            }
        } catch (\Exception $e) {
            // Log error but continue with null IDs
            \Log::error('Error parsing location string: ' . $e->getMessage());
        }

        return $locationIds;
    }
}
