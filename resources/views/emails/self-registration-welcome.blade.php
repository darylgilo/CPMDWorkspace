@component('mail::message')
# Welcome to CPMD Workspace

Dear **{{ $user->name }}**,

Welcome to CPMDWorkspace! Your account has been created successfully, Contact administrator if not activated.

## 📧 Email Verification Required

**Important:** You must verify your email address before you can access your account.

### Next Steps:

1. **Check your inbox** for a verification email from us
2. **Click the verification link** in that email
3. **Wait for admin approval** - Your account needs to be activated by an administrator


## Account Status

**Current Status:** Pending Verification  
**Role:** {{ ucfirst($user->role) }}  
**Email:** {{ $user->email }}

## What Happens Next?

1. ✅ **Email Verification** - Click the link in your verification email
2. ⏳ **Admin Review** - Our team will review and activate your account
3. 📧 **Activation Notice** - You'll receive an email when your account is ready
4. 🔐 **First Login** - Log in with the credentials you created during registration

## System Access

Once your account is activated, you will have access to the CPMDWorkspace system based on your assigned role and permissions.

## Need Help?

If you don't receive the verification email within a few minutes:
- Check your spam/junk folder
- Ensure you entered the correct email address
- Contact our support team if you need assistance

Thank you!

---

**CPMD Workspace**  
CROP PEST MANAGEMENT DIVISION
*This is an automated message. Please do not reply to this email.*
@endcomponent
