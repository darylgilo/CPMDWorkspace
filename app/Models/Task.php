<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'end_date',
        'status',
        'priority',
        'progress',
        'created_by',
        'assignees',
    ];

    protected $casts = [
        'end_date' => 'date',
        'assignees' => 'array',
        'progress' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
