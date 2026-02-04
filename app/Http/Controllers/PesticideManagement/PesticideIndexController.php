<?php

namespace App\Http\Controllers\PesticideManagement;

use App\Http\Controllers\Controller;
use App\Models\Pesticide;
use App\Models\Distribution;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PesticideIndexController extends Controller
{
    /**
     * Display the pesticide stock page with tabs.
     */
    public function index(Request $request)
    {
        $tab = $request->input('tab', 'inventory');
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        
        $data = [
            'activeTab' => $tab,
            'search' => $search,
            'perPage' => $perPage,
        ];

        // Load BOTH tabs' data on initial load for instant switching
        // Pesticide inventory data
        $pesticideQuery = Pesticide::with('user')
            ->when($search && $tab === 'inventory', function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('brand_name', 'like', "%{$search}%")
                      ->orWhere('active_ingredient', 'like', "%{$search}%")
                      ->orWhere('type_of_pesticide', 'like', "%{$search}%")
                      ->orWhere('source_of_fund', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc');

        $pesticides = $pesticideQuery->paginate($perPage);

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

        $pesticideAnalytics = [
            'typeStatistics' => $typeStatistics,
            'totalStock' => Pesticide::sum('stock'),
            'lowStock' => Pesticide::where('stock', '<', 10)->count(),
            // Total stock (quantity) received in the current year
            'thisYearStock' => Pesticide::whereYear('received_date', now()->year)->sum('quantity'),
        ];

        // Get unique types, sources, and brand names for dropdowns
        $pesticideTypes = Pesticide::distinct()->pluck('type_of_pesticide')->filter()->values();
        $sourcesOfFund = Pesticide::distinct()->pluck('source_of_fund')->filter()->values();
        $brandNames = Pesticide::distinct()->pluck('brand_name')->filter()->values();

        // Distribution data
        $distributionQuery = Distribution::with(['user', 'pesticide'])
            ->when($search && $tab === 'distribution', function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('brand_name', 'like', "%{$search}%")
                      ->orWhere('type_of_pesticide', 'like', "%{$search}%")
                      ->orWhere('travel_purpose', 'like', "%{$search}%")
                      ->orWhere('received_by', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc');

        $distributions = $distributionQuery->paginate($perPage);

        // Calculate analytics
        $distributionAnalytics = [
            'totalDistributions' => Distribution::count(),
            'totalDistributed' => Distribution::sum('quantity'),
            // Total quantity distributed in the current year
            'thisYear' => Distribution::whereYear('created_at', now()->year)->sum('quantity'),
        ];

        // Get all available pesticides individually
        $availablePesticides = Pesticide::where('stock', '>', 0)
            ->orderBy('type_of_pesticide')
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

        // Merge all data
        $data = array_merge($data, [
            'pesticides' => $pesticides,
            'pesticideAnalytics' => $pesticideAnalytics,
            'pesticideTypes' => $pesticideTypes,
            'sourcesOfFund' => $sourcesOfFund,
            'brandNames' => $brandNames,
            'distributions' => $distributions,
            'distributionAnalytics' => $distributionAnalytics,
            'availablePesticides' => $availablePesticides,
            // Include flash messages
            'success' => session()->get('success'),
            'error' => session()->get('error'),
        ]);

        return Inertia::render('PesticideInventory/PesticideIndex', $data);
    }
}
