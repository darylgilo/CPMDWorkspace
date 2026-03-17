<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'content',
        'category',
        'status',
        'likes_count',
        'approvals_count',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * Convert created_at to application timezone
     */
    public function getCreatedAtAttribute($value)
    {
        return $this->asDateTime($value)->setTimezone(config('app.timezone'));
    }

    /**
     * Convert updated_at to application timezone
     */
    public function getUpdatedAtAttribute($value)
    {
        return $this->asDateTime($value)->setTimezone(config('app.timezone'));
    }

    /**
     * Convert approved_at to application timezone
     */
    public function getApprovedAtAttribute($value)
    {
        return $this->asDateTime($value)->setTimezone(config('app.timezone'));
    }

    /**
     * Get the user who created the document.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the history of changes for this document.
     */
    public function histories(): HasMany
    {
        return $this->hasMany(DocumentHistory::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get the comments for this document.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get the approvals for this document.
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(DocumentApproval::class);
    }

    /**
     * Get the likes for this document.
     */
    public function likes(): HasMany
    {
        return $this->hasMany(DocumentLike::class);
    }

    /**
     * Get the bookmarks for this document.
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(DocumentBookmark::class);
    }

    /**
     * Get the images for this document.
     */
    public function images(): HasMany
    {
        return $this->hasMany(DocumentImage::class)->orderBy('sort_order');
    }

    /**
     * Get the user who approved this document.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Approve the document (toggle user approval).
     */
    public function approve($userId)
    {
        $existingApproval = $this->approvals()->where('user_id', $userId)->first();
        
        if ($existingApproval) {
            // Remove approval if it exists
            $existingApproval->delete();
            $this->decrement('approvals_count');
            return false; // Indicates approval was removed
        } else {
            // Add approval if it doesn't exist
            $this->approvals()->create(['user_id' => $userId]);
            $this->increment('approvals_count');
            
            // Create history record
            $this->histories()->create([
                'user_id' => $userId,
                'title' => $this->title,
                'content' => $this->content,
                'category' => $this->category,
                'status' => $this->status,
                'action' => 'approved',
            ]);
            
            return true; // Indicates approval was added
        }
    }

    /**
     * Like the document (toggle user like).
     */
    public function like($userId)
    {
        $existingLike = $this->likes()->where('user_id', $userId)->first();
        
        if ($existingLike) {
            // Remove like if it exists
            $existingLike->delete();
            $this->decrement('likes_count');
            return false; // Indicates like was removed
        } else {
            // Add like if it doesn't exist
            $this->likes()->create(['user_id' => $userId]);
            $this->increment('likes_count');
            return true; // Indicates like was added
        }
    }

    /**
     * Check if user has approved this document.
     */
    public function isApprovedBy($userId): bool
    {
        return $this->approvals()->where('user_id', $userId)->exists();
    }

    /**
     * Check if user has liked this document.
     */
    public function isLikedBy($userId): bool
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }

    /**
     * Check if user has bookmarked this document.
     */
    public function isBookmarkedBy($userId): bool
    {
        return $this->bookmarks()->where('user_id', $userId)->exists();
    }

    /**
     * Bookmark the document (toggle user bookmark).
     */
    public function bookmark($userId)
    {
        $existingBookmark = $this->bookmarks()->where('user_id', $userId)->first();
        
        if ($existingBookmark) {
            // Remove bookmark if it exists
            $existingBookmark->delete();
            return false; // Indicates bookmark was removed
        } else {
            // Add bookmark if it doesn't exist
            $this->bookmarks()->create(['user_id' => $userId]);
            return true; // Indicates bookmark was added
        }
    }

    /**
     * Create a history record when the document is created.
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function ($document) {
            $document->histories()->create([
                'user_id' => $document->user_id,
                'title' => $document->title,
                'content' => $document->content,
                'category' => $document->category,
                'status' => $document->status,
                'action' => 'created',
            ]);
        });

        static::updated(function ($document) {
            $document->histories()->create([
                'user_id' => auth()->id(),
                'title' => $document->title,
                'content' => $document->content,
                'category' => $document->category,
                'status' => $document->status,
                'action' => 'updated',
            ]);
        });
    }
}
