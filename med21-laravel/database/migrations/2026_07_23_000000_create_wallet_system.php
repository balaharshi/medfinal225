<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('user_id')->unique();
            $table->integer('balance')->default(0);
            $table->string('currency')->default('AED');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('wallet_transactions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('wallet_id');
            $table->string('type');
            $table->integer('amount');
            $table->integer('balance_before');
            $table->integer('balance_after');
            $table->string('description');
            $table->string('reference_type')->nullable();
            $table->string('reference_id')->nullable();
            $table->timestamps();

            $table->index('wallet_id');
            $table->index('reference_type');
            $table->index('reference_id');
            $table->foreign('wallet_id')->references('id')->on('wallets')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
