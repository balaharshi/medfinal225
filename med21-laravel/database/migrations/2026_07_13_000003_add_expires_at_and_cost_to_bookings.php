<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->timestamp('expires_at')->nullable()->after('completed_at');
            $table->integer('cost')->default(0)->after('price');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropIndex(['expires_at']);
            $table->dropColumn(['expires_at', 'cost']);
        });
    }
};
