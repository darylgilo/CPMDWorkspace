<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barangay extends Model
{
    protected $guarded = [];
    public $incrementing = false;

    public function municipality()
    {
        return $this->belongsTo(Municipality::class);
    }
}
