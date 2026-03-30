<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeDirectoryController extends Controller
{
    public function index(Request $request)
    {
        $search = (string) $request->input('search', '');
        $perPage = (int) $request->input('perPage', 12);
        if ($perPage <= 0) { $perPage = 12; }
        $office = (string) $request->input('office', '');
        $cpmd = (string) $request->input('cpmd', '');

        $query = User::query();

        // Optionally filter to employees only (role = user). Default: include all roles.
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

        if ($office !== '') {
            $query->where('office', $office);
            if ($office === 'CPMD' && $cpmd !== '') {
                $query->where('cpmd', $cpmd);
            }
        }

        $query->orderBy('name');

        $users = $query->paginate($perPage)->withQueryString();

        // Get all sections for frontend filtering
        $sections = Section::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Employee/EmployeeDirectory', [
            'users' => $users,
            'search' => $search,
            'perPage' => $perPage,
            'office' => $office,
            'cpmd' => $cpmd,
            'sections' => $sections,
        ]);
    }

    public function show(int $id)
    {
        $user = User::findOrFail($id);

        // Get all sections for frontend filtering
        $sections = Section::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Employee/EmployeeDirectoryView', [
            'user' => $user,
            'sections' => $sections,
        ]);
    }
}
