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
        'region_id',
        'province_id',
        'municipality_id',
        'barangay_id',
        'received_by',
        'received_date',
        'user_id',
    ];

    public function region() { return $this->belongsTo(Region::class); }
    public function province() { return $this->belongsTo(Province::class); }
    public function municipality() { return $this->belongsTo(Municipality::class); }
    public function barangay() { return $this->belongsTo(Barangay::class); }


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
