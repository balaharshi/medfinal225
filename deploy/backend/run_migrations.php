<?php
/**
 * TEMPORARY MIGRATION RUNNER
 * Upload this to the same directory as artisan (one level above public/)
 * Visit: https://api.medzivahealthcare.com/run_migrations.php
 * DELETE THIS FILE IMMEDIATELY AFTER RUNNING
 */

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<h2>Running Migrations...</h2>";
$status = $kernel->call('migrate', ['--force' => true]);
echo "<p style='color:green;font-size:1.2em;'>Done! Migration status: $status</p>";
echo "<p style='color:red;font-size:1.2em;'><b>DELETE THIS FILE NOW!</b></p>";
