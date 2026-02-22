<?php

namespace App\Http\Controllers\PesticideManagement;

use App\Http\Controllers\Controller;
use App\Models\Pesticide;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PesticideController extends Controller
{
    /**
     * Display a listing of pesticides.
     */
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        
        $query = Pesticide::with('user')
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('brand_name', 'like', "%{$search}%")
                      ->orWhere('active_ingredient', 'like', "%{$search}%")
                      ->orWhere('type_of_pesticide', 'like', "%{$search}%")
                      ->orWhere('source_of_fund', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc');

        $pesticides = $query->paginate($perPage);

        // Calculate analytics by pesticide type
        $typeStatistics = Pesticide::select('type_of_pesticide', DB::raw('COUNT(*) as count'), DB::raw('SUM(stock) as total_stock'))
            ->groupBy('type_of_pesticide')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->type_of_pesticide,
                    'count' => $item->count,
                    'totalStock' => $item->total_stock,
                ];
            });

        $analytics = [
            'typeStatistics' => $typeStatistics,
            'totalStock' => Pesticide::sum('stock'),
            'lowStock' => Pesticide::where('stock', '<', 10)->count(),
            'expiringSoon' => Pesticide::where('expiry_date', '<=', now()->addMonths(3))->count(),
        ];

        // Get unique types and sources for dropdowns
        $pesticideTypes = Pesticide::distinct()->pluck('type_of_pesticide')->filter()->values();
        $sourcesOfFund = Pesticide::distinct()->pluck('source_of_fund')->filter()->values();

        return Inertia::render('PesticideInventory/PesticideIndex', [
            'pesticides' => $pesticides,
            'search' => $search,
            'perPage' => $perPage,
            'analytics' => $analytics,
            'pesticideTypes' => $pesticideTypes,
            'sourcesOfFund' => $sourcesOfFund,
        ]);
    }

    /**
     * Store a newly created pesticide.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_name' => 'required|string|max:255',
            'active_ingredient' => 'required|string|max:255',
            'mode_of_action' => 'required|string|max:255',
            'type_of_pesticide' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'received_date' => 'required|date',
            'production_date' => 'required|date',
            'expiry_date' => 'required|date|after:production_date',
            'source_of_fund' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Check if pesticide with same brand and type exists
            $existingPesticide = Pesticide::where('brand_name', $validated['brand_name'])
                ->where('type_of_pesticide', $validated['type_of_pesticide'])
                ->first();

            if ($existingPesticide) {
                // Update existing pesticide stock
                $existingPesticide->quantity += $validated['quantity'];
                $existingPesticide->stock += $validated['quantity'];
                $existingPesticide->save();
                
                $pesticide = $existingPesticide;
            } else {
                // Create new pesticide
                $validated['stock'] = $validated['quantity'];
                $validated['user_id'] = auth()->id();
                $pesticide = Pesticide::create($validated);
            }

            DB::commit();

            return redirect('/pesticidesindex?tab=inventory')->with('success', 'Pesticide added successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect('/pesticidesindex?tab=inventory')->with('error', 'Failed to add pesticide. Please try again.');
        }
    }

    /**
     * Update the specified pesticide.
     */
    public function update(Request $request, Pesticide $pesticide)
    {
        $validated = $request->validate([
            'brand_name' => 'required|string|max:255',
            'active_ingredient' => 'required|string|max:255',
            'mode_of_action' => 'required|string|max:255',
            'type_of_pesticide' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'received_date' => 'required|date',
            'production_date' => 'required|date',
            'expiry_date' => 'required|date|after:production_date',
            'source_of_fund' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Calculate stock difference
            $quantityDiff = $validated['quantity'] - $pesticide->quantity;
            $validated['stock'] = $pesticide->stock + $quantityDiff;

            $pesticide->update($validated);

            DB::commit();

            return redirect('/pesticidesindex?tab=inventory')->with('success', 'Pesticide updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect('/pesticidesindex?tab=inventory')->with('error', 'Failed to update pesticide. Please try again.');
        }
    }

    /**
     * Remove the specified pesticide.
     */
    public function destroy(Pesticide $pesticide)
    {
        try {
            $pesticide->delete();
            return redirect('/pesticidesindex?tab=inventory')->with('success', 'Pesticide deleted successfully!');
        } catch (\Exception $e) {
            return redirect('/pesticidesindex?tab=inventory')->with('error', 'Failed to delete pesticide. Please try again.');
        }
    }
}
