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
                    $q->where('brand_name', 'like', "%{$search}%")
                      ->orWhere('type_of_pesticide', 'like', "%{$search}%")
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

        // Get pesticides grouped by type with combined stock
        $pesticides = Pesticide::select(
                'type_of_pesticide',
                DB::raw('GROUP_CONCAT(id) as pesticide_ids'),
                DB::raw('SUM(stock) as total_stock')
            )
            ->where('stock', '>', 0)
            ->groupBy('type_of_pesticide')
            ->orderBy('type_of_pesticide')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->pesticide_ids, // Comma-separated IDs
                    'type_of_pesticide' => $item->type_of_pesticide,
                    'stock' => $item->total_stock,
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
            'pesticide_type' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0.01',
            'travel_purpose' => 'required|string|max:255',
            'received_by' => 'required|string|max:255',
            'received_date' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            // Get all pesticides of this type with available stock
            $pesticides = Pesticide::where('type_of_pesticide', $validated['pesticide_type'])
                ->where('stock', '>', 0)
                ->orderBy('expiry_date', 'asc') // Use oldest first (FIFO)
                ->get();

            // Check if enough total stock is available
            $totalStock = $pesticides->sum('stock');
            if ($totalStock < $validated['quantity']) {
                return redirect('/pesticidesindex?tab=distribution')->with('error', 'Insufficient stock available. Current stock: ' . $totalStock);
            }

            $remainingQuantity = $validated['quantity'];
            
            // Distribute quantity across pesticides (FIFO - First In, First Out)
            foreach ($pesticides as $pesticide) {
                if ($remainingQuantity <= 0) break;

                $quantityToDeduct = min($pesticide->stock, $remainingQuantity);

                // Create distribution record for this pesticide
                Distribution::create([
                    'pesticide_id' => $pesticide->id,
                    'brand_name' => $pesticide->brand_name,
                    'type_of_pesticide' => $pesticide->type_of_pesticide,
                    'quantity' => $quantityToDeduct,
                    'travel_purpose' => $validated['travel_purpose'],
                    'received_by' => $validated['received_by'],
                    'received_date' => $validated['received_date'],
                    'user_id' => auth()->id(),
                ]);

                // Update pesticide stock
                $pesticide->stock -= $quantityToDeduct;
                $pesticide->save();

                $remainingQuantity -= $quantityToDeduct;
            }

            DB::commit();

            return redirect('/pesticidesindex?tab=distribution')->with('success', 'Distribution recorded successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect('/pesticidesindex?tab=distribution')->with('error', 'Failed to record distribution: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified distribution.
     */
    public function update(Request $request, Distribution $distribution)
    {
        $validated = $request->validate([
            'pesticide_type' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0.01',
            'travel_purpose' => 'required|string|max:255',
            'received_by' => 'required|string|max:255',
            'received_date' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            // Restore stock to old pesticide
            $oldPesticide = $distribution->pesticide;
            $oldPesticide->stock += $distribution->quantity;
            $oldPesticide->save();

            // Get pesticide of the selected type with highest stock
            $newPesticide = Pesticide::where('type_of_pesticide', $validated['pesticide_type'])
                ->where('stock', '>', 0)
                ->orderBy('stock', 'desc')
                ->first();

            if (!$newPesticide) {
                DB::rollBack();
                return redirect('/pesticidesindex?tab=distribution')->with('error', 'No pesticide available for the selected type.');
            }

            // Check total stock for this type
            $totalStock = Pesticide::where('type_of_pesticide', $validated['pesticide_type'])
                ->sum('stock');

            if ($totalStock < $validated['quantity']) {
                DB::rollBack();
                return redirect('/pesticidesindex?tab=distribution')->with('error', 'Insufficient stock available. Current stock: ' . $totalStock);
            }

            // Update distribution with new pesticide
            $distribution->update([
                'pesticide_id' => $newPesticide->id,
                'brand_name' => $newPesticide->brand_name,
                'type_of_pesticide' => $newPesticide->type_of_pesticide,
                'quantity' => $validated['quantity'],
                'travel_purpose' => $validated['travel_purpose'],
                'received_by' => $validated['received_by'],
                'received_date' => $validated['received_date'],
            ]);

            // Deduct stock from new pesticide
            $newPesticide->stock -= $validated['quantity'];
            $newPesticide->save();

            DB::commit();

            return redirect('/pesticidesindex?tab=distribution')->with('success', 'Distribution updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect('/pesticidesindex?tab=distribution')->with('error', 'Failed to update distribution: ' . $e->getMessage());
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

            return redirect('/pesticidesindex?tab=distribution')->with('success', 'Distribution deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect('/pesticidesindex?tab=distribution')->with('error', 'Failed to delete distribution: ' . $e->getMessage());
        }
    }
}
