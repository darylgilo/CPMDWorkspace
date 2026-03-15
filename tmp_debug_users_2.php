<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$allUsers = User::all();
echo "Total users in DB: " . $allUsers->count() . "\n";
echo "Users with office 'CPMD': " . User::where('office', 'CPMD')->count() . "\n";
echo "Users with cpmd = 1: " . User::where('cpmd', 1)->count() . "\n";

$cpmdFieldUsers = User::where('cpmd', 1)->get();
foreach ($cpmdFieldUsers as $u) {
    echo "- Name: {$u->name}, Office: {$u->office}, Status: {$u->status}\n";
}
