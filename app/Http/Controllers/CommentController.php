<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Store a new comment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_id' => 'required|exists:documents,id',
            'content' => 'required|string|max:1000',
        ]);

        $comment = Comment::create([
            'document_id' => $validated['document_id'],
            'user_id' => Auth::id(),
            'content' => $validated['content'],
        ]);

        // Load relationships for response
        $comment->load(['user']);

        // If it's an Inertia request, redirect back with updated data
        if ($request->inertia()) {
            // Get the current request parameters to maintain state
            $tab = $request->input('tab', 'writeup');
            $search = $request->input('search', '');
            $perPage = $request->input('perPage', 10);
            $page = $request->input('page', 1);
            $sort = $request->input('sort', 'updated_at');
            $direction = $request->input('direction', 'desc');

            return redirect()->to("/writing?tab={$tab}&search={$search}&perPage={$perPage}&page={$page}&sort={$sort}&direction={$direction}")
                ->with('success', 'Comment added successfully!');
        }

        // For AJAX requests, return JSON
        return response()->json([
            'success' => true,
            'comment' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'author' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'email' => $comment->user->email,
                ],
                'created_at' => $comment->created_at->format('Y-m-d H:i:s'),
            ]
        ]);
    }

    /**
     * Get comments for a document.
     */
    public function index(Request $request, $documentId)
    {
        $document = Document::findOrFail($documentId);
        
        $comments = $document->comments()
            ->with(['user'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'author' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                        'email' => $comment->user->email,
                        'profile_picture' => $comment->user->profile_picture,
                    ],
                    'created_at' => $comment->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'comments' => $comments
        ]);
    }

    /**
     * Update a comment.
     */
    public function update(Request $request, Comment $comment)
    {
        // Check if user owns the comment or has permission
        if ($comment->user_id !== Auth::id() && !Auth::user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment->update([
            'content' => $validated['content'],
        ]);

        // Load relationships for response
        $comment->load(['user']);

        // If it's an Inertia request, redirect back with updated data
        if ($request->inertia()) {
            // Get the current request parameters to maintain state
            $tab = $request->input('tab', 'writeup');
            $search = $request->input('search', '');
            $perPage = $request->input('perPage', 10);
            $page = $request->input('page', 1);
            $sort = $request->input('sort', 'updated_at');
            $direction = $request->input('direction', 'desc');

            return redirect()->to("/writing?tab={$tab}&search={$search}&perPage={$perPage}&page={$page}&sort={$sort}&direction={$direction}")
                ->with('success', 'Comment updated successfully!');
        }

        // For AJAX requests, return JSON
        return response()->json([
            'success' => true,
            'comment' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'author' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'email' => $comment->user->email,
                ],
                'created_at' => $comment->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $comment->updated_at->format('Y-m-d H:i:s'),
            ]
        ]);
    }

    /**
     * Delete a comment.
     */
    public function destroy(Request $request, Comment $comment)
    {
        // Check if user owns the comment or has permission
        if ($comment->user_id !== Auth::id() && !Auth::user()->is_admin) {
            if ($request->inertia()) {
                return back()->with('error', 'Unauthorized');
            }
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $comment->delete();

        // If it's an Inertia request, redirect back with updated data
        if ($request->inertia()) {
            // Get the current request parameters to maintain state
            $tab = $request->input('tab', 'writeup');
            $search = $request->input('search', '');
            $perPage = $request->input('perPage', 10);
            $page = $request->input('page', 1);
            $sort = $request->input('sort', 'updated_at');
            $direction = $request->input('direction', 'desc');

            return redirect()->to("/writing?tab={$tab}&search={$search}&perPage={$perPage}&page={$page}&sort={$sort}&direction={$direction}")
                ->with('success', 'Comment deleted successfully!');
        }

        // For AJAX requests, return JSON
        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully'
        ]);
    }
}
