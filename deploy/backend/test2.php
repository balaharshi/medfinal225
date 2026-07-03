<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');

echo "=== PHP DIAGNOSTIC ===\n\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server API: " . php_sapi_name() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Name: " . $_SERVER['SCRIPT_NAME'] . "\n";
echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n\n";

echo "=== FILE CHECK ===\n";
$files = ['index.php', '.env', 'artisan', 'composer.json'];
foreach ($files as $f) {
    $exists = file_exists(__DIR__ . '/' . $f) ? 'YES' : 'NO';
    echo "$f: $exists\n";
}

$dirs = ['vendor', 'app', 'bootstrap', 'storage', 'routes', 'config', 'public'];
foreach ($dirs as $d) {
    $exists = is_dir(__DIR__ . '/' . $d) ? 'YES' : 'NO';
    echo "$d/: $exists\n";
}

echo "\n=== HIDDEN FILES ===\n";
$hidden = glob(__DIR__ . '/.*');
foreach ($hidden as $h) {
    $name = basename($h);
    if ($name === '.' || $name === '..') continue;
    echo "$name\n";
}

echo "\n=== DB TEST ===\n";
try {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || trim($line) === '') continue;
        if (strpos($line, '=') !== false) {
            [$k, $v] = explode('=', $line, 2);
            $env[trim($k)] = trim($v);
        }
    }
    $dsn = "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_DATABASE']}";
    $pdo = new PDO($dsn, $env['DB_USERNAME'], $env['DB_PASSWORD'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "DB connected OK\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . count($tables) . "\n";
} catch (\Throwable $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}

echo "\nDONE\n";
