<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            if (Schema::hasColumn('services', 'seo_title')) {
                $table->text('seo_title')->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            if (Schema::hasColumn('services', 'seo_title')) {
                $table->string('seo_title', 255)->nullable()->change();
            }
        });
    }
};
