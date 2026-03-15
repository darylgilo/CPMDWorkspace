<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$allCpmdUsers = User::where('office', 'CPMD')->get();
echo "Total CPMD users: " . $allCpmdUsers->count() . "\n";
foreach ($allCpmdUsers as $u) {
    echo "- Name: {$u->name}, Status: {$u->status}, Verified: " . ($u->email_verified_at ? 'Yes' : 'No') . "\n";
}

$filteredUsers = User::where('office', 'CPMD')
    ->where('status', 'active')
    ->where('email_verified_at', '!=', null)
    ->get();
echo "\nFiltered CPMD users (Active & Verified): " . $filteredUsers->count() . "\n";
foreach ($filteredUsers as $u) {
    echo "- Name: {$u->name}\n";
}
