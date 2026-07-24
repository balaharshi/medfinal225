<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->integer('wallet_amount')->default(0)->after('price');
            $table->string('wallet_transaction_id')->nullable()->after('wallet_amount');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn(['wallet_amount', 'wallet_transaction_id']);
        });
    }
};
