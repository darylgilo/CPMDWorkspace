<?php

namespace App\Http\Controllers\Taskboard;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\TaskNotification;
use App\Jobs\SendTaskEmailJob;

class TaskboardController extends Controller
{
    public function index(Request $request)
    {
        $tab = $request->input('tab', 'taskboard');
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        $page = $request->input('page', 1);
        $status = $request->input('status', '');
        $priority = $request->input('priority', '');

        $taskQuery = Task::with('creator')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($priority, fn($q) => $q->where('priority', $priority))
            ->orderBy('created_at', 'desc');

        $myTaskQuery = Task::with('creator')
            ->where(function ($query) {
                $userId = Auth::id();
                $query->where('created_by', $userId)
                      ->orWhereJsonContains('assignees', $userId);
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($priority, fn($q) => $q->where('priority', $priority))
            ->orderBy('created_at', 'desc');

        $tasks = $taskQuery->paginate($perPage, ['*'], 'page', $page);
        $myTasks = $myTaskQuery->paginate($perPage, ['*'], 'page', $page);

        // Analytics
        $analytics = [
            'total' => Task::count(),
            'notStarted' => Task::where('status', 'not_started')->count(),
            'inProgress' => Task::where('status', 'in_progress')->count(),
            'inReview' => Task::where('status', 'in_review')->count(),
            'completed' => Task::where('status', 'completed')->count(),
            'cancelled' => Task::where('status', 'cancelled')->count(),
        ];

        $userId = Auth::id();
        $myAnalytics = [
            'total' => Task::where(function ($q) use ($userId) {
                $q->where('created_by', $userId)->orWhereJsonContains('assignees', $userId);
            })->count(),
            'notStarted' => Task::where(function ($q) use ($userId) {
                $q->where('created_by', $userId)->orWhereJsonContains('assignees', $userId);
            })->where('status', 'not_started')->count(),
            'inProgress' => Task::where(function ($q) use ($userId) {
                $q->where('created_by', $userId)->orWhereJsonContains('assignees', $userId);
            })->where('status', 'in_progress')->count(),
            'completed' => Task::where(function ($q) use ($userId) {
                $q->where('created_by', $userId)->orWhereJsonContains('assignees', $userId);
            })->where('status', 'completed')->count(),
        ];

        // Get all users for assignee picker
        $users = User::where(function ($query) {
                $query->where('office', 'CPMD')->orWhere('cpmd', 1);
            })
            ->where('status', 'active')
            ->whereNotNull('email_verified_at')
            ->select('id', 'name', 'profile_picture')
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'avatar' => $u->profile_picture_url,
            ]);

        // Get all tasks for timeline view
        $allTasks = Task::with('creator')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'end_date' => $task->end_date,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'progress' => $task->progress,
                    'created_by' => $task->created_by,
                    'assignees' => $task->assignees,
                    'created_at' => $task->created_at,
                    'creator' => $task->creator ? [
                        'id' => $task->creator->id,
                        'name' => $task->creator->name,
                        'avatar' => $task->creator->profile_picture_url,
                    ] : null,
                ];
            });

        return Inertia::render('Taskboard/TaskboardIndex', [
            'activeTab' => $tab,
            'search' => $search,
            'perPage' => (int) $perPage,
            'tasks' => $tasks,
            'myTasks' => $myTasks,
            'analytics' => $analytics,
            'myAnalytics' => $myAnalytics,
            'users' => $users,
            'statusFilter' => $status,
            'priorityFilter' => $priority,
            'allTasks' => $allTasks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'end_date' => 'nullable|date',
            'status' => 'required|in:not_started,in_progress,in_review,completed,cancelled',
            'priority' => 'required|in:low,medium,high,urgent',
            'progress' => 'required|integer|min:0|max:100',
            'assignees' => 'nullable|array',
            'assignees.*' => 'integer|exists:users,id',
        ]);

        $validated['created_by'] = Auth::id();

        $task = Task::create($validated);
        SendTaskEmailJob::dispatch($task, 'created');

        return redirect()->back()->with('success', 'Task created successfully.');
    }

    public function update(Request $request, Task $task)
    {
        $userId = Auth::id();
        $user = Auth::user();
        $isCreator = $task->created_by === $userId;
        $isAssignee = is_array($task->assignees) && in_array($userId, $task->assignees);
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (!$isCreator && !$isAssignee && !$isAdmin) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'end_date' => 'nullable|date',
            'status' => 'required|in:not_started,in_progress,in_review,completed,cancelled',
            'priority' => 'required|in:low,medium,high,urgent',
            'progress' => 'required|integer|min:0|max:100',
            'assignees' => 'nullable|array',
            'assignees.*' => 'integer|exists:users,id',
        ]);

        $oldProgress = $task->progress;
        $oldAssignees = $task->assignees ?? [];

        $task->update($validated);

        $newAssignees = $task->assignees ?? [];
        $addedAssignees = array_diff($newAssignees, $oldAssignees);

        // Get assignee names for email notification
        $users = User::whereIn('id', $newAssignees)->get();
        $assigneeNames = $users->pluck('name')->toArray();

        if ($task->progress != $oldProgress || !empty($addedAssignees)) {
            SendTaskEmailJob::dispatch($task, 'updated', $assigneeNames);
        }

        // For API requests (like drag-and-drop), return JSON
        // Only return JSON if it's not an Inertia request
        if (($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') 
            && !$request->header('X-Inertia')) {
            // Get fresh allTasks data
            $allTasks = Task::with('creator')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'end_date' => $task->end_date,
                        'status' => $task->status,
                        'priority' => $task->priority,
                        'progress' => $task->progress,
                        'created_by' => $task->created_by,
                        'assignees' => $task->assignees,
                        'created_at' => $task->created_at,
                        'creator' => $task->creator ? [
                            'id' => $task->creator->id,
                            'name' => $task->creator->name,
                            'avatar' => $task->creator->profile_picture_url,
                        ] : null,
                    ];
                });

            return response()->json([
                'success' => 'Task updated successfully.',
                'allTasks' => $allTasks
            ]);
        }

        return redirect()->back()->with('success', 'Task updated successfully.');
    }

    public function destroy(Task $task)
    {
        $userId = Auth::id();
        $user = Auth::user();
        $isCreator = $task->created_by === $userId;
        $isAssignee = is_array($task->assignees) && in_array($userId, $task->assignees);
        $isSuperAdmin = $user->role === 'superadmin';
        $isAdmin = $user->role === 'admin';

        // Superadmin: Can delete everything
        // Admin: Can delete if creator or assignee
        // User: Can delete if creator
        if (!$isSuperAdmin && !$isCreator && !($isAdmin && $isAssignee)) {
            abort(403, 'Unauthorized action.');
        }

        $task->delete();
        return redirect()->back()->with('success', 'Task deleted successfully.');
    }

    public function getMyTasks()
    {
        $userId = Auth::id();
        return Task::where(function ($query) use ($userId) {
                $query->where('created_by', $userId)
                      ->orWhereJsonContains('assignees', $userId);
            })
            ->where('status', '!=', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }

}
