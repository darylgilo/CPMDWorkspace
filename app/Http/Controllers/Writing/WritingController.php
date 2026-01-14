<?php

namespace App\Http\Controllers\Writing;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WritingController extends Controller
{
    /**
     * Display writing management page with tabs.
     */
    public function index(Request $request)
    {
        $tab = $request->input('tab', 'writeup');
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        $page = $request->input('page', 1);
        $sort = $request->input('sort', 'updated_at');
        $direction = $request->input('direction', 'desc');
        
        $data = [
            'activeTab' => $tab,
            'search' => $search,
            'perPage' => $perPage,
        ];

        // Handle archive tab
        if ($tab === 'archive') {
            $user = auth()->user();
            
            // Build query for archive documents
            $query = Document::with(['user'])
                ->where('user_id', $user->id);

            // Apply search
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', '%' . $search . '%')
                      ->orWhere('content', 'like', '%' . $search . '%')
                      ->orWhere('category', 'like', '%' . $search . '%')
                      ->orWhere('status', 'like', '%' . $search . '%');
                });
            }

            // Apply sorting
            if ($sort === 'author.name') {
                $query->join('users', 'documents.user_id', '=', 'users.id')
                      ->orderBy('users.name', $direction)
                      ->select('documents.*');
            } else {
                $query->orderBy($sort, $direction);
            }

            // Get paginated documents
            $documents = $query->paginate($perPage, ['*'], 'page', $page);

            // Transform the data
            $transformedDocuments = $documents->getCollection()->map(function ($document) {
                return [
                    'id' => $document->id,
                    'title' => $document->title,
                    'content' => $document->content,
                    'category' => $document->category,
                    'status' => $document->status,
                    'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                    'author' => [
                        'id' => $document->user->id,
                        'name' => $document->user->name,
                        'email' => $document->user->email,
                    ],
                ];
            });

            // Create paginated data structure
            $paginatedData = [
                'data' => $transformedDocuments,
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
                'per_page' => $documents->perPage(),
                'total' => $documents->total(),
            ];

            return Inertia::render('Writing/index', array_merge($data, [
                'documents' => $paginatedData,
                'auth' => [
                    'user' => $user,
                ],
            ]));
        }

        // Build query for writeup tab
        $query = Document::with(['user', 'histories.user', 'comments.user', 'approvedBy', 'approvals', 'likes', 'bookmarks']);

        // Apply search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('content', 'like', '%' . $search . '%')
                  ->orWhere('category', 'like', '%' . $search . '%')
                  ->orWhere('status', 'like', '%' . $search . '%')
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        // Apply sorting
        if ($sort === 'author.name') {
            $query->join('users', 'documents.user_id', '=', 'users.id')
                  ->orderBy('users.name', $direction)
                  ->select('documents.*');
        } else {
            $query->orderBy($sort, $direction);
        }

        // Get paginated documents
        $documents = $query->paginate($perPage, ['*'], 'page', $page);

        // Transform the data
        $transformedDocuments = $documents->getCollection()->map(function ($document) {
            return [
                'id' => $document->id,
                'title' => $document->title,
                'content' => $document->content,
                'category' => $document->category,
                'status' => $document->status,
                'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                'likes_count' => $document->likes_count,
                'approvals_count' => $document->approvals_count,
                'approved_at' => $document->approved_at?->format('Y-m-d H:i:s'),
                'is_liked' => auth()->check() ? $document->isLikedBy(auth()->id()) : false,
                'is_approved' => auth()->check() ? $document->isApprovedBy(auth()->id()) : false,
                'is_bookmarked' => auth()->check() ? $document->isBookmarkedBy(auth()->id()) : false,
                'author' => [
                    'id' => $document->user->id,
                    'name' => $document->user->name,
                    'email' => $document->user->email,
                ],
                'histories' => $document->histories->map(function ($history) {
                    return [
                        'id' => $history->id,
                        'action' => $history->action,
                        'user' => [
                            'id' => $history->user->id,
                            'name' => $history->user->name,
                            'email' => $history->user->email,
                        ],
                        'created_at' => $history->created_at->format('Y-m-d H:i:s'),
                    ];
                }),
                'comments' => $document->comments->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'content' => $comment->content,
                        'author' => [
                            'id' => $comment->user->id,
                            'name' => $comment->user->name,
                            'email' => $comment->user->email,
                        ],
                        'created_at' => $comment->created_at->format('Y-m-d H:i:s'),
                    ];
                }),
            ];
        });

        // Create paginated data structure
        $paginatedData = [
            'data' => $transformedDocuments,
            'current_page' => $documents->currentPage(),
            'last_page' => $documents->lastPage(),
            'per_page' => $documents->perPage(),
            'total' => $documents->total(),
        ];

        // Generate analytics data
        $analytics = [
            'categoryStatistics' => [
                [
                    'category' => 'posting',
                    'count' => Document::where('category', 'posting')->count(),
                    'totalDocuments' => Document::where('category', 'posting')->count(),
                ],
                [
                    'category' => 'travel_report',
                    'count' => Document::where('category', 'travel_report')->count(),
                    'totalDocuments' => Document::where('category', 'travel_report')->count(),
                ],
            ],
            'totalDocuments' => Document::count(),
            'draftCount' => Document::where('status', 'draft')->count(),
            'approvedCount' => Document::where('status', 'approved')->count(),
            'postedCount' => Document::where('status', 'posted')->count(),
        ];

        // Merge all data
        $data = array_merge($data, [
            'documents' => $paginatedData,
            'documentAnalytics' => $analytics,
            'categories' => ['posting', 'travel_report'],
            'current_user' => auth()->check() ? [
                'id' => auth()->id(),
                'name' => auth()->user()->name,
                'email' => auth()->user()->email,
            ] : null,
        ]);

        return Inertia::render('Writing/index', $data);
    }

    /**
     * Show form for editing a document.
     */
    public function edit(Request $request, $id)
    {
        $document = Document::with(['user', 'histories.user'])->find($id);
        
        if (!$document) {
            abort(404, 'Document not found');
        }
        
        // Get the tab parameter from the request
        $tab = $request->input('tab', 'writeup');
        
        return Inertia::render('Writing/editdocument', [
            'document' => [
                'id' => $document->id,
                'title' => $document->title,
                'content' => $document->content,
                'category' => $document->category,
                'status' => $document->status,
                'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                'author' => [
                    'id' => $document->user->id,
                    'name' => $document->user->name,
                    'email' => $document->user->email,
                ],
                'histories' => $document->histories->map(function ($history) {
                    return [
                        'id' => $history->id,
                        'action' => $history->action,
                        'user' => [
                            'id' => $history->user->id,
                            'name' => $history->user->name,
                            'email' => $history->user->email,
                        ],
                        'created_at' => $history->created_at->format('Y-m-d H:i:s'),
                    ];
                }),
            ],
            'tab' => $tab,
        ]);
    }

    /**
     * Show a posted document for viewing.
     */
    public function postedView(Document $document)
    {
        return Inertia::render('Writing/PostedView', [
            'document' => [
                'id' => $document->id,
                'title' => $document->title,
                'content' => $document->content,
                'category' => $document->category,
                'status' => $document->status,
                'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                'author' => [
                    'id' => $document->user->id,
                    'name' => $document->user->name,
                    'email' => $document->user->email,
                ],
            ],
        ]);
    }

    /**
     * Store a new document.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:posting,travel_report',
            'status' => 'required|in:draft,for review,approved,rejected,posted',
        ]);

        $document = Document::create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'status' => $validated['status'],
        ]);

        return redirect('/writing')->with('success', 'Document created successfully!');
    }

    /**
     * Update a document.
     */
    public function update(Request $request, Document $document)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:posting,travel_report',
            'status' => 'required|in:draft,for review,approved,rejected,posted',
        ]);

        $document->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'status' => $validated['status'],
        ]);

        // Get the tab parameter from the request
        $tab = $request->input('tab', 'writeup');
        
        return redirect("/writing?tab={$tab}")->with('success', 'Document updated successfully!');
    }

    /**
     * Display user's document archive.
     */
    public function archive(Request $request)
    {
        $user = auth()->user();
        
        // Get all documents created by the current user
        $userDocuments = Document::with(['user'])
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($document) {
                return [
                    'id' => $document->id,
                    'title' => $document->title,
                    'content' => $document->content,
                    'category' => $document->category,
                    'status' => $document->status,
                    'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                    'author' => [
                        'id' => $document->user->id,
                        'name' => $document->user->name,
                        'email' => $document->user->email,
                    ],
                ];
            });

        return Inertia::render('Writing/archive', [
            'documents' => $userDocuments,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Delete a document.
     */
    public function destroy(Document $document)
    {
        // Create history record before deletion
        $document->histories()->create([
            'user_id' => auth()->id(),
            'title' => $document->title,
            'content' => $document->content,
            'category' => $document->category,
            'action' => 'deleted',
        ]);

        $document->delete();

        return redirect('/writing')->with('success', 'Document deleted successfully!');
    }

    /**
     * Approve a document (toggle user approval).
     */
    public function approve(Request $request, Document $document)
    {
        $wasAdded = $document->approve(auth()->id());

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
                ->with('success', $wasAdded ? 'Document approved successfully!' : 'Approval removed successfully!');
        }

        // For AJAX requests, return JSON
        return response()->json([
            'success' => true,
            'message' => $wasAdded ? 'Document approved successfully!' : 'Approval removed successfully!',
            'approvals_count' => $document->fresh()->approvals_count,
            'is_approved' => $document->fresh()->isApprovedBy(auth()->id()),
        ]);
    }

    /**
     * Like a document (toggle user like).
     */
    public function like(Request $request, Document $document)
    {
        $wasAdded = $document->like(auth()->id());

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
                ->with('success', $wasAdded ? 'Document liked successfully!' : 'Like removed successfully!');
        }

        // For AJAX requests, return JSON
        return response()->json([
            'success' => true,
            'message' => $wasAdded ? 'Document liked successfully!' : 'Like removed successfully!',
            'likes_count' => $document->fresh()->likes_count,
            'is_liked' => $document->fresh()->isLikedBy(auth()->id()),
        ]);
    }

    /**
     * Update document status.
     */
    public function updateStatus(Request $request, Document $document)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,for review,approved,rejected,posted',
        ]);

        $oldStatus = $document->status;
        $document->update([
            'status' => $validated['status'],
        ]);

        // Create history record for status change
        $document->histories()->create([
            'user_id' => auth()->id(),
            'title' => $document->title,
            'content' => $document->content,
            'category' => $document->category,
            'action' => "Status changed from {$oldStatus} to {$validated['status']}",
        ]);

        // Get current request parameters to maintain state
        $tab = $request->input('tab', 'writeup');
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        $page = $request->input('page', 1);
        $sort = $request->input('sort', 'updated_at');
        $direction = $request->input('direction', 'desc');

        return redirect()->to("/writing?tab={$tab}&search={$search}&perPage={$perPage}&page={$page}&sort={$sort}&direction={$direction}")
            ->with('success', 'Document status updated successfully!');
    }

    /**
     * Bookmark a document (toggle user bookmark).
     */
    public function bookmark(Request $request, Document $document)
    {
        $wasAdded = $document->bookmark(auth()->id());

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
                ->with('success', $wasAdded ? 'Document bookmarked successfully!' : 'Bookmark removed successfully!');
        }

        // For AJAX requests, return JSON
        return response()->json([
            'success' => true,
            'message' => $wasAdded ? 'Document bookmarked successfully!' : 'Bookmark removed successfully!',
            'is_bookmarked' => $document->fresh()->isBookmarkedBy(auth()->id()),
        ]);
    }
}
