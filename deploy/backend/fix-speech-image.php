<?php
/**
 * FIX SPEECH THERAPY CATEGORY IMAGE
 * Upload to public_html/api/ alongside index.php
 * Visit: https://api.medzivahealthcare.com/fix-speech-image.php
 * DELETE THIS FILE IMMEDIATELY AFTER RUNNING
 */

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use Illuminate\Support\Facades\DB;

$category = DB::table('categories')->where('slug', 'speech-therapy')->first();

if ($category) {
    DB::table('categories')->where('slug', 'speech-therapy')->update([
        'image' => '/speach.png',
        'updated_at' => now(),
    ]);
    echo "<h2>Fixed!</h2>";
    echo "<p>Category: <b>{$category->title}</b></p>";
    echo "<p>Old image: {$category->image}</p>";
    echo "<p>New image: /speach.png</p>";
} else {
    echo "<h2>Category 'speech-therapy' not found in database.</h2>";
    echo "<p>No fix needed or the slug is different.</p>";
}

echo "<p style='color:red;font-size:1.2em;'><b>DELETE THIS FILE NOW!</b></p>";
