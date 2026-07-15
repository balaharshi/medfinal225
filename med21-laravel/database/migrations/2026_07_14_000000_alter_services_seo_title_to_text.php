<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function ($table): void {
            DB::statement('ALTER TABLE services MODIFY seo_title TEXT NULL');
        });
    }

    public function down(): void
    {
        Schema::table('services', function ($table): void {
            DB::statement('ALTER TABLE services MODIFY seo_title VARCHAR(255) DEFAULT "" NOT NULL');
        });
    }
};
