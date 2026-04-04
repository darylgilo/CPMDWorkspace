<?php

namespace App\Http\Controllers;

use App\Models\FormSubmission;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HelpdeskController extends Controller
{
    public function index()
    {
        $submissions = FormSubmission::with(['form', 'user', 'assignedUser'])
            ->latest()
            ->get()
            ->map(function ($submission) {
                return [
                    'id' => $submission->request_id ?? 'REQ-' . str_pad($submission->id, 4, '0', STR_PAD_LEFT),
                    'user' => $submission->submitter_name ?? $submission->user->name ?? 'Unknown',
                    'avatar' => $submission->user->profile_picture_url,
                    'profile_picture' => $submission->user->profile_picture_url,
                    'issue' => $submission->form->title ?? 'Unknown Form',
                    'status' => $this->mapStatus($submission->status),
                    'assigned' => $submission->assignedUser ? $submission->assignedUser->name : null,
                    'assigned_user_id' => $submission->assigned_to,
                    'assignees' => $submission->assignees ? json_decode($submission->assignees) : null,
                    'date' => $submission->created_at->diffForHumans(),
                    'priority' => $submission->priority ?? 'medium',
                    'form_id' => $submission->form_id,
                    'submission_id' => $submission->id,
                ];
            });

        $stats = [
            'total' => $submissions->count(),
            'unassigned' => $submissions->where('assigned', null)->count(),
            'in_progress' => $submissions->where('status', 'In Progress')->count(),
            'resolved' => $submissions->where('status', 'Resolved')->count(),
        ];

        // Get all users that can be assigned to tickets
        $users = User::select('id', 'name', 'email', 'profile_picture')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Helpdesk/Helpdesk', [
            'tickets' => $submissions,
            'stats' => $stats,
            'users' => $users,
        ]);
    }

    public function assignments()
    {
        $submissions = FormSubmission::with(['form', 'user', 'assignedUser'])
            ->latest()
            ->get()
            ->map(function ($submission) {
                return [
                    'id' => $submission->request_id ?? 'REQ-' . str_pad($submission->id, 4, '0', STR_PAD_LEFT),
                    'user' => $submission->submitter_name ?? $submission->user->name ?? 'Unknown',
                    'avatar' => $submission->user->profile_picture_url,
                    'profile_picture' => $submission->user->profile_picture_url,
                    'issue' => $submission->form->title ?? 'Unknown Form',
                    'status' => $this->mapStatus($submission->status),
                    'assigned' => $submission->assignedUser ? $submission->assignedUser->name : null,
                    'assigned_user_id' => $submission->assigned_to,
                    'assignees' => $submission->assignees ? json_decode($submission->assignees) : [],
                    'date' => $submission->created_at->diffForHumans(),
                    'priority' => $submission->priority ?? 'medium',
                    'form_id' => $submission->form_id,
                    'submission_id' => $submission->id,
                ];
            });

        // Get all users that can be assigned to tickets
        $users = User::select('id', 'name', 'email', 'profile_picture')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Helpdesk/Assignment', [
            'allRequests' => $submissions,
            'users' => $users,
        ]);
    }

    public function updateAssignment(Request $request, $id)
    {
        $request->validate([
            'assignees' => 'nullable|array',
            'assignees.*' => 'exists:users,id',
        ]);

        $submission = FormSubmission::findOrFail($id);
        
        // Handle multiple assignees if provided
        if ($request->has('assignees') && is_array($request->assignees)) {
            $submission->assignees = !empty($request->assignees) ? json_encode($request->assignees) : null;
            // Don't set assigned_to since we're using multiple assignees
        } else {
            // Handle single assignment - set both for backward compatibility
            $submission->assigned_to = $request->assigned_to;
            $submission->assignees = $request->assigned_to ? json_encode([$request->assigned_to]) : null;
        }
        
        $submission->save();

        return back()->with('success', 'Ticket assignment updated successfully.');
    }

    private function mapStatus($status)
    {
        return match($status) {
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'resolved' => 'Resolved',
            'submitted' => 'Pending',
            'reviewed' => 'In Progress',
            'approved' => 'Resolved',
            'rejected' => 'Rejected',
            default => 'Pending',
        };
    }
}
