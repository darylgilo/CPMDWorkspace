<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentHistory extends Model
{
    protected $fillable = [
        'document_id',
        'user_id',
        'title',
        'content',
        'category',
        'status',
        'action',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the document that this history belongs to.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Get the user who made this change.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
