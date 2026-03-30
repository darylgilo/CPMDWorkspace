<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Mail\WelcomeEmail;
use Illuminate\Support\Facades\Mail;

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
        $currentUser = auth()->user();
        $currentUserRole = $currentUser->role;

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

        // Office and Section filters - HR can see all, others are filtered by their office
        if ($currentUserRole !== 'HR') {
            if ($office !== '') {
                $query->where('office', $office);
            }
        } else {
            // HR users can filter by office if they choose, but see all by default
            if ($office !== '') {
                $query->where('office', $office);
            }
        }
        
        // Section filter (using section_id)
        if ($cpmd !== '') {
            // Find section by name and get its ID
            $section = Section::where('name', $cpmd)->first();
            if ($section) {
                $query->where('section_id', $section->id);
            }
        }

        // Add latest whereabouts update date and status
        $query->addSelect(['whereabouts_updated_at' => function ($q) {
            $q->select('updated_at')
              ->from('whereabouts')
              ->whereColumn('whereabouts.user_id', 'users.id')
              ->whereDate('whereabouts.date', '=', date('Y-m-d'))
              ->orderByDesc('whereabouts.updated_at')
              ->limit(1);
        }]);

        $query->addSelect(['whereabouts_status' => function ($q) {
            $q->select('status')
              ->from('whereabouts')
              ->whereColumn('whereabouts.user_id', 'users.id')
              ->whereDate('whereabouts.date', '=', date('Y-m-d'))
              ->orderByDesc('whereabouts.updated_at')
              ->limit(1);
        }]);

        // Calculate statistics - HR sees all offices, others see CPMD only
        if ($currentUserRole === 'HR') {
            $stats = [
                'total' => (clone $query)->count(),
                'regular' => (clone $query)->where('employment_status', 'Regular')->count(),
                'cos' => (clone $query)->where('employment_status', 'COS')->count(),
                'jobOrder' => (clone $query)->where('employment_status', 'Job Order')->count(),
            ];
        } else {
            $stats = [
                'total' => (clone $query)->where('office', 'CPMD')->count(),
                'regular' => (clone $query)->where('office', 'CPMD')->where('employment_status', 'Regular')->count(),
                'cos' => (clone $query)->where('office', 'CPMD')->where('employment_status', 'COS')->count(),
                'jobOrder' => (clone $query)->where('office', 'CPMD')->where('employment_status', 'Job Order')->count(),
            ];
        }

        $users = $query->orderBy('name')->paginate($perPage)->withQueryString();

        // Get sections for the frontend
        $sections = Section::active()->ordered()->get();
        
        // Create sections by office mapping for frontend
        $sectionsByOffice = [];
        foreach ($sections as $section) {
            $sectionsByOffice[$section->office][] = $section->name;
        }

        return Inertia::render('Employee/EmployeeManagement', [
            'users' => $users,
            'search' => $search,
            'perPage' => $perPage,
            'office' => $office,
            'cpmd' => $cpmd,
            'stats' => $stats,
            'sections' => $sections,
            'SECTIONS_BY_OFFICE' => $sectionsByOffice,
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create()
    {
        // Get sections for the frontend
        $sections = Section::active()->ordered()->get();
        
        // Create sections by office mapping for frontend
        $sectionsByOffice = [];
        foreach ($sections as $section) {
            $sectionsByOffice[$section->office][] = $section->name;
        }

        return Inertia::render('Employee/AddEmployee', [
            'sections' => $sections,
            'SECTIONS_BY_OFFICE' => $sectionsByOffice,
        ]);
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
            'office' => ['sometimes','required', Rule::in(['DO','ADO RDPSS','ADO RS','PMO','BIOTECH','NSIC','ADMINISTRATIVE','CPMD','CRPSD','AED','PPSSD','NPQSD','NSQCS','Baguio BPI center','Davao BPI center','Guimaras BPI center','La Granja BPI center','Los Baños BPI center','Others'])],
            'section_id' => 'nullable|exists:sections,id',
            'tin_number' => 'nullable|string|max:255',
            'landbank_number' => 'nullable|string|max:255',
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

        // Conditional validation: section_id required when office is CPMD
        if (($validated['office'] ?? null) === 'CPMD' && empty($validated['section_id'])) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                response()->json(['section_id' => 'The section field is required when office is CPMD.'], 422)
            );
        }

        // Defaults
        $validated['employment_status'] = $validated['employment_status'] ?? 'Regular';
        $validated['office'] = $validated['office'] ?? 'Others';
        $validated['gender'] = $validated['gender'] ?? 'Male';

        // Force new employees to be inactive regardless of client input
        $validated['status'] = 'inactive';

        // Fix role to user
        $validated['role'] = 'user';

        // Hash password
        $plainPassword = $validated['password']; // Store plain password for email
        $validated['password'] = Hash::make($validated['password']);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            $profilePicture = $request->file('profile_picture');
            $filename = time() . '_new_employee.' . $profilePicture->getClientOriginalExtension();
            $path = $profilePicture->storeAs('profile-pictures', $filename, 'public');
            $validated['profile_picture'] = $path;
        }

        $user = User::create($validated);
        
        // Send welcome email with credentials
        try {
            Mail::to($user->email)->send(new WelcomeEmail($user, $plainPassword));
            
            // Trigger email verification
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            \Log::error('Failed to send welcome email: ' . $e->getMessage());
            // Continue with employee creation even if email fails
        }

        return redirect()->route('employees.index')->with('success', 'Employee created successfully. Welcome and verification emails sent.');
    }

    /**
     * Display an employee profile.
     */
    public function show(int $id)
    {
        $user = User::findOrFail($id);

        // Get sections for the frontend
        $sections = Section::active()->ordered()->get();
        
        // Create sections by office mapping for frontend
        $sectionsByOffice = [];
        foreach ($sections as $section) {
            $sectionsByOffice[$section->office][] = $section->name;
        }

        return Inertia::render('Employee/EmployeeView', [
            'user' => $user,
            'sections' => $sections,
            'SECTIONS_BY_OFFICE' => $sectionsByOffice,
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
            'office' => ['sometimes','required', Rule::in(['DO','ADO RDPSS','ADO RS','PMO','BIOTECH','NSIC','ADMINISTRATIVE','CPMD','CRPSD','AED','PPSSD','NPQSD','NSQCS','Baguio BPI center','Davao BPI center','Guimaras BPI center','La Granja BPI center','Los Baños BPI center','Others'])],
            'section_id' => 'nullable|exists:sections,id',
            'tin_number' => 'nullable|string|max:255',
            'landbank_number' => 'nullable|string|max:255',
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

        if (($validated['office'] ?? $user->office) === 'CPMD' && empty($validated['section_id'])) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                response()->json(['section_id' => 'The section field is required when office is CPMD.'], 422)
            );
        }

        // Preserve role and password
        unset($validated['role'], $validated['password']);

        // Apply defaults when not provided
        $validated['employment_status'] = $validated['employment_status'] ?? $user->employment_status ?? 'Regular';
        $validated['office'] = $validated['office'] ?? $user->office ?? 'Others';
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

