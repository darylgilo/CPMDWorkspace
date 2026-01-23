<?php

namespace App\Http\Controllers;

use App\Models\Fund;
use App\Models\FundTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class BudgetManagementController extends Controller
{
    /**
     * Display the budget management index page.
     */
    public function index(Request $request): Response
    {
        $tab = $request->get('tab', 'source');
        $search = $request->get('search', '');
        $perPage = $request->get('perPage', 10);
        
        // Set default sort based on tab
        $defaultSort = $tab === 'travel-expenses' ? 'date_of_travel' : 'fund_name';
        $sort = $request->get('sort', $defaultSort);
        $direction = $request->get('direction', $tab === 'travel-expenses' ? 'desc' : 'asc');

        $data = [
            'activeTab' => $tab,
            'search' => $search,
            'perPage' => $perPage,
        ];

        if ($tab === 'source' || $tab === 'allocation' || $tab === 'reports') {
            // Get funds with pagination and filtering
            $fundsQuery = Fund::with(['user'])
                ->when($search, function ($query, $search) {
                    $query->where('fund_name', 'like', "%{$search}%")
                          ->orWhere('source_year', 'like', "%{$search}%");
                })
                ->when($sort, function ($query, $sort) use ($direction) {
                    $query->orderBy($sort, $direction);
                });

            $funds = $fundsQuery->paginate($perPage);

            // Get fund transactions
            $fundTransactions = FundTransaction::with(['fund', 'user'])
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            // Get analytics
            $fundAnalytics = [
                'totalFunds' => Fund::count(),
                'totalAmount' => Fund::sum('total_amount'),
                'totalByYear' => Fund::selectRaw('source_year, SUM(total_amount) as total')
                    ->groupBy('source_year')
                    ->orderBy('source_year', 'desc')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'source_year' => (int) $item->source_year,
                            'total' => (float) $item->total,
                        ];
                    })
                    ->toArray(),
                'fundsByYearAndName' => Fund::selectRaw('source_year, fund_name, SUM(total_amount) as total')
                    ->groupBy(['source_year', 'fund_name'])
                    ->orderBy('source_year', 'desc')
                    ->orderBy('fund_name', 'asc')
                    ->get()
                    ->groupBy('source_year')
                    ->map(function ($yearGroup) {
                        $year = $yearGroup->first()->source_year;
                        $funds = [];
                        foreach ($yearGroup as $fund) {
                            $funds[$fund->fund_name] = (float) $fund->total;
                        }
                        return [
                            'year' => $year,
                            'funds' => $funds
                        ];
                    })
                    ->values()
                    ->toArray(),
            ];

            $data = array_merge($data, [
                'funds' => $funds,
                'fundTransactions' => [
                    'data' => $fundTransactions,
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 50,
                    'total' => $fundTransactions->count(),
                ],
                'fundAnalytics' => $fundAnalytics,
            ]);
        }

        if ($tab === 'travel-expenses') {
            // Import TravelExpense model
            $travelExpenseQuery = \App\Models\TravelExpense::with(['user', 'fund'])
                ->when($search, function ($query, $search) {
                    $query->where(function($q) use ($search) {
                        $q->where('doctrack_no', 'like', "%{$search}%")
                          ->orWhere('name', 'like', "%{$search}%")
                          ->orWhere('destination', 'like', "%{$search}%")
                          ->orWhere('purpose', 'like', "%{$search}%")
                          ->orWhereHas('fund', function($fundQuery) use ($search) {
                              $fundQuery->where('fund_name', 'like', "%{$search}%");
                          });
                    });
                })
                ->when($sort, function ($query, $sort) use ($direction) {
                    if ($sort === 'date_of_travel') {
                        $query->orderBy('date_of_travel', $direction);
                    } elseif ($sort === 'amount') {
                        $query->orderBy('amount', $direction);
                    } elseif ($sort === 'name') {
                        $query->orderBy('name', $direction);
                    } elseif ($sort === 'fund_name') {
                        $query->orderBy(\App\Models\TravelExpense::select('fund_name')
                            ->from('funds')
                            ->whereColumn('funds.id', 'travel_expenses.fund_id'), $direction);
                    } else {
                        $query->orderBy($sort, $direction);
                    }
                })
                ->latest('date_of_travel');

            $travelExpenses = $travelExpenseQuery->paginate($perPage);

            // Get travel expense analytics
            $expenseAnalytics = [
                'totalExpenses' => \App\Models\TravelExpense::count(),
                'totalAmount' => \App\Models\TravelExpense::sum('amount'),
                'pendingCount' => \App\Models\TravelExpense::where('status', 'pending')->count(),
                'approvedCount' => \App\Models\TravelExpense::where('status', 'approved')->count(),
                'rejectedCount' => \App\Models\TravelExpense::where('status', 'rejected')->count(),
                'totalByYear' => \App\Models\TravelExpense::selectRaw('YEAR(date_of_travel) as year, COUNT(*) as count, SUM(amount) as total')
                    ->groupBy('year')
                    ->orderBy('year', 'desc')
                    ->get(),
            ];

            $data = array_merge($data, [
                'travelExpenses' => $travelExpenses,
                'expenseAnalytics' => $expenseAnalytics,
                'funds' => \App\Models\Fund::select('id', 'fund_name', 'source_year')->orderBy('fund_name')->paginate(1000),
            ]);
        }

        return Inertia::render('BudgetManagement/BudgetManagementIndex', $data);
    }

    /**
     * Store a newly created fund.
     */
    public function storeFund(Request $request)
    {
        $validated = $request->validate([
            'fund_name' => 'required|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'source_year' => 'required|integer|min:1900|max:2100',
        ]);

        $validated['user_id'] = auth()->id();

        $fund = Fund::create($validated);

        return redirect()->back()->with('success', 'Fund created successfully');
    }

    /**
     * Update the specified fund.
     */
    public function updateFund(Request $request, Fund $fund)
    {
        $validated = $request->validate([
            'fund_name' => 'required|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'source_year' => 'required|integer|min:1900|max:2100',
        ]);

        $fund->update($validated);

        return redirect()->back()->with('success', 'Fund updated successfully');
    }

    /**
     * Remove the specified fund.
     */
    public function destroyFund(Fund $fund)
    {
        if ($fund->transactions()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete fund with existing transactions');
        }

        $fund->delete();

        return redirect()->back()->with('success', 'Fund deleted successfully');
    }

    /**
     * Store a newly created travel expense.
     */
    public function storeTravelExpense(Request $request)
    {
        $validated = $request->validate([
            'doctrack_no' => 'required|string|max:255|unique:travel_expenses,doctrack_no',
            'name' => 'required|string|max:255',
            'date_of_travel' => 'required|date',
            'destination' => 'required|string|max:255',
            'purpose' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'fund_id' => 'nullable|exists:funds,id',
            'status' => 'required|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $validated['user_id'] = auth()->id();

        $travelExpense = \App\Models\TravelExpense::create($validated);

        return redirect()->back()->with('success', 'Travel expense created successfully');
    }

    /**
     * Update the specified travel expense.
     */
    public function updateTravelExpense(Request $request, \App\Models\TravelExpense $expense)
    {
        $validated = $request->validate([
            'doctrack_no' => 'required|string|max:255|unique:travel_expenses,doctrack_no,' . $expense->id,
            'name' => 'required|string|max:255',
            'date_of_travel' => 'required|date',
            'destination' => 'required|string|max:255',
            'purpose' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'fund_id' => 'nullable|exists:funds,id',
            'status' => 'required|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $expense->update($validated);

        return redirect()->back()->with('success', 'Travel expense updated successfully');
    }

    /**
     * Remove the specified travel expense.
     */
    public function destroyTravelExpense(\App\Models\TravelExpense $expense)
    {
        $expense->delete();

        return redirect()->back()->with('success', 'Travel expense deleted successfully');
    }

    /**
     * Store a newly created fund transaction.
     */
    public function storeTransaction(Request $request)
    {
        $validated = $request->validate([
            'fund_id' => 'required|exists:funds,id',
            'doctrack_no' => 'required|string|max:255',
            'pr_no' => 'required|string|max:255',
            'specific_items' => 'required|string',
            'category' => 'required|string|max:255',
            'amount_pr' => 'required|numeric|min:0',
            'resolution_no' => 'required|string|max:255',
            'supplier' => 'required|string|max:255',
            'po_no' => 'required|string|max:255',
            'amount_po' => 'required|numeric|min:0',
            'delivery_date' => 'nullable|date',
            'dv_no' => 'nullable|string|max:255',
            'amount_dv' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $validated['user_id'] = auth()->id();
        $validated['balance'] = $validated['amount_po'] - ($validated['amount_dv'] ?? 0);

        $transaction = FundTransaction::create($validated);

        // Update fund allocated amount
        $fund = Fund::find($validated['fund_id']);
        $fund->updateAllocatedAmount($validated['amount_po']);

        return redirect()->back()->with('success', 'Transaction created successfully');
    }

    /**
     * Update an existing fund transaction.
     */
    public function updateTransaction(Request $request, FundTransaction $transaction)
    {
        $validated = $request->validate([
            'fund_id' => 'required|exists:funds,id',
            'doctrack_no' => 'required|string|max:255',
            'pr_no' => 'required|string|max:255',
            'specific_items' => 'required|string',
            'category' => 'required|string|max:255',
            'amount_pr' => 'required|numeric|min:0',
            'resolution_no' => 'required|string|max:255',
            'supplier' => 'required|string|max:255',
            'po_no' => 'required|string|max:255',
            'amount_po' => 'required|numeric|min:0',
            'delivery_date' => 'nullable|date',
            'dv_no' => 'nullable|string|max:255',
            'amount_dv' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $validated['user_id'] = auth()->id();
        $validated['balance'] = $validated['amount_po'] - ($validated['amount_dv'] ?? 0);

        $transaction->update($validated);

        // Update fund allocated amount if needed
        $fund = Fund::find($validated['fund_id']);
        $oldAmount = $transaction->amount_po;
        $newAmount = $validated['amount_po'];
        if ($oldAmount !== $newAmount) {
            $fund = Fund::find($validated['fund_id']);
            $difference = $newAmount - $oldAmount;
            $fund->updateAllocatedAmount($difference);
        }

        return redirect()->back()->with('success', 'Transaction updated successfully');
    }

    /**
     * Remove the specified fund transaction.
     */
    public function destroyTransaction(FundTransaction $transaction): JsonResponse
    {
        // Check if transaction has related records (prevent deletion if needed)
        if ($transaction->delivery_date || $transaction->dv_no || $transaction->amount_dv) {
            return response()->json(['message' => 'Cannot delete transaction with existing delivery records, DV numbers, or DV amounts'], 422);
        }

        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted successfully']);
    }

    /**
     * Get fund analytics data.
     */
    public function analytics(): JsonResponse
    {
        $analytics = [
            'totalFunds' => Fund::count(),
            'totalAllocated' => Fund::sum('allocated_amount'),
            'totalBalance' => Fund::sum('balance'),
            'activeFunds' => Fund::where('status', 'active')->count(),
            'expiredFunds' => Fund::where('status', 'expired')->count(),
            'fundsByType' => Fund::selectRaw('fund_name, COUNT(*) as count, SUM(total_amount) as total')
                ->groupBy('fund_name')
                ->get(),
            'recentTransactions' => FundTransaction::with(['fund'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
        ];

        return response()->json($analytics);
    }

    /**
     * Export funds data.
     */
    public function exportFunds(Request $request)
    {
        $funds = Fund::with(['user', 'transactions'])
            ->when($request->get('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->get();

        $filename = 'funds_export_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($funds) {
            $file = fopen('php://output', 'w');
            
            // CSV header
            fputcsv($file, [
                'ID', 'Fund Name', 'Total Amount', 'Allocated Amount', 
                'Balance', 'Source Date', 'Expiry Date', 'Status', 'Description', 'Created At'
            ]);
            
            // CSV data
            foreach ($funds as $fund) {
                fputcsv($file, [
                    $fund->id,
                    $fund->fund_name,
                    $fund->total_amount,
                    $fund->allocated_amount,
                    $fund->balance,
                    $fund->source_date,
                    $fund->expiry_date,
                    $fund->status,
                    $fund->description,
                    $fund->created_at,
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
