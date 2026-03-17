<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentImage extends Model
{
    protected $fillable = [
        'document_id',
        'image_path',
        'image_name',
        'file_size',
        'mime_type',
        'sort_order',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the document that owns the image.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Get the full URL for the image.
     */
    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->image_path);
    }

    /**
     * Get the thumbnail URL for the image.
     */
    public function getThumbnailUrlAttribute(): string
    {
        // For now, return the same URL. Later you can implement thumbnail generation
        return $this->url;
    }
}
