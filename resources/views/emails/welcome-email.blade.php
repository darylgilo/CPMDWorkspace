@component('mail::message')
# Welcome to CPMD Workspace

Dear **{{ $user->name }}**,

Welcome to CPMD Workspace! Your account has been successfully created.

## Your Account Details

**Username:** {{ $user->email }}  
**Password:** {{ $plainPassword }}  
**Role:** {{ ucfirst($user->role) }}  
**Status:** {{ ucfirst($user->status) }}

## ⚠️ Important Security Notice

For your security, **please change your default password** as soon as possible after your first login.

### How to Change Your Password:
1. Log in to the system with your current credentials
2. Go to your profile settings
3. Select "Change Password"
4. Enter your current password and create a new, strong password

## Next Steps

### 📧 Email Verification Required

**Important:** You must verify your email address before you can log in to the system.

1. Check your inbox for a separate verification email
2. Click the verification link in that email
3. Once verified, you can proceed with login

@if($user->status === 'inactive')
**Note:** Your account is currently inactive. After verifying your email, you will need to wait for an administrator to activate your account. You will receive another email notification when your account is activated.
@else
After verifying your email, your account will be **active** and you can log in immediately using the credentials above.
@endif

## System Access

You have been granted access to the CPMDWorkspace with the following permissions:
@if($user->can_access_noticeboard)
- ✅ Notice Board Access
@endif
@if($user->can_access_writing_suite)
- ✅ Writing Suite Access
@endif
@if($user->can_access_management)
- ✅ Management Access
@endif
@if($user->can_access_inventory)
- ✅ Inventory Access
@endif

## Need Help?

If you encounter any issues or have questions, please contact the system administrator.

Thank you for joining our team!

---

**CPMD Workspace**  
CROP PEST MANAGEMENT DIVISION  
*This is an automated message. Please do not reply to this email.*
@endcomponent
