<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormResponse extends Model
{
    protected $fillable = [
        'form_submission_id',
        'field_id',
        'field_type',
        'field_label',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public function submission()
    {
        return $this->belongsTo(FormSubmission::class, 'form_submission_id');
    }
}
