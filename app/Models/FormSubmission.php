<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormSubmission extends Model
{
    protected $fillable = [
        'form_id',
        'user_id',
        'submitter_name',
        'submitter_email',
        'status',
        'notes',
        'assigned_to',
        'assignees',
        'priority',
    ];

    public function form()
    {
        return $this->belongsTo(Form::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'form_submission_assignees', 'form_submission_id', 'user_id');
    }

    public function responses()
    {
        return $this->hasMany(FormResponse::class);
    }
}
