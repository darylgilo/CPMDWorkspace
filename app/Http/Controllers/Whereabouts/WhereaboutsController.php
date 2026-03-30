<?php

namespace App\Http\Controllers\Whereabouts;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Whereabout;
use App\Models\Section;
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

        // Get the selected office from request, default to user's office or CPMD
        $selectedOffice = $request->input('office', $request->user()->office ?? 'CPMD');

        // Get all users grouped by office (section)
        // We fetch all users, or maybe filter by active
        $users = User::where('status', 'active')
            ->where('office', $selectedOffice)
            ->with('section') // Load section relationship
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

        // Get sections for the frontend
        $sections = Section::active()->ordered()->get();
        
        // Create sections by office mapping for frontend
        $sectionsByOffice = [];
        foreach ($sections as $section) {
            $sectionsByOffice[$section->office][] = $section->name;
        }

        // Get all available offices from users table
        $availableOffices = User::where('status', 'active')
            ->distinct()
            ->pluck('office')
            ->sort()
            ->values();

        return Inertia::render('Whereabouts/whereabouts', [
            'users' => $users,
            'whereabouts' => $formattedWhereabouts,
            'currentDate' => $date->format('Y-m-d'),
            'filters' => $request->only(['date', 'office']),
            'sections' => $sections,
            'SECTIONS_BY_OFFICE' => $sectionsByOffice,
            'selectedOffice' => $selectedOffice,
            'availableOffices' => $availableOffices,
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

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'dates' => 'required|array|min:1',
            'dates.*' => 'required|date',
            'status' => 'required|string',
            'reason' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        // Check authorization: only admin/superadmin or the user themselves can update
        $currentUser = $request->user();
        if ($currentUser->id != $validated['user_id'] && !in_array($currentUser->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized action.');
        }

        // Use transaction for atomic updates
        \DB::beginTransaction();
        try {
            $updatedCount = 0;
            foreach ($validated['dates'] as $date) {
                Whereabout::updateOrCreate(
                    [
                        'user_id' => $validated['user_id'],
                        'date' => $date,
                    ],
                    [
                        'status' => $validated['status'],
                        'reason' => $validated['reason'],
                        'location' => $validated['location'],
                    ]
                );
                $updatedCount++;
            }
            
            \DB::commit();
            
            return redirect()->back()->with('success', "Successfully updated whereabouts for {$updatedCount} date(s).");
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Bulk store failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to update whereabouts: ' . $e->getMessage());
        }
    }

    public function bulkReset(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'dates' => 'required|array|min:1',
            'dates.*' => 'required|date',
        ]);

        // Check authorization: only admin/superadmin or the user themselves can delete
        $currentUser = $request->user();
        if ($currentUser->id != $validated['user_id'] && !in_array($currentUser->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized action.');
        }

        // Use transaction for atomic updates
        \DB::beginTransaction();
        try {
            $deletedCount = Whereabout::where('user_id', $validated['user_id'])
                ->whereIn('date', $validated['dates'])
                ->delete();
            
            \DB::commit();
            
            return redirect()->back()->with('success', "Successfully reset whereabouts for {$deletedCount} date(s).");
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Bulk reset failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to reset whereabouts: ' . $e->getMessage());
        }
    }

    public function getWhereaboutsForWidget(Request $request)
    {
        $date = $request->input('date', Carbon::now()->format('Y-m-d'));
        $office = $request->input('office', 'CPMD');
        
        // Get all active users from selected office
        $users = User::where('status', 'active')
            ->where('office', $office)
            ->with('section')
            ->orderBy('display_order')
            ->orderBy('item_number')
            ->get();

        // Get whereabouts for the specific date
        $whereabouts = Whereabout::where('date', $date)
            ->with('user')
            ->get();

        // Transform data for widget consumption
        $transformedWhereabouts = $whereabouts->map(function ($whereabout) {
            return [
                'id' => $whereabout->id,
                'user_id' => $whereabout->user_id,
                'date' => $whereabout->date->format('Y-m-d'),
                'status' => $whereabout->status,
                'reason' => $whereabout->reason,
                'location' => $whereabout->location,
                'user' => [
                    'id' => $whereabout->user->id,
                    'name' => $whereabout->user->name,
                    'email' => $whereabout->user->email,
                    'section_id' => $whereabout->user->section_id,
                    'profile_picture' => $whereabout->user->profile_picture,
                ],
            ];
        });

        // Calculate statistics
        $stats = [
            'total' => $users->count(),
            'onDuty' => $whereabouts->where('status', 'ON DUTY')->count(),
            'onTravel' => $whereabouts->where('status', 'ON TRAVEL')->count(),
            'onLeave' => $whereabouts->where('status', 'ON LEAVE')->count(),
            'absent' => $whereabouts->where('status', 'ABSENT')->count(),
            'halfDay' => $whereabouts->where('status', 'HALF DAY')->count(),
            'wfh' => $whereabouts->where('status', 'WFH')->count(),
        ];

        return response()->json([
            'data' => $transformedWhereabouts,
            'stats' => $stats,
            'date' => $date,
            'totalUsers' => $users->count(),
        ]);
    }
}
