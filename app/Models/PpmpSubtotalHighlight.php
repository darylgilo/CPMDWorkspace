<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpmpSubtotalHighlight extends Model
{
    use HasFactory;

    protected $fillable = [
        'ppmp_project_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    // Constants for status values
    const STATUS_FINAL = 'FINAL';
    const STATUS_INDICATIVE = 'INDICATIVE';

    /**
     * Get the PPMP project that owns this highlight.
     */
    public function ppmpProject()
    {
        return $this->belongsTo(PpmpProject::class);
    }

    /**
     * Get the user who created this highlight.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include FINAL highlights.
     */
    public function scopeFinal($query)
    {
        return $query->where('status', self::STATUS_FINAL);
    }

    /**
     * Scope a query to only include INDICATIVE highlights.
     */
    public function scopeIndicative($query)
    {
        return $query->where('status', self::STATUS_INDICATIVE);
    }
}
