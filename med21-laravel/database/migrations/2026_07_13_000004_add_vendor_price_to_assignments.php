<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_service_assignments', function (Blueprint $table): void {
            if (! Schema::hasColumn('vendor_service_assignments', 'vendor_price')) {
                $table->integer('vendor_price')->default(0)->after('enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vendor_service_assignments', function (Blueprint $table): void {
            if (Schema::hasColumn('vendor_service_assignments', 'vendor_price')) {
                $table->dropColumn('vendor_price');
            }
        });
    }
};
