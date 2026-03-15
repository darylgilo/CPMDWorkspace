<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$users = User::where('office', 'CPMD')->get();
foreach ($users as $u) {
    echo "- Name: {$u->name}, Office: {$u->office}, Status: {$u->status}, Verified: " . ($u->email_verified_at ? 'Yes' : 'No') . "\n";
}
