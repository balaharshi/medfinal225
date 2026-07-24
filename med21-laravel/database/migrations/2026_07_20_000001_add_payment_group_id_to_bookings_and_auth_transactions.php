<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_group_id')->nullable()->after('payment_response_status');
            $table->index('payment_group_id');
        });

        Schema::table('auth_transactions', function (Blueprint $table) {
            $table->string('payment_group_id')->nullable()->after('booking_id');
            $table->index('payment_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['payment_group_id']);
            $table->dropColumn('payment_group_id');
        });

        Schema::table('auth_transactions', function (Blueprint $table) {
            $table->dropIndex(['payment_group_id']);
            $table->dropColumn('payment_group_id');
        });
    }
};
