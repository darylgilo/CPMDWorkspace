<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeManagementController extends Controller
{
    /**
     * Display a listing of employees (users).
     */
    public function index(Request $request)
    {
        $search = (string) $request->input('search', '');
        $perPage = (int) $request->input('perPage', 12);
        if ($perPage <= 0) { $perPage = 12; }
        $office = (string) $request->input('office', '');
        $cpmd = (string) $request->input('cpmd', '');

        $query = User::query();

        // Optionally filter to only role 'user' as employees (default: include all roles)
        if ($request->boolean('onlyEmployees', false)) {
            $query->where('role', 'user');
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%");
            });
        }

        // Office and Section (CPMD) filters
        if ($office !== '') {
            $query->where('office', $office);
            if ($office === 'CPMD' && $cpmd !== '') {
                $query->where('cpmd', $cpmd);
            }
        }

        $query->orderBy('name');

        $users = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Employee/EmployeeManagement', [
            'users' => $users,
            'search' => $search,
            'perPage' => $perPage,
            'office' => $office,
            'cpmd' => $cpmd,
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create()
    {
        return Inertia::render('Employee/AddEmployee');
    }

    /**
     * Store a newly created employee (user role) in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            // role is fixed to 'user' server-side
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'employee_id' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'employment_status' => ['sometimes','required', Rule::in(['Regular', 'COS', 'Job Order', 'Others'])],
            'office' => ['sometimes','required', Rule::in(['CPMD','Others'])],
            'cpmd' => ['nullable', Rule::in(['Office of the Chief','OC-Admin Support Unit','OC-Special Project Unit','OC-ICT Unit','BIOCON Section','PFS Section','PHPS Section','Others'])],
            'tin_number' => 'nullable|string|max:255',
            'gsis_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'hiring_date' => 'nullable|date',
            'item_number' => 'nullable|string|max:255', 
            'gender' => ['sometimes','required', Rule::in(['Male', 'Female'])],
            'mobile_number' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Conditional validation: cpmd required when office is CPMD
        if (($validated['office'] ?? null) === 'CPMD' && empty($validated['cpmd'])) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                response()->json(['cpmd' => 'The CPMD section/unit field is required when office is CPMD.'], 422)
            );
        }

        // Defaults
        $validated['employment_status'] = $validated['employment_status'] ?? 'Regular';
        $validated['office'] = $validated['office'] ?? 'Others';
        $validated['cpmd'] = $validated['cpmd'] ?? 'Others';
        $validated['gender'] = $validated['gender'] ?? 'Male';

        // Force new employees to be inactive regardless of client input
        $validated['status'] = 'inactive';

        // Fix role to user
        $validated['role'] = 'user';

        // Hash password
        $validated['password'] = Hash::make($validated['password']);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            $profilePicture = $request->file('profile_picture');
            $filename = time() . '_new_employee.' . $profilePicture->getClientOriginalExtension();
            $path = $profilePicture->storeAs('profile-pictures', $filename, 'public');
            $validated['profile_picture'] = $path;
        }

        User::create($validated);

        return redirect()->route('employees.index')->with('success', 'Employee created successfully.');
    }

    /**
     * Display an employee profile.
     */
    public function show(int $id)
    {
        $user = User::findOrFail($id);

        return Inertia::render('Employee/EmployeeView', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        // Prevent updates to superadmin by anyone who is not a superadmin (case-insensitive)
        $actorRole = strtolower((string) optional(auth()->user())->role);
        $targetRole = strtolower((string) $user->role);
        if ($actorRole !== 'superadmin' && $targetRole === 'superadmin') {
            abort(403, 'You are not authorized to update a superadmin account.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required','string','email','max:255', Rule::unique('users')->ignore($user->id)],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'employee_id' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'employment_status' => ['sometimes','required', Rule::in(['Regular', 'COS', 'Job Order', 'Others'])],
            'office' => ['sometimes','required', Rule::in(['CPMD','Others'])],
            'cpmd' => ['nullable', Rule::in(['Office of the Chief','OC-Admin Support Unit','OC-Special Project Unit','OC-ICT Unit','BIOCON Section','PFS Section','PHPS Section','Others'])],
            'tin_number' => 'nullable|string|max:255',
            'gsis_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'hiring_date' => 'nullable|date',
            'item_number' => 'nullable|string|max:255',
            'gender' => ['sometimes','required', Rule::in(['Male', 'Female'])],
            'mobile_number' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'remove_profile_picture' => 'nullable|string',
        ]);

        if (($validated['office'] ?? $user->office) === 'CPMD' && empty($validated['cpmd'])) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                response()->json(['cpmd' => 'The CPMD section/unit field is required when office is CPMD.'], 422)
            );
        }

        // Preserve role and password
        unset($validated['role'], $validated['password']);

        // Apply defaults when not provided
        $validated['employment_status'] = $validated['employment_status'] ?? $user->employment_status ?? 'Regular';
        $validated['office'] = $validated['office'] ?? $user->office ?? 'Others';
        if (($validated['office'] ?? $user->office) !== 'CPMD') {
            // If office not CPMD, set cpmd to a safe non-null default
            $validated['cpmd'] = $validated['cpmd'] ?? 'Others';
        } else {
            $validated['cpmd'] = $validated['cpmd'] ?? $user->cpmd ?? 'Others';
        }
        $validated['gender'] = $validated['gender'] ?? $user->gender ?? 'Male';

        // Handle profile picture removal
        if ($request->has('remove_profile_picture') && $request->remove_profile_picture == '1') {
            // Delete existing profile picture if exists
            if ($user->profile_picture) {
                $oldPath = storage_path('app/public/' . $user->profile_picture);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
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
        }

        $user->update($validated);

        return redirect()->route('employees.show', ['id' => $user->id])->with('success', 'Employee updated successfully.');
    }
}

