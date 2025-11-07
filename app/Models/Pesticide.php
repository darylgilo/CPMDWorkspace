<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pesticide extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand_name',
        'active_ingredient',
        'mode_of_action',
        'type_of_pesticide',
        'unit',
        'received_date',
        'production_date',
        'expiry_date',
        'source_of_fund',
        'quantity',
        'stock',
        'user_id',
    ];

    protected $casts = [
        'received_date' => 'date',
        'production_date' => 'date',
        'expiry_date' => 'date',
        'quantity' => 'decimal:2',
        'stock' => 'decimal:2',
    ];

    /**
     * Get the user that created this pesticide record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the distributions for this pesticide.
     */
    public function distributions(): HasMany
    {
        return $this->hasMany(Distribution::class);
    }
}
