<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role',      // User's role: user, admin, or superadmin
        'status', // User's account status: active or inactive
        'last_login_at', // Timestamp of the last login
        'employee_id', // Unique employee identifier
        'name',
        'email',
        'password',
        'position',
        'employment_status',
        'office',
        'tin_number',
        'gsis_number',
        'address',
        'landbank_number',
        'date_of_birth',
        'gender',
        'mobile_number',
        'contact_number',
        'contact_person',
        'cpmd',
        'hiring_date',
        'item_number',
        'profile_picture', // Profile picture file path
        'display_order', // Custom order for whereabouts display
        'can_access_noticeboard', // Page access control
        'can_access_writing_suite', // Page access control
        'can_access_management', // Page access control
        'can_access_inventory', // Page access control
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['profile_picture_url'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }
    /**
     * Get the whereabouts for the user.
     */
    public function whereabouts()
    {
        return $this->hasMany(Whereabout::class);
    }

    /**
     * Get the profile picture URL.
     */
    public function getProfilePictureUrlAttribute(): ?string
    {
        if (!$this->profile_picture) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($this->profile_picture, FILTER_VALIDATE_URL)) {
            return $this->profile_picture;
        }

        // If it's a relative path, convert to full URL
        return asset('storage/' . $this->profile_picture);
    }
}
