<?php

namespace App\Http\Controllers\Usercontrol;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{


    public function superadmin(): Response
    {
        return $this->index(request());
    }

    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status', 'active');
        // Entries per page with sane bounds
        $perPage = (int) $request->query('perPage', 10);
        if ($perPage < 1) { $perPage = 1; }
        if ($perPage > 100) { $perPage = 100; }
        
        // Get sorting parameters
        $sortField = $request->query('sort', 'name');
        $sortDirection = $request->query('direction', 'asc');
        
        // Debug: Log the sorting parameters
        \Log::info('Sorting parameters received:', [
            'sort' => $sortField,
            'direction' => $sortDirection,
            'all_query_params' => $request->all()
        ]);
        
        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['name', 'email', 'role', 'created_at', 'last_login_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'name';
        }
        
        // Validate sort direction
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        $query = User::query();

        
        // Dashboard analytics: quick counts derived from the same base query.
        // We clone the builder each time so the where clauses below do not
        // accumulate and affect one another or the main listing query.
        $totalUsers = (clone $query)->count();
        $activeUsers = (clone $query)->where('status', 'active')->count();
        $newUsersThisMonth = (clone $query)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();
        // Online users: last_login_at within last 15 minutes
        $onlineUsers = (clone $query)
            ->whereNotNull('last_login_at')
            ->where('last_login_at', '>', now()->subMinutes(15))
            ->count();
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%") ;
            });
        }
        if (in_array($status, ['active', 'inactive'], true)) {
            $query->where('status', $status);
        }
        
        // Debug: Log the query before sorting
        \Log::info('Query before sorting:', [
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);
        
        // Apply sorting
        $users = $query->orderBy($sortField, $sortDirection)->paginate($perPage)->withQueryString();
        
        // Debug: Log the final result
        \Log::info('Final result:', [
            'total_users' => $users->total(),
            'current_page' => $users->currentPage(),
            'sort_applied' => $sortField . ' ' . $sortDirection
        ]);
        
        return Inertia::render('SuperAdmin/Usermanagement', [
            'users' => $users,
            'search' => $search,
            'perPage' => $perPage,
            'status' => $status,
            'sort' => $sortField,
            'direction' => $sortDirection,
            'analytics' => [
                'totalUsers' => $totalUsers,
                'activeUsers' => $activeUsers,
                'newUsersThisMonth' => $newUsersThisMonth,
                'onlineUsers' => $onlineUsers,
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('SuperAdmin/Addusermanagement');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit($id): Response
    {
        $user = User::findOrFail($id);
        return Inertia::render('SuperAdmin/Editusermanagement', [
            'user' => $user,
        ]);
    }

    /**
     * Store a newly created user in storage.
     *
     * This method allows a superadmin to create a new user and set their initial status (active/inactive).
     * The status field enables the activate/deactivate feature, allowing control over whether the user can log in.
     *
     * @param Request $request The incoming HTTP request with user data
     * @return \Illuminate\Http\JsonResponse The created user as JSON
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['user', 'admin', 'superadmin'])],
            'status' => ['required', Rule::in(['active', 'inactive'])], // Admin can set initial status
            'employee_id' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'employment_status' => ['sometimes','required', Rule::in(['Regular', 'COS', 'Job Order', 'Others'])],
            'office' => ['sometimes','required', Rule::in(['DO', 'ADO', 'CPMD', 'AED', 'NSQCS', 'NPQSD', 'NSIC', 'CRPSD', 'PPSSD', 'ADMINISTRATIVE', 'Others'])],
            'cpmd' => ['nullable', Rule::in(['BIOCON section', 'PFS section', 'PHPS SECTION', 'OC-Admin Support Unit', 'OC-ICT Unit', 'OC-Special Project', 'Others'])],
            'tin_number' => 'nullable|string|max:255',
            'gsis_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => ['sometimes','required', Rule::in(['Male', 'Female'])],
            'mobile_number' => 'nullable|string|max:255',
            'hiring_date' => 'nullable|date',
            'item_number' => 'nullable|string|max:255', 
            'contact_number' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        
        // Custom validation: cpmd is required only when office is CPMD
        if ($validated['office'] === 'CPMD' && empty($validated['cpmd'])) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                response()->json(['cpmd' => 'The CPMD section/unit field is required when office is CPMD.'], 422)
            );
        }
        
        // Set default values for required fields if not provided
        $validated['employment_status'] = $validated['employment_status'] ?? 'Regular';
        $validated['office'] = $validated['office'] ?? 'Others';
        $validated['cpmd'] = $validated['cpmd'] ?? 'Others';
        $validated['gender'] = $validated['gender'] ?? 'Male';
        
        // Hash the password
        $validated['password'] = Hash::make($validated['password']);
        
        // Handle profile picture upload if provided
        if ($request->hasFile('profile_picture')) {
            $profilePicture = $request->file('profile_picture');
            $filename = time() . '_new_user.' . $profilePicture->getClientOriginalExtension();
            $path = $profilePicture->storeAs('profile-pictures', $filename, 'public');
            $validated['profile_picture'] = $path;
        }
        
        $user = User::create($validated);
        return redirect()->route('usermanagement')->with('success', 'User created successfully.');
    }

    /**
     * Update the specified user in storage.
     *
     * This method allows a superadmin to update user details, including their status (activate/deactivate).
     * Changing the status to 'inactive' will prevent the user from logging in.
     * Changing the status to 'active' will allow the user to log in again.
     *
     * @param Request $request The incoming HTTP request with updated user data
     * @param int $id The user ID to update
     * @return \Illuminate\Http\RedirectResponse Redirects back to the previous page
     */
    public function update(Request $request, $id)
    {
        // Debug: Log the incoming request
        \Log::info('Update user request received:', [
            'user_id' => $id,
            'request_data' => $request->all(),
            'files' => $request->allFiles()
        ]);
        
        $user = User::findOrFail($id);
        
        // If password is being changed, verify superadmin password
        if ($request->has('password') && !empty($request->password)) {
            if (!$request->has('superadmin_password') || empty($request->superadmin_password)) {
                \Log::warning('Password change attempted without superadmin password');
                return back()->withErrors(['superadmin_password' => 'Superadmin password is required to change user password.']);
            }
            
            // Verify superadmin password
            if (!Hash::check($request->superadmin_password, auth()->user()->password)) {
                \Log::warning('Invalid superadmin password provided for password change');
                return back()->withErrors(['superadmin_password' => 'Invalid superadmin password.']);
            }
        }
        
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => ['required','string','email','max:255',Rule::unique('users')->ignore($user->id)],
                'password' => 'nullable|string|min:8',
                'role' => ['required', Rule::in(['user', 'admin', 'superadmin'])],
                'status' => ['required', Rule::in(['active', 'inactive'])], // Admin can activate/deactivate user
                'employee_id' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
                'employment_status' => ['required', Rule::in(['Regular', 'COS', 'Job Order', 'Others'])],
                'office' => ['required', Rule::in(['DO', 'ADO', 'CPMD', 'AED', 'NSQCS', 'NPQSD', 'NSIC', 'CRPSD', 'PPSSD', 'ADMINISTRATIVE', 'Others'])],
                'cpmd' => ['nullable', Rule::in(['BIOCON section', 'PFS section', 'PHPS SECTION', 'OC-Admin Support Unit', 'OC-ICT Unit', 'OC-Special Project', 'Others'])],
                'tin_number' => 'nullable|string|max:255',
                'gsis_number' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:500',
                'date_of_birth' => 'nullable|date',
                'hiring_date' => 'nullable|date',
                'item_number' => 'nullable|string|max:255',
                'gender' => ['required', Rule::in(['Male', 'Female'])],
                'mobile_number' => 'nullable|string|max:255',
                'contact_number' => 'nullable|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'remove_profile_picture' => 'nullable|string',
            ]);
            
            // Custom validation: cpmd is required only when office is CPMD
            if ($validated['office'] === 'CPMD' && empty($validated['cpmd'])) {
                throw new \Illuminate\Validation\ValidationException(
                    validator([], []),
                    response()->json(['cpmd' => 'The CPMD section/unit field is required when office is CPMD.'], 422)
                );
            }
            
            // Debug: Log the validated data
            \Log::info('Validation passed, validated data:', $validated);
            
            // Handle password hashing
            if(isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }
            
            // Handle profile picture removal
            if ($request->has('remove_profile_picture') && $request->remove_profile_picture == '1') {
                // Delete existing profile picture if exists
                if ($user->profile_picture) {
                    $oldPath = storage_path('app/public/' . $user->profile_picture);
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                        \Log::info('Profile picture removed:', ['old_path' => $oldPath]);
                    }
                }
                $validated['profile_picture'] = null;
            }
            // Handle profile picture upload
            elseif ($request->hasFile('profile_picture')) {
                // Delete old profile picture if exists
                if ($user->profile_picture) {
                    $oldPath = storage_path('app/public/' . $user->profile_picture);
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }
                
                // Store new profile picture
                $profilePicture = $request->file('profile_picture');
                $filename = time() . '_' . $user->id . '.' . $profilePicture->getClientOriginalExtension();
                $path = $profilePicture->storeAs('profile-pictures', $filename, 'public');
                $validated['profile_picture'] = $path;
                
                \Log::info('Profile picture uploaded:', ['path' => $path]);
            }
            
            // Update user with new data, including status
            $user->update($validated);
            
            \Log::info('User updated successfully:', ['user_id' => $user->id]);
            
            // For Inertia, we need to redirect properly
            return redirect()->route('usermanagement')->with('success', 'User updated successfully.');
            
        } catch (\Exception $e) {
            \Log::error('Error updating user:', [
                'user_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['general' => 'An error occurred while updating the user: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return redirect()->route('usermanagement')->with('success', 'User deleted successfully.');
    }

    /**
     * Update user status (activate/deactivate)
     *
     * This method allows a superadmin to quickly change a user's status
     * without having to provide all the other user details.
     *
     * @param Request $request The incoming HTTP request with status data
     * @param int $id The user ID to update
     * @return \Illuminate\Http\RedirectResponse Redirects back to user management
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $user = User::findOrFail($id);
        $user->update(['status' => $request->status]);

        $statusText = $request->status === 'active' ? 'activated' : 'deactivated';
        $message = "User {$statusText} successfully.";
        
        // Debug logging
        \Log::info('Setting flash message:', [
            'message' => $message,
            'user_id' => $id,
            'new_status' => $request->status
        ]);
        
        return redirect()->route('usermanagement')->with('success', $message);
    }

}
