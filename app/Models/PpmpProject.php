<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpmpProject extends Model
{
    protected $fillable = [
        'fund_id',
        'general_description',
        'project_type',
        'user_id',
    ];

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fundingDetails(): HasMany
    {
        return $this->hasMany(PpmpFundingDetail::class);
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(PpmpTimeline::class);
    }
}
