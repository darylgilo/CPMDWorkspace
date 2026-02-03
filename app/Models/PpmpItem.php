<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpmpItem extends Model
{
    protected $fillable = [
        'fund_id',
        'general_description',
        'project_type',
        'quantity_size',
        'mode_of_procurement',
        'pre_procurement_conference',
        'start_procurement',
        'end_procurement',
        'delivery_period',
        'estimated_budget',
        'supporting_documents',
        'remarks',
        'user_id',
    ];

    protected $casts = [
        'estimated_budget' => 'decimal:2',
        'pre_procurement_conference' => 'string',
    ];

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
