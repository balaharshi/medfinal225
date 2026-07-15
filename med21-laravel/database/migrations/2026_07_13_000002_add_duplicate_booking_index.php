<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            DB::statement('CREATE INDEX bookings_duplicate_check_idx ON bookings (customer_email(100), date(20), time_slot(50), service_id(36))');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            DB::statement('DROP INDEX bookings_duplicate_check_idx ON bookings');
        });
    }
};
