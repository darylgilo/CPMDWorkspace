<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Required basic information
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            // Employment information (all optional)
            'position' => ['nullable', 'string', 'max:255'],
            'employment_status' => ['nullable', 'string'],
            'office' => ['nullable', 'string'],
            'employee_id' => ['nullable', 'string', 'max:255', Rule::unique(User::class)->ignore($this->user()->id)],
            'item_number' => ['nullable', 'string', 'max:255'],
            'hiring_date' => ['nullable', 'date'],
            
            // Government identification numbers
            'tin_number' => ['nullable', 'string', 'max:255'],
            'gsis_number' => ['nullable', 'string', 'max:255'],
            
            // Personal information
            'address' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string'],
            
            // Contact information
            'mobile_number' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            
            // Department/CPMD information
            'cpmd' => ['nullable', 'string'],
            
            // Profile picture upload with restrictions
            'profile_picture' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:10240'], // 10MB max
        ];
    }
    /**
     * Get custom messages for validator errors.
     * 
     * Provides user-friendly error messages for validation failures.
     * These messages are displayed to users when validation fails.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Basic information validation messages
            'name.required' => 'The name field is required.',
            'email.required' => 'The email field is required.',
            'email.email' => 'The email must be a valid email address.',
            'email.unique' => 'This email address is already taken.',
            
            // Profile picture validation messages
            'profile_picture.image' => 'The profile picture must be an image.',
            'profile_picture.mimes' => 'The profile picture must be a file of type: jpeg, png, jpg, gif.',
            'profile_picture.max' => 'The profile picture may not be greater than 10MB.',
        ];
    }
}
