<?php

namespace App\Http\Controllers\Usercontrol;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;

class UserRoleController extends Controller
{
    public function admin(): Response
    {
    return Inertia::render('Admin/Employeemanagement');
    }

    public function superadmin(): Response
    {
    return Inertia::render('SuperAdmin/Usermanagement');
    }

    public function biocon(): Response
    {
    return Inertia::render('BIOCON/Testpage');
    }

    public function psf(): Response
    {
    
    }
    
    public function phps(): Response
    {
    
    }

}