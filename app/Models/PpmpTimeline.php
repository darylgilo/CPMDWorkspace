<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpmpTimeline extends Model
{
    protected $fillable = [
        'ppmp_project_id',
        'ppmp_funding_detail_id',
        'start_procurement',
        'end_procurement',
        'delivery_period',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(PpmpProject::class, 'ppmp_project_id');
    }

    public function fundingDetail(): BelongsTo
    {
        return $this->belongsTo(PpmpFundingDetail::class, 'ppmp_funding_detail_id');
    }
}
