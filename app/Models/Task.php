<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'office',
        'section_id',
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

    public function updates(): HasMany
    {
        return $this->hasMany(TaskUpdate::class)->orderBy('update_date', 'desc');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }
}
