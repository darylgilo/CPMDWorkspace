<?php

namespace App\Http\Controllers\Writing;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentImage;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\WritingNotification;
use App\Jobs\SendWritingEmailJob;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            $currentUserOffice = Auth::user()->office;
            $query = Document::with(['user'])
                ->where('user_id', $user->id)
                ->whereHas('user', function ($query) use ($currentUserOffice) {
                    $query->where('office', $currentUserOffice);
                });

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
                        'profile_picture' => $document->user->profile_picture,
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
        $currentUser = Auth::user();
        $currentUserOffice = $currentUser->office;
        $currentUserRole = $currentUser->role;
        
        $query = Document::with(['user', 'histories.user', 'comments.user', 'approvedBy', 'approvals', 'likes', 'bookmarks', 'images']);
        
        // ICS users can see all documents, others only see their office
        if ($currentUserRole !== 'ICS') {
            $query->whereHas('user', function ($query) use ($currentUserOffice) {
                $query->where('office', $currentUserOffice);
            });
        }

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
                    'role' => $document->user->role,
                    'office' => $document->user->office,
                    'profile_picture' => $document->user->profile_picture,
                ],
                'histories' => $document->histories->map(function ($history) {
                    return [
                        'id' => $history->id,
                        'action' => $history->action,
                        'user' => [
                            'id' => $history->user->id,
                            'name' => $history->user->name,
                            'email' => $history->user->email,
                            'profile_picture' => $history->user->profile_picture,
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
                            'role' => $comment->user->role,
                            'office' => $comment->user->office,
                            'profile_picture' => $comment->user->profile_picture,
                        ],
                        'created_at' => $comment->created_at->format('Y-m-d H:i:s'),
                    ];
                }),
                'images' => $document->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image_path' => $image->image_path,
                        'image_name' => $image->image_name,
                        'file_size' => $image->file_size,
                        'mime_type' => $image->mime_type,
                        'sort_order' => $image->sort_order,
                        'url' => $image->url,
                        'thumbnail_url' => $image->thumbnail_url,
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

        // Generate analytics data - ICS users see all, others see their office only
        $currentUser = Auth::user();
        $currentUserOffice = $currentUser->office;
        $currentUserRole = $currentUser->role;
        
        // Base queries
        $baseQuery = function ($query) use ($currentUserRole, $currentUserOffice) {
            if ($currentUserRole !== 'ICS') {
                $query->whereHas('user', function ($subQuery) use ($currentUserOffice) {
                    $subQuery->where('office', $currentUserOffice);
                });
            }
        };
        
        $analytics = [
            'categoryStatistics' => [
                [
                    'category' => 'posting',
                    'count' => Document::where('category', 'posting')
                        ->when($currentUserRole !== 'ICS', $baseQuery)
                        ->count(),
                    'totalDocuments' => Document::where('category', 'posting')
                        ->when($currentUserRole !== 'ICS', $baseQuery)
                        ->count(),
                ],
                [
                    'category' => 'travel_report',
                    'count' => Document::where('category', 'travel_report')
                        ->when($currentUserRole !== 'ICS', $baseQuery)
                        ->count(),
                    'totalDocuments' => Document::where('category', 'travel_report')
                        ->when($currentUserRole !== 'ICS', $baseQuery)
                        ->count(),
                ],
            ],
            'totalDocuments' => Document::when($currentUserRole !== 'ICS', $baseQuery)->count(),
            'draftCount' => Document::where('status', 'draft')
                ->when($currentUserRole !== 'ICS', $baseQuery)
                ->count(),
            'approvedCount' => Document::where('status', 'approved')
                ->when($currentUserRole !== 'ICS', $baseQuery)
                ->count(),
            'postedCount' => Document::where('status', 'posted')
                ->when($currentUserRole !== 'ICS', $baseQuery)
                ->count(),
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
     * Get writeups for widget (API endpoint)
     */
    public function getWriteupsForWidget(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        
        // Get current user's role for filtering
        $currentUser = Auth::user();
        $currentUserRole = $currentUser->role;
        
        // Build query for documents
        $query = Document::with(['user']);
        
        // ICS users can see all documents, others only see their office
        if ($currentUserRole !== 'ICS') {
            $query->whereHas('user', function ($query) use ($currentUser) {
                $query->where('office', $currentUser->office);
            });
        }
        
        $query->orderBy('updated_at', 'desc');

        // Get paginated documents
        $documents = $query->paginate($perPage, ['*'], 'page', 1);

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
                'author' => [
                    'id' => $document->user->id,
                    'name' => $document->user->name,
                    'role' => $document->user->role,
                    'office' => $document->user->office,
                    'profile_picture' => $document->user->profile_picture,
                ],
            ];
        });

        return response()->json([
            'data' => $transformedDocuments,
            'total' => $documents->total(),
        ]);
    }

    /**
     * Show form for editing a document.
     */
    public function edit(Request $request, $id)
    {
        $document = Document::with(['user', 'histories.user', 'images'])->find($id);
        
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
                            'profile_picture' => $history->user->profile_picture,
                        ],
                        'created_at' => $history->created_at->format('Y-m-d H:i:s'),
                    ];
                }),
                'images' => $document->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image_path' => $image->image_path,
                        'image_name' => $image->image_name,
                        'file_size' => $image->file_size,
                        'mime_type' => $image->mime_type,
                        'sort_order' => $image->sort_order,
                        'url' => $image->url,
                        'thumbnail_url' => $image->thumbnail_url,
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
        // For security, only documents with 'posted' status can be viewed through this route
        if ($document->status !== 'posted') {
            abort(403, 'This document is not available for public viewing.');
        }

        $document->load(['user', 'images']);
        
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
                    'role' => $document->user->role,
                    'office' => $document->user->office,
                    'profile_picture' => $document->user->profile_picture,
                ],
                'images' => $document->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image_path' => $image->image_path,
                        'image_name' => $image->image_name,
                        'file_size' => $image->file_size,
                        'mime_type' => $image->mime_type,
                        'sort_order' => $image->sort_order,
                        'url' => $image->url,
                        'thumbnail_url' => $image->thumbnail_url,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Store a new document.
     */
    public function store(Request $request)
    {
        \Log::info('Document store method called');
        \Log::info('Request data: ' . json_encode($request->all()));
        \Log::info('Request files: ' . json_encode($request->allFiles()));
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:posting,travel_report',
            'status' => 'required|in:draft,for review,approved,rejected,posted',
            'images' => 'array|max:15', // Max 15 images
            'images.*' => 'file|image|max:30720', // Max 30MB per image
        ]);

        \Log::info('Validation passed');

        $document = Document::create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'status' => $validated['status'],
        ]);

        \Log::info('Document created with ID: ' . $document->id);

        // Handle image uploads
        if ($request->hasFile('images')) {
            \Log::info('Images found in request');
            \Log::info('Image count: ' . count($request->file('images')));
            
            foreach ($request->file('images') as $index => $image) {
                \Log::info('Processing image ' . $index . ': ' . $image->getClientOriginalName());
                $path = $image->store('document-images', 'public');
                
                DocumentImage::create([
                    'document_id' => $document->id,
                    'image_path' => $path,
                    'image_name' => $image->getClientOriginalName(),
                    'file_size' => $image->getSize(),
                    'mime_type' => $image->getMimeType(),
                    'sort_order' => $index,
                ]);
                
                \Log::info('Image ' . $index . ' saved at: ' . $path);
            }
        } else {
            \Log::info('No images found in request');
        }

        if ($document->status === 'for review') {
            SendWritingEmailJob::dispatch($document);
        }

        \Log::info('Document store method completed successfully');
        return redirect('/writing')->with('success', 'Document created successfully!');
    }

    /**
     * Update a document.
     */
    public function update(Request $request, Document $document)
    {
        // Check if user owns the document or has permission based on role/office
        $currentUser = auth()->user();
        $documentAuthor = $document->user;
        
        $canEdit = false;
        
        // Document owner can always edit
        if ($document->user_id === $currentUser->id) {
            $canEdit = true;
        }
        // Admin and superadmin can edit any document
        elseif (in_array($currentUser->role, ['admin', 'superadmin'])) {
            $canEdit = true;
        }
        // ICS can edit any document
        elseif ($currentUser->role === 'ICS') {
            $canEdit = true;
        }
        // Office-based permissions: CPMD can edit CPMD documents, NPQSD can edit NPQSD documents, etc.
        elseif ($currentUser->role === $documentAuthor->office) {
            $canEdit = true;
        }
        
        if (!$canEdit) {
            abort(403, 'Unauthorized action.');
        }
        
        // Get existing image count
        $existingImageCount = $document->images()->count();
        $maxNewImages = max(0, 15 - $existingImageCount);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:posting,travel_report',
            'status' => 'required|in:draft,for review,approved,rejected,posted',
            'images' => $maxNewImages > 0 ? "array|max:{$maxNewImages}" : 'array|max:0', // Dynamic max based on existing images
            'images.*' => 'file|image|max:30720', // Max 30MB per image
        ]);

        $document->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'status' => $validated['status'],
        ]);

        // Handle new image uploads
        if ($request->hasFile('images')) {
            \Log::info('Images received in update method');
            \Log::info('Image count: ' . count($request->file('images')));
            
            // Get current max sort order
            $maxSortOrder = $document->images()->max('sort_order') ?? 0;
            
            foreach ($request->file('images') as $index => $image) {
                \Log::info('Processing image: ' . $index);
                $path = $image->store('document-images', 'public');
                
                DocumentImage::create([
                    'document_id' => $document->id,
                    'image_path' => $path,
                    'image_name' => $image->getClientOriginalName(),
                    'file_size' => $image->getSize(),
                    'mime_type' => $image->getMimeType(),
                    'sort_order' => $maxSortOrder + $index + 1,
                ]);
            }
        } else {
            \Log::info('No images received in update method');
            \Log::info('Request data: ' . json_encode($request->all()));
        }

        if ($document->wasChanged('status') && $document->status === 'for review') {
            SendWritingEmailJob::dispatch($document);
        }

        // Get the tab parameter from the request
        $tab = $request->input('tab', 'writeup');
        
        return redirect("/writing?tab={$tab}")->with('success', 'Document updated successfully!');
    }

    /**
     * Delete an image from a document.
     */
    public function deleteImage(Request $request, Document $document, DocumentImage $image)
    {
        // Check if user owns the document or has permission based on role/office
        $currentUser = auth()->user();
        $documentAuthor = $document->user;
        
        $canEdit = false;
        
        // Document owner can always edit
        if ($document->user_id === $currentUser->id) {
            $canEdit = true;
        }
        // Admin and superadmin can edit any document
        elseif (in_array($currentUser->role, ['admin', 'superadmin'])) {
            $canEdit = true;
        }
        // ICS can edit any document
        elseif ($currentUser->role === 'ICS') {
            $canEdit = true;
        }
        // Office-based permissions: CPMD can edit CPMD documents, NPQSD can edit NPQSD documents, etc.
        elseif ($currentUser->role === $documentAuthor->office) {
            $canEdit = true;
        }
        
        if (!$canEdit) {
            abort(403, 'Unauthorized action.');
        }

        // Check if the image belongs to the document
        if ($image->document_id !== $document->id) {
            abort(404, 'Image not found.');
        }

        // Delete the file from storage
        Storage::disk('public')->delete($image->image_path);

        // Delete the database record
        $image->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Image deleted successfully']);
        }

        return redirect()->back()->with('success', 'Image deleted successfully');
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
                        'profile_picture' => $document->user->profile_picture,
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
        // Check if user owns the document or has permission based on role/office
        $currentUser = auth()->user();
        $documentAuthor = $document->user;
        
        $canEdit = false;
        
        // Document owner can always edit
        if ($document->user_id === $currentUser->id) {
            $canEdit = true;
        }
        // Admin and superadmin can edit any document
        elseif (in_array($currentUser->role, ['admin', 'superadmin'])) {
            $canEdit = true;
        }
        // ICS can edit any document
        elseif ($currentUser->role === 'ICS') {
            $canEdit = true;
        }
        // Office-based permissions: CPMD can edit CPMD documents, NPQSD can edit NPQSD documents, etc.
        elseif ($currentUser->role === $documentAuthor->office) {
            $canEdit = true;
        }
        
        if (!$canEdit) {
            abort(403, 'Unauthorized action.');
        }

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

        if ($document->wasChanged('status') && $document->status === 'for review') {
            SendWritingEmailJob::dispatch($document);
        }

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
