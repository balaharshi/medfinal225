<?php
/**
 * DIAGNOSTIC SCRIPT - Upload to public_html/api/
 * Visit: https://api.medzivahealthcare.com/diagnose.php
 * DELETE AFTER USE
 */

echo "<h2>Laravel Diagnostic</h2>";

// 1. Check PHP version
echo "<p><b>PHP Version:</b> " . phpversion() . "</p>";

// 2. Check .env exists
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    echo "<p style='color:green'>.env file exists</p>";
    $envContent = file_get_contents($envPath);
    if (strpos($envContent, 'APP_KEY=') !== false && strlen($envContent) > 50) {
        echo "<p style='color:green'>.env has content (" . strlen($envContent) . " bytes)</p>";
    } else {
        echo "<p style='color:red'>.env appears empty or missing APP_KEY</p>";
    }
} else {
    echo "<p style='color:red'>.env file NOT found at: $envPath</p>";
}

// 3. Check directory structure
$dirs = ['storage', 'bootstrap/cache', 'vendor', 'app', 'routes', 'config', 'database'];
foreach ($dirs as $dir) {
    $path = __DIR__ . '/' . $dir;
    if (is_dir($path)) {
        echo "<p style='color:green'>Directory exists: $dir</p>";
    } else {
        echo "<p style='color:red'>Directory MISSING: $dir</p>";
    }
}

// 4. Check storage writable
$storagePath = __DIR__ . '/storage';
if (is_dir($storagePath)) {
    $testFile = $storagePath . '/test_write_' . time() . '.txt';
    if (file_put_contents($testFile, 'test') !== false) {
        unlink($testFile);
        echo "<p style='color:green'>storage/ is writable</p>";
    } else {
        echo "<p style='color:red'>storage/ is NOT writable - set permissions to 775</p>";
    }
}

$cachePath = __DIR__ . '/bootstrap/cache';
if (is_dir($cachePath)) {
    $testFile = $cachePath . '/test_write_' . time() . '.txt';
    if (file_put_contents($testFile, 'test') !== false) {
        unlink($testFile);
        echo "<p style='color:green'>bootstrap/cache/ is writable</p>";
    } else {
        echo "<p style='color:red'>bootstrap/cache/ is NOT writable - set permissions to 775</p>";
    }
}

// 5. Check index.php exists at correct level
if (file_exists(__DIR__ . '/index.php')) {
    echo "<p style='color:green'>index.php found in public_html/api/</p>";
} else {
    echo "<p style='color:red'>index.php NOT found - you may need to move files up from med21-laravel/</p>";
}

// 6. Try to actually boot Laravel
echo "<hr><h3>Attempting Laravel Boot...</h3>";
try {
    require __DIR__ . '/vendor/autoload.php';
    echo "<p style='color:green'>Autoload loaded</p>";
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "<p style='color:green'>App bootstrapped</p>";
    
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    echo "<p style='color:green'>HTTP kernel resolved</p>";
    
    $response = $kernel->handle($request = Illuminate\Http\Request::capture());
    echo "<p style='color:green'>Request handled - Status: " . $response->getStatusCode() . "</p>";
    
} catch (\Throwable $e) {
    echo "<p style='color:red'><b>Error:</b> " . $e->getMessage() . "</p>";
    echo "<p style='color:grey'>File: " . $e->getFile() . ":" . $e->getLine() . "</p>";
}

echo "<p style='color:red;font-size:1.2em'><b>DELETE THIS FILE WHEN DONE</b></p>";
