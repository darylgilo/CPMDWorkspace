<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Distribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'pesticide_id',
        'quantity',
        'travel_purpose',
        'travel_location',
        'received_by',
        'received_date',
        'user_id',
    ];

    protected $casts = [
        'received_date' => 'date',
        'quantity' => 'decimal:2',
    ];

    /**
     * Get the pesticide that this distribution belongs to.
     */
    public function pesticide(): BelongsTo
    {
        return $this->belongsTo(Pesticide::class);
    }

    /**
     * Get the user that created this distribution record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
