<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_codes', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('user_id')->unique();
            $table->string('code')->unique();
            $table->integer('times_used')->default(0);
            $table->integer('max_uses')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('referrals', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('referrer_id');
            $table->string('referred_email')->nullable();
            $table->string('referred_user_id')->nullable();
            $table->string('referral_code_id');
            $table->string('status')->default('pending');
            $table->integer('referrer_reward')->default(0);
            $table->string('referrer_reward_status')->default('pending');
            $table->integer('friend_discount')->default(0);
            $table->string('friend_booking_id')->nullable();
            $table->timestamp('vested_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('referrer_id');
            $table->index('referred_user_id');
            $table->foreign('referrer_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('referral_code_id')->references('id')->on('referral_codes')->cascadeOnDelete();
            $table->foreign('friend_booking_id')->references('id')->on('bookings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
        Schema::dropIfExists('referral_codes');
    }
};
