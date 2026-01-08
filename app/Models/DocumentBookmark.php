<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentBookmark extends Model
{
    protected $fillable = [
        'user_id',
        'document_id',
    ];

    /**
     * Get the user that bookmarked the document.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the document that was bookmarked.
     */
    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}
