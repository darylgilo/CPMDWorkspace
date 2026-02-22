<?php

namespace App\Http\Controllers;

use App\Models\Fund;
use App\Models\FundTransaction;
use App\Models\PpmpProject;
use App\Models\PpmpFundingDetail;
use App\Models\PpmpTimeline;
use App\Models\PpmpSubtotalHighlight;
use App\Models\AuditLog;
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

        if ($tab === 'source' || $tab === 'allocation' || $tab === 'reports' || $tab === 'ppmp') {
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

            // Add PPMP items for PPMP tab
            if ($tab === 'ppmp') {
                $ppmpProjects = PpmpProject::with(['fund', 'user', 'fundingDetails.timelines'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                $data = array_merge($data, [
                    'ppmpItems' => [
                        'data' => $ppmpProjects,
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $ppmpProjects->count(),
                        'total' => $ppmpProjects->count(),
                    ],
                ]);
            }

            // Add Audit Logs for reports tab
            if ($tab === 'reports') {
                $auditLogs = AuditLog::with(['user'])
                    ->where('module', 'Budget Management')
                    ->when($search, function ($query, $search) {
                        $query->where(function($q) use ($search) {
                            $q->where('action', 'like', "%{$search}%")
                              ->orWhere('details', 'like', "%{$search}%")
                              ->orWhereHas('user', function($u) use ($search) {
                                  $u->where('name', 'like', "%{$search}%");
                              });
                        });
                    })
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);

                $data = array_merge($data, [
                    'auditLogs' => $auditLogs,
                ]);
            }
        }

        if ($tab === 'travel-expenses') {
            // Import TravelExpense model
            $travelExpenseQuery = \App\Models\TravelExpense::with(['user', 'fund', 'ppmpProject', 'ppmpFundingDetail'])
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
                'ppmpItems' => \App\Models\PpmpProject::with(['fundingDetails'])->get(),
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

        $this->logActivity('Added', "New Fund created: {$fund->fund_name} with amount PHP " . number_format($fund->total_amount, 2), $fund);

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

        $this->logActivity('Updated', "Fund details updated for: {$fund->fund_name}", $fund);

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

        $fundName = $fund->fund_name;
        $fund->delete();

        $this->logActivity('Deleted', "Fund deleted: {$fundName}");

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
            'ppmp_project_id' => 'nullable|exists:ppmp_projects,id',
            'ppmp_funding_detail_id' => 'nullable|exists:ppmp_funding_details,id',
            'status' => 'required|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $validated['user_id'] = auth()->id();

        $travelExpense = \App\Models\TravelExpense::create($validated);

        $this->logActivity('Added', "New Travel Expense added for: {$travelExpense->name} - {$travelExpense->destination}", $travelExpense);

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
            'ppmp_project_id' => 'nullable|exists:ppmp_projects,id',
            'ppmp_funding_detail_id' => 'nullable|exists:ppmp_funding_details,id',
            'status' => 'required|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $expense->update($validated);

        $this->logActivity('Updated', "Travel Expense updated: {$expense->doctrack_no}", $expense);

        return redirect()->back()->with('success', 'Travel expense updated successfully');
    }

    /**
     * Remove the specified travel expense.
     */
    public function destroyTravelExpense(\App\Models\TravelExpense $expense)
    {
        $doctrack = $expense->doctrack_no;
        $expense->delete();

        $this->logActivity('Deleted', "Travel Expense deleted: {$doctrack}");

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
            'category' => 'required|in:' . implode(',', FundTransaction::CATEGORIES),
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

        $fund = Fund::find($validated['fund_id']);
        $fund->updateAllocatedAmount($validated['amount_po']);

        $this->logActivity('Added', "New Transaction added to {$fund->fund_name}: {$transaction->doctrack_no} - {$transaction->supplier}", $transaction);

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
            'category' => 'required|in:' . implode(',', FundTransaction::CATEGORIES),
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

        $this->logActivity('Updated', "Transaction updated: {$transaction->doctrack_no}", $transaction);

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

        $doctrack = $transaction->doctrack_no;
        $transaction->delete();

        $this->logActivity('Deleted', "Transaction deleted: {$doctrack}");

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

    /**
     * Store a newly created PPMP project.
     */
    public function storePPMP(Request $request)
    {
        $validated = $request->validate([
            'fund_id' => 'required|exists:funds,id',
            'general_description' => 'required|string',
            'project_type' => 'required|in:Goods,Infrastructure,Consulting Services',
        ]);

        // Create the main project record only
        $project = PpmpProject::create([
            'fund_id' => $validated['fund_id'],
            'general_description' => $validated['general_description'],
            'project_type' => $validated['project_type'],
            'user_id' => auth()->id(),
        ]);

        $this->logActivity('Added', "New PPMP Project created: {$project->general_description}", $project);

        return redirect()->back()->with('success', 'PPMP project created successfully. You can now add funding details and timelines.');
    }

    /**
     * Store funding details for a PPMP project.
     */
    public function storeFundingDetails(Request $request)
    {
        $validated = $request->validate([
            'ppmp_project_id' => 'required|exists:ppmp_projects,id',
            'quantities' => 'required|array|min:1',
            'quantities.*.quantity_size' => 'required|string',
            'mode_of_procurement' => 'nullable|string',
            'pre_procurement_conference' => 'required|in:Yes,No',
            'estimated_budget' => 'required|numeric|min:0',
            'supporting_documents' => 'nullable|string',
            'remarks' => 'nullable|string',
            'timelines' => 'required|array|min:1',
            'timelines.*.start_procurement' => 'required|string',
            'timelines.*.end_procurement' => 'required|string',
            'timelines.*.delivery_period' => 'required|string',
        ]);

        // Create funding details for each quantity
        $totalItems = 0;
        foreach ($validated['quantities'] as $quantity) {
            $fundingDetail = PpmpFundingDetail::create([
                'ppmp_project_id' => $validated['ppmp_project_id'],
                'quantity_size' => $quantity['quantity_size'],
                'mode_of_procurement' => $validated['mode_of_procurement'],
                'pre_procurement_conference' => $validated['pre_procurement_conference'],
                'estimated_budget' => $validated['estimated_budget'],
                'supporting_documents' => $validated['supporting_documents'],
                'remarks' => $validated['remarks'],
            ]);

            // Create timelines for each funding detail
            foreach ($validated['timelines'] as $timeline) {
                PpmpTimeline::create([
                    'ppmp_project_id' => $validated['ppmp_project_id'],
                    'ppmp_funding_detail_id' => $fundingDetail->id,
                    'start_procurement' => $timeline['start_procurement'],
                    'end_procurement' => $timeline['end_procurement'],
                    'delivery_period' => $timeline['delivery_period'],
                ]);
                $totalItems++;
            }
        }

        $project = PpmpProject::find($validated['ppmp_project_id']);
        $this->logActivity('Added', "Added {$totalItems} funding detail(s) to project: {$project->general_description}", $project);

        return redirect()->back()->with('success', $totalItems . ' funding detail(s) added successfully');
    }

    /**
     * Update the specified funding detail.
     */
    public function updateFundingDetails(Request $request, PpmpFundingDetail $fundingDetail)
    {
        $validated = $request->validate([
            'quantities' => 'required|array',
            'quantities.*.quantity_size' => 'required|string',
            'mode_of_procurement' => 'nullable|string',
            'pre_procurement_conference' => 'required|in:Yes,No',
            'estimated_budget' => 'required|numeric|min:0',
            'supporting_documents' => 'required|string',
            'remarks' => 'nullable|string',
            'timelines' => 'required|array',
            'timelines.*.start_procurement' => 'required|string',
            'timelines.*.end_procurement' => 'required|string',
            'timelines.*.delivery_period' => 'required|string',
        ]);

        // Update the funding detail
        $fundingDetail->update([
            'quantity_size' => $validated['quantities'][0]['quantity_size'],
            'mode_of_procurement' => $validated['mode_of_procurement'],
            'pre_procurement_conference' => $validated['pre_procurement_conference'],
            'estimated_budget' => $validated['estimated_budget'],
            'supporting_documents' => $validated['supporting_documents'],
            'remarks' => $validated['remarks'],
        ]);

        // Update timelines - delete existing and create new ones
        $fundingDetail->timelines()->delete();
        foreach ($validated['timelines'] as $timeline) {
            PpmpTimeline::create([
                'ppmp_project_id' => $fundingDetail->ppmp_project_id,
                'ppmp_funding_detail_id' => $fundingDetail->id,
                'start_procurement' => $timeline['start_procurement'],
                'end_procurement' => $timeline['end_procurement'],
                'delivery_period' => $timeline['delivery_period'],
            ]);
        }

        $this->logActivity('Updated', "Updated funding details for projet: {$fundingDetail->ppmpProject->general_description}", $fundingDetail);

        return redirect()->back()->with('success', 'Funding detail updated successfully');
    }

    /**
     * Remove the specified funding detail.
     */
    public function destroyFundingDetails(PpmpFundingDetail $fundingDetail)
    {
        $projectDescription = $fundingDetail->ppmpProject->general_description;
        // Delete related timelines first
        $fundingDetail->timelines()->delete();
        
        // Delete the funding detail
        $fundingDetail->delete();

        $this->logActivity('Deleted', "Deleted a funding detail from project: {$projectDescription}");

        return redirect()->back()->with('success', 'Funding detail deleted successfully');
    }

    /**
     * Update the specified PPMP project.
     */
    public function updatePPMP(Request $request, PpmpProject $ppmpProject)
    {
        $validated = $request->validate([
            'fund_id' => 'required|exists:funds,id',
            'general_description' => 'required|string',
            'project_type' => 'required|in:Goods,Infrastructure,Consulting Services',
        ]);

        // Update the main project only
        $ppmpProject->update([
            'fund_id' => $validated['fund_id'],
            'general_description' => $validated['general_description'],
            'project_type' => $validated['project_type'],
            'user_id' => auth()->id(),
        ]);

        $this->logActivity('Updated', "PPMP Project updated: {$ppmpProject->general_description}", $ppmpProject);

        return redirect()->back()->with('success', 'PPMP project updated successfully');
    }

    /**
     * Remove the specified PPMP item.
     */
    public function destroyPPMP(PpmpProject $ppmpProject)
    {
        // Delete related records first
        $ppmpProject->fundingDetails()->each(function ($detail) {
            $detail->timelines()->delete();
        });
        $ppmpProject->fundingDetails()->delete();
        
        $description = $ppmpProject->general_description;
        // Delete the project
        $ppmpProject->delete();

        $this->logActivity('Deleted', "PPMP Project deleted: {$description}");

        return redirect()->back()->with('success', 'PPMP item deleted successfully');
    }

    /**
     * Get all PPMP subtotal highlights.
     */
    public function getHighlights()
    {
        $highlights = PpmpSubtotalHighlight::with(['ppmpProject', 'user'])
            ->where('user_id', auth()->id())
            ->get()
            ->map(function ($highlight) {
                return [
                    'id' => $highlight->id,
                    'ppmp_project_id' => $highlight->ppmp_project_id,
                    'status' => $highlight->status,
                    'project_key' => $highlight->ppmpProject->general_description . '|' . $highlight->ppmpProject->project_type,
                ];
            });

        return response()->json($highlights);
    }

    /**
     * Store a new PPMP subtotal highlight.
     */
    public function storeHighlight(Request $request)
    {
        $validated = $request->validate([
            'ppmp_project_id' => 'required|exists:ppmp_projects,id',
            'status' => 'required|in:FINAL,INDICATIVE',
        ]);

        $highlight = PpmpSubtotalHighlight::updateOrCreate(
            [
                'ppmp_project_id' => $validated['ppmp_project_id'],
                'user_id' => auth()->id(),
            ],
            [
                'status' => $validated['status'],
            ]
        );

        return redirect()->back()->with('success', 'Highlight saved successfully');
    }

    /**
     * Update a PPMP subtotal highlight.
     */
    public function updateHighlight(Request $request, PpmpSubtotalHighlight $highlight): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:FINAL,INDICATIVE',
        ]);

        $highlight->update($validated);

        return response()->json([
            'message' => 'Highlight updated successfully',
            'highlight' => [
                'id' => $highlight->id,
                'ppmp_project_id' => $highlight->ppmp_project_id,
                'status' => $highlight->status,
                'project_key' => $highlight->ppmpProject->general_description . '|' . $highlight->ppmpProject->project_type,
            ]
        ]);
    }

    /**
     * Delete a PPMP subtotal highlight.
     */
    public function destroyHighlight(PpmpSubtotalHighlight $highlight)
    {
        $highlight->delete();

        return redirect()->back()->with('success', 'Highlight deleted successfully');
    }

    /**
     * Log an activity to the audit_logs table.
     */
    private function logActivity(string $action, string $details, $model = null)
    {
        AuditLog::create([
            'user_id' => auth()->id(),
            'module' => 'Budget Management',
            'action' => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model ? $model->id : null,
            'details' => $details,
        ]);
    }
}
