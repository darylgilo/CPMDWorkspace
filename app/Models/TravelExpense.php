<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TravelExpense extends Model
{
    protected $fillable = [
        'doctrack_no',
        'name',
        'date_of_travel',
        'destination',
        'purpose',
        'amount',
        'fund_id',
        'status',
        'remarks',
        'user_id',
    ];

    protected $casts = [
        'date_of_travel' => 'date',
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    protected static function booted()
    {
        static::creating(function ($expense) {
            if (empty($expense->doctrack_no)) {
                $expense->doctrack_no = 'TE-' . now()->format('Ymd') . '-' . strtoupper(\Str::random(6));
            }
        });
    }
}
