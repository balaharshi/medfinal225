<?php
/**
 * SIMPLE TEST - Upload to public_html/api/
 * DELETE AFTER USE
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Test 1: PHP Works</h2><p>PHP " . phpversion() . " OK</p>";

echo "<h2>Test 2: .env Loading</h2>";
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0 || trim($line) === '') continue;
        if (strpos($line, '=') !== false) {
            [$key, $val] = explode('=', $line, 2);
            $env[trim($key)] = trim($val);
        }
    }
    echo "<p>DB_CONNECTION: " . ($env['DB_CONNECTION'] ?? 'NOT SET') . "</p>";
    echo "<p>DB_DATABASE: " . ($env['DB_DATABASE'] ?? 'NOT SET') . "</p>";
    echo "<p>DB_USERNAME: " . ($env['DB_USERNAME'] ?? 'NOT SET') . "</p>";
    echo "<p>DB_PASSWORD: " . (isset($env['DB_PASSWORD']) ? 'SET (' . strlen($env['DB_PASSWORD']) . ' chars)' : 'NOT SET') . "</p>";
    echo "<p>APP_KEY: " . (isset($env['APP_KEY']) ? 'SET' : 'NOT SET') . "</p>";
} else {
    echo "<p style='color:red'>.env NOT FOUND</p>";
}

echo "<h2>Test 3: Database Connection</h2>";
try {
    $pdo = new PDO(
        'mysql:host=' . ($env['DB_HOST'] ?? '127.0.0.1') . ';port=' . ($env['DB_PORT'] ?? '3306') . ';dbname=' . ($env['DB_DATABASE'] ?? ''),
        $env['DB_USERNAME'] ?? '',
        $env['DB_PASSWORD'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "<p style='color:green'>Database connected!</p>";

    echo "<h2>Test 4: Tables</h2>";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<p>Tables found: " . count($tables) . "</p>";
    echo "<p>" . implode(', ', $tables) . "</p>";
} catch (PDOException $e) {
    echo "<p style='color:red'>DB Error: " . $e->getMessage() . "</p>";
}

echo "<p style='color:red'><b>DELETE THIS FILE</b></p>";
