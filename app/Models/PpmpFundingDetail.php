<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpmpFundingDetail extends Model
{
    protected $fillable = [
        'ppmp_project_id',
        'quantity_size',
        'mode_of_procurement',
        'pre_procurement_conference',
        'estimated_budget',
        'supporting_documents',
        'remarks',
    ];

    protected $casts = [
        'estimated_budget' => 'decimal:2',
        'pre_procurement_conference' => 'string',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(PpmpProject::class, 'ppmp_project_id');
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(PpmpTimeline::class);
    }
}
