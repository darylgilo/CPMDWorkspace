<?php

namespace App\Http\Controllers\Taskboard;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskUpdate;
use App\Models\User;
use App\Models\Section;
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
        $status = $request->input('status', 'all');
        $priority = $request->input('priority', '');
        $section = $request->input('section', 'all');
        
        // Get current user's office for filtering
        $currentUserOffice = Auth::user()->office;

        $taskQuery = Task::with(['creator', 'section', 'updates' => function($query) {
            $query->orderBy('update_date', 'desc')->with('user');
        }])
            ->whereHas('creator', function ($query) use ($currentUserOffice) {
                $query->where('office', $currentUserOffice);
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status && $status !== 'all', fn($q) => $q->where('status', $status))
            ->when($priority, fn($q) => $q->where('priority', $priority))
            ->when($section && $section !== 'all', fn($q) => $q->where('section_id', $section))
            ->orderBy('created_at', 'desc');

        $myTaskQuery = Task::with(['creator', 'section', 'updates' => function($query) {
            $query->orderBy('update_date', 'desc')->with('user');
        }])
            ->where(function ($query) {
                $userId = Auth::id();
                $query->where('created_by', $userId)
                      ->orWhereJsonContains('assignees', $userId);
            })
            ->whereHas('creator', function ($query) use ($currentUserOffice) {
                $query->where('office', $currentUserOffice);
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status && $status !== 'all', fn($q) => $q->where('status', $status))
            ->when($priority, fn($q) => $q->where('priority', $priority))
            ->when($section && $section !== 'all', fn($q) => $q->where('section_id', $section))
            ->orderBy('created_at', 'desc');

        $tasks = $taskQuery->paginate($perPage, ['*'], 'page', $page);
        $myTasks = $myTaskQuery->paginate($perPage, ['*'], 'page', $page);

        // Map tasks to include updates data
        $tasks->getCollection()->transform(function ($task) {
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
                'office' => $task->office,
                'section_id' => $task->section_id,
                'section' => $task->section ? [
                    'id' => $task->section->id,
                    'name' => $task->section->name,
                    'code' => $task->section->code,
                    'office' => $task->section->office,
                ] : null,
                'creator' => $task->creator ? [
                    'id' => $task->creator->id,
                    'name' => $task->creator->name,
                    'avatar' => $task->creator->profile_picture_url,
                ] : null,
                'updates' => $task->updates->map(function ($update) {
                    return [
                        'id' => $update->id,
                        'description' => $update->description,
                        'update_date' => $update->update_date->format('Y-m-d'),
                        'progress' => $update->progress,
                        'created_at' => $update->created_at->toISOString(),
                        'user' => $update->user ? [
                            'id' => $update->user->id,
                            'name' => $update->user->name,
                            'avatar' => $update->user->avatar,
                            'profile_picture_url' => $update->user->profile_picture_url,
                        ] : null,
                    ];
                })->toArray(),
            ];
        });

        // Map myTasks to include updates data
        $myTasks->getCollection()->transform(function ($task) {
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
                'office' => $task->office,
                'section_id' => $task->section_id,
                'section' => $task->section ? [
                    'id' => $task->section->id,
                    'name' => $task->section->name,
                    'code' => $task->section->code,
                    'office' => $task->section->office,
                ] : null,
                'creator' => $task->creator ? [
                    'id' => $task->creator->id,
                    'name' => $task->creator->name,
                    'avatar' => $task->creator->profile_picture_url,
                ] : null,
                'updates' => $task->updates->map(function ($update) {
                    return [
                        'id' => $update->id,
                        'description' => $update->description,
                        'update_date' => $update->update_date->format('Y-m-d'),
                        'progress' => $update->progress,
                        'created_at' => $update->created_at->toISOString(),
                        'user' => $update->user ? [
                            'id' => $update->user->id,
                            'name' => $update->user->name,
                            'avatar' => $update->user->avatar,
                            'profile_picture_url' => $update->user->profile_picture_url,
                        ] : null,
                    ];
                })->toArray(),
            ];
        });

        // Analytics - filter by current user's office
        $analytics = [
            'total' => Task::whereHas('creator', function ($query) use ($currentUserOffice) {
                $query->where('office', $currentUserOffice);
            })->count(),
            'notStarted' => Task::where('status', 'not_started')
                ->whereHas('creator', function ($query) use ($currentUserOffice) {
                    $query->where('office', $currentUserOffice);
                })->count(),
            'inProgress' => Task::where('status', 'in_progress')
                ->whereHas('creator', function ($query) use ($currentUserOffice) {
                    $query->where('office', $currentUserOffice);
                })->count(),
            'inReview' => Task::where('status', 'in_review')
                ->whereHas('creator', function ($query) use ($currentUserOffice) {
                    $query->where('office', $currentUserOffice);
                })->count(),
            'completed' => Task::where('status', 'completed')
                ->whereHas('creator', function ($query) use ($currentUserOffice) {
                    $query->where('office', $currentUserOffice);
                })->count(),
            'cancelled' => Task::where('status', 'cancelled')
                ->whereHas('creator', function ($query) use ($currentUserOffice) {
                    $query->where('office', $currentUserOffice);
                })->count(),
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

        // Get all users for assignee picker - filter by current user's office
        $currentUserOffice = Auth::user()->office;
        $users = User::where('office', $currentUserOffice)
            ->where('status', 'active')
            ->whereNotNull('email_verified_at')
            ->select('id', 'name', 'profile_picture', 'office', 'status', 'email_verified_at')
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'avatar' => $u->profile_picture_url,
                'office' => $u->office,
                'status' => $u->status,
                'email_verified_at' => $u->email_verified_at,
            ]);

        // Get all tasks for timeline view - filter by current user's office
        $allTasks = Task::with(['creator', 'section', 'updates' => function($query) {
            $query->orderBy('update_date', 'desc')->with('user');
        }])
            ->whereHas('creator', function ($query) use ($currentUserOffice) {
                $query->where('office', $currentUserOffice);
            })
            ->when($section && $section !== 'all', fn($q) => $q->where('section_id', $section))
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
                    'office' => $task->office,
                    'section_id' => $task->section_id,
                    'section' => $task->section ? [
                        'id' => $task->section->id,
                        'name' => $task->section->name,
                        'code' => $task->section->code,
                        'office' => $task->section->office,
                    ] : null,
                    'creator' => $task->creator ? [
                        'id' => $task->creator->id,
                        'name' => $task->creator->name,
                        'avatar' => $task->creator->profile_picture_url,
                    ] : null,
                    'updates' => $task->updates->map(function ($update) {
                        return [
                            'id' => $update->id,
                            'description' => $update->description,
                            'update_date' => $update->update_date->format('Y-m-d'),
                            'progress' => $update->progress,
                            'created_at' => $update->created_at->toISOString(),
                            'user' => $update->user ? [
                                'id' => $update->user->id,
                                'name' => $update->user->name,
                            ] : null,
                        ];
                    })->toArray(),
                ];
            });

        // Get all sections for dropdown
        $sections = Section::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'office' => $s->office,
            ]);

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
            'section' => $section,
            'sections' => $sections,
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
            'office' => 'nullable|in:DO,ADO RDPSS,ADO RS,PMO,BIOTECH,NSIC,ADMINISTRATIVE,CPMD,CRPSD,AED,PPSSD,NPQSD,NSQCS,Baguio BPI center,Davao BPI center,Guimaras BPI center,La Granja BPI center,Los Baños BPI center,Others',
            'section_id' => 'nullable|integer|exists:sections,id',
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
            'office' => 'nullable|in:DO,ADO RDPSS,ADO RS,PMO,BIOTECH,NSIC,ADMINISTRATIVE,CPMD,CRPSD,AED,PPSSD,NPQSD,NSQCS,Baguio BPI center,Davao BPI center,Guimaras BPI center,La Granja BPI center,Los Baños BPI center,Others',
            'section_id' => 'nullable|integer|exists:sections,id',
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
            // Get fresh allTasks data - filter by current user's office
            $currentUserOffice = Auth::user()->office;
            $allTasks = Task::with('creator')
                ->whereHas('creator', function ($query) use ($currentUserOffice) {
                    $query->where('office', $currentUserOffice);
                })
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
        $currentUserOffice = Auth::user()->office;
        return Task::where(function ($q) use ($userId) {
                $q->where('created_by', $userId)
                      ->orWhereJsonContains('assignees', $userId);
            })
            ->where('status', '!=', 'completed')
            ->whereHas('creator', function ($query) use ($currentUserOffice) {
                $query->where('office', $currentUserOffice);
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }

    public function storeUpdate(Request $request, Task $task)
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
            'description' => 'required|string',
            'update_date' => 'required|date',
            'progress' => 'nullable|integer|min:0|max:100',
        ]);

        $validated['task_id'] = $task->id;
        $validated['user_id'] = $userId;

        $update = TaskUpdate::create($validated);

        // Return JSON response for AJAX requests
        if ($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => 'Task update added successfully.',
                'update' => [
                    'id' => $update->id,
                    'description' => $update->description,
                    'update_date' => $update->update_date->format('Y-m-d'),
                    'progress' => $update->progress,
                    'created_at' => $update->created_at->toISOString(),
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                    ]
                ]
            ]);
        }

        return redirect()->back()->with('success', 'Task update added successfully.');
    }

    public function updateUpdate(Request $request, TaskUpdate $taskUpdate)
    {
        $userId = Auth::id();
        $user = Auth::user();
        $isCreator = $taskUpdate->user_id === $userId;
        $isTaskCreator = $taskUpdate->task->created_by === $userId;
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (!$isCreator && !$isTaskCreator && !$isAdmin) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'description' => 'required|string|max:1000',
            'update_date' => 'required|date|before_or_equal:today',
            'progress' => 'nullable|integer|min:0|max:100',
        ]);

        // Update the task update with progress if provided
        $updateData = [
            'description' => $request->description,
            'update_date' => $request->update_date,
        ];

        // Only update progress if it's provided (not null/undefined)
        if ($request->has('progress') && $request->progress !== null) {
            $updateData['progress'] = $request->progress;
        }

        $taskUpdate->update($updateData);

        // Return JSON response for AJAX requests
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Task update updated successfully.',
                'update' => $taskUpdate->load('user:id,name')
            ]);
        }

        return redirect()->back()->with('success', 'Task update updated successfully.');
    }

    public function destroyUpdate(TaskUpdate $taskUpdate)
    {
        $userId = Auth::id();
        $user = Auth::user();
        $isCreator = $taskUpdate->user_id === $userId;
        $isTaskCreator = $taskUpdate->task->created_by === $userId;
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (!$isCreator && !$isTaskCreator && !$isAdmin) {
            abort(403, 'Unauthorized action.');
        }

        $taskUpdate->delete();

        // Return JSON response for AJAX requests
        if (request()->expectsJson() || request()->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json(['success' => 'Task update deleted successfully.']);
        }

        return redirect()->back()->with('success', 'Task update deleted successfully.');
    }

    public function getTaskUpdates(Task $task)
    {
        $userId = Auth::id();
        $user = Auth::user();
        $isCreator = $task->created_by === $userId;
        $isAssignee = is_array($task->assignees) && in_array($userId, $task->assignees);
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (!$isCreator && !$isAssignee && !$isAdmin) {
            abort(403, 'Unauthorized action.');
        }

        $updates = $task->updates()
            ->with('user:id,name')
            ->orderBy('update_date', 'desc')
            ->get()
            ->map(function ($update) {
                return [
                    'id' => $update->id,
                    'description' => $update->description,
                    'update_date' => $update->update_date->format('Y-m-d'),
                    'created_at' => $update->created_at->toISOString(),
                    'user' => $update->user ? [
                        'id' => $update->user->id,
                        'name' => $update->user->name,
                    ] : null,
                ];
            });

        return response()->json(['updates' => $updates]);
    }

}
