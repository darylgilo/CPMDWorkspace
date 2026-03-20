<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Form extends Model
{
    protected $fillable = [
        'title',
        'description',
        'status',
        'fields',
        'user_id',
        'icon',
    ];

    protected $casts = [
        'fields' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function submissions()
    {
        return $this->hasMany(FormSubmission::class);
    }

    public function getSubmissionsCountAttribute()
    {
        return $this->submissions()->count();
    }

    protected $appends = ['submissions_count'];
}
