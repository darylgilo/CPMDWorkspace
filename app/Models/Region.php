<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $guarded = [];
    public $incrementing = false;

    public function provinces()
    {
        return $this->hasMany(Province::class);
    }
}
