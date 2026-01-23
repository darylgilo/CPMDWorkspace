<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'fund_id',
        'doctrack_no',
        'pr_no',
        'specific_items',
        'category',
        'amount_pr',
        'resolution_no',
        'supplier',
        'po_no',
        'amount_po',
        'balance',
        'delivery_date',
        'dv_no',
        'amount_dv',
        'payment_date',
        'remarks',
        'user_id',
    ];

    protected $casts = [
        'amount_pr' => 'decimal:2',
        'amount_po' => 'decimal:2',
        'amount_dv' => 'decimal:2',
        'balance' => 'decimal:2',
        'delivery_date' => 'date',
        'payment_date' => 'date',
    ];

    /**
     * Get the fund that owns the transaction.
     */
    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    /**
     * Get the user who created the transaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get transactions by fund.
     */
    public function scopeByFund($query, $fundId)
    {
        return $query->where('fund_id', $fundId);
    }

    /**
     * Scope to get transactions by status.
     */
    public function scopeByStatus($query, $status)
    {
        if ($status === 'delivered') {
            return $query->whereNotNull('delivery_date');
        } elseif ($status === 'paid') {
            return $query->whereNotNull('payment_date');
        }
        
        return $query;
    }

    /**
     * Get transaction status based on dates.
     */
    public function getStatusAttribute()
    {
        if ($this->payment_date) {
            return 'Paid';
        } elseif ($this->delivery_date) {
            return 'Delivered';
        } elseif ($this->po_no) {
            return 'Ordered';
        }
        
        return 'Pending';
    }

    /**
     * Check if transaction is fully paid.
     */
    public function isFullyPaid()
    {
        return $this->amount_dv && $this->amount_dv >= $this->amount_po;
    }

    /**
     * Get remaining amount to be paid.
     */
    public function getRemainingAmountAttribute()
    {
        if (!$this->amount_dv) {
            return $this->amount_po;
        }
        
        return max(0, $this->amount_po - $this->amount_dv);
    }
}
