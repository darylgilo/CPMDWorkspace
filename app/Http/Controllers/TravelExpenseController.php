<?php

namespace App\Http\Controllers;

use App\Models\TravelExpense;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TravelExpenseController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', TravelExpense::class);

        $search = $request->input('search');
        
        $query = TravelExpense::query()
            ->with('user')
            ->when($search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('doctrack_no', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhere('destination', 'like', "%{$search}%")
                      ->orWhere('purpose', 'like', "%{$search}%")
                      ->orWhere('source_of_fund', 'like', "%{$search}%");
                });
            })
            ->latest();

        $expenses = $query->paginate(10);

        if ($request->wantsJson()) {
            return response()->json([
                'travelExpenses' => [
                    'data' => $expenses->items(),
                    'current_page' => $expenses->currentPage(),
                    'last_page' => $expenses->lastPage(),
                    'total' => $expenses->total(),
                ],
                'filters' => [
                    'search' => $search,
                ],
            ]);
        }

        return Inertia::render('BudgetManagement/BudgetManagementIndex', [
            'travelExpenses' => [
                'data' => $expenses->items(),
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'total' => $expenses->total(),
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', TravelExpense::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date_of_travel' => 'required|date',
            'destination' => 'required|string|max:255',
            'purpose' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'source_of_fund' => 'required|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $expense = Auth::user()->travelExpenses()->create($validated);

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Travel expense added successfully.',
                    'expense' => $expense->load('user'),
                ], 201);
            }

            return redirect()
                ->back()
                ->with('success', 'Travel expense added successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to add travel expense.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to add travel expense: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, TravelExpense $travelExpense)
    {
        $this->authorize('update', $travelExpense);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date_of_travel' => 'required|date',
            'destination' => 'required|string|max:255',
            'purpose' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'source_of_fund' => 'required|string|max:255',
            'status' => 'sometimes|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $travelExpense->update($validated);

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Travel expense updated successfully.',
                    'expense' => $travelExpense->load('user'),
                ]);
            }

            return redirect()
                ->back()
                ->with('success', 'Travel expense updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to update travel expense.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to update travel expense: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy(Request $request, TravelExpense $travelExpense)
    {
        $this->authorize('delete', $travelExpense);
        
        try {
            DB::beginTransaction();

            $travelExpense->delete();

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Travel expense deleted successfully.',
                ]);
            }

            return redirect()
                ->back()
                ->with('success', 'Travel expense deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to delete travel expense.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to delete travel expense: ' . $e->getMessage());
        }
    }
}
