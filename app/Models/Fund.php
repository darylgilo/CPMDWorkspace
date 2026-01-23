<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fund extends Model
{
    use HasFactory;

    protected $fillable = [
        'fund_name',
        'total_amount',
        'source_year',
        'user_id',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'source_year' => 'integer',
    ];

    /**
     * Get transactions for the fund.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(FundTransaction::class);
    }

    /**
     * Get the user who owns the fund.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update the allocated amount for the fund.
     */
    public function updateAllocatedAmount($amount)
    {
        $this->total_amount += $amount;
        $this->save();
    }
}
