<?php

namespace App\Http\Controllers\Whereabouts;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Whereabout;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class WhereaboutsController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date') ? Carbon::parse($request->input('date')) : Carbon::now();
        $startOfMonth = $date->copy()->startOfMonth();
        $endOfMonth = $date->copy()->endOfMonth();

        // Get all users grouped by office (section)
        // We fetch all users, or maybe filter by active
        $users = User::where('status', 'active')
            ->where('office', 'CPMD')
            ->orderBy('cpmd') // Grouping by cpmd section
            ->orderBy('display_order') // Custom display order
            ->orderBy('item_number') // Fallback
            ->get();

        // Get whereabouts for the month
        $whereabouts = Whereabout::whereBetween('date', [$startOfMonth->format('Y-m-d'), $endOfMonth->format('Y-m-d')])
            ->get()
            ->groupBy('user_id');
        
        // Transform whereabouts to be keyed by date for easier frontend consumption
        $formattedWhereabouts = $whereabouts->map(function ($userWhereabouts) {
            return $userWhereabouts->mapWithKeys(function ($item) {
                return [$item->date->format('Y-m-d') => $item];
            });
        });

        return Inertia::render('Whereabouts/whereabouts', [
            'users' => $users,
            'whereabouts' => $formattedWhereabouts,
            'currentDate' => $date->format('Y-m-d'),
            'filters' => $request->only(['date']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'status' => 'required|string',
            'reason' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        // Check authorization: only admin/superadmin or the user themselves can update
        $currentUser = $request->user();
        if ($currentUser->id != $validated['user_id'] && !in_array($currentUser->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized action.');
        }

        Whereabout::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'date' => $validated['date'],
            ],
            [
                'status' => $validated['status'],
                'reason' => $validated['reason'],
                'location' => $validated['location'],
            ]
        );

        return redirect()->back();
    }

    public function destroy(Request $request, $id)
    {
        $whereabout = Whereabout::findOrFail($id);

        // Check authorization: only admin/superadmin or the user themselves can delete
        $currentUser = $request->user();
        if ($currentUser->id != $whereabout->user_id && !in_array($currentUser->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized action.');
        }

        $whereabout->delete();

        return redirect()->back();
    }

    public function reorder(Request $request)
    {
        \Log::info('Reorder endpoint called', [
            'items_count' => count($request->items ?? []),
            'items' => $request->items
        ]);
        
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:users,id',
            'items.*.order' => 'required|integer|min:0',
        ]);

        // Check authorization
        if (!in_array($request->user()->role, ['admin', 'superadmin'])) {
            \Log::error('Unauthorized reorder attempt', [
                'user_id' => $request->user()->id, 
                'role' => $request->user()->role
            ]);
            abort(403, 'Unauthorized action.');
        }

        // Use transaction for atomic updates
        \DB::beginTransaction();
        try {
            foreach ($validated['items'] as $item) {
                $updated = User::where('id', $item['id'])
                    ->update(['display_order' => $item['order']]);
                
                \Log::info('Updated user display_order', [
                    'user_id' => $item['id'], 
                    'new_order' => $item['order'],
                    'rows_affected' => $updated
                ]);
            }
            
            \DB::commit();
            \Log::info('Reorder completed successfully', [
                'total_users_updated' => count($validated['items'])
            ]);
            
            // Return Inertia back() instead of JSON to prevent error message
            return redirect()->back();
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Reorder failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return back with error message
            return redirect()->back()->with('error', 'Failed to update order: ' . $e->getMessage());
        }
    }
}
