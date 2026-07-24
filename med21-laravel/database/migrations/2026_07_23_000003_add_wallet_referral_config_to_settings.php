<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table): void {
            $table->json('wallet_config')->nullable()->after('admin_username');
            $table->json('referral_config')->nullable()->after('wallet_config');
        });

        DB::table('settings')->where('key', 'config')->update([
            'wallet_config' => json_encode([
                'welcome_bonus' => 0,
            ]),
            'referral_config' => json_encode([
                'referrer_reward' => 25,
                'friend_discount' => 25,
                'vesting_days' => 7,
                'max_per_year' => 20,
            ]),
        ]);
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table): void {
            $table->dropColumn(['wallet_config', 'referral_config']);
        });
    }
};
