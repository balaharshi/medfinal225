<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auth_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('booking_id')->nullable();
            $table->string('app_utr')->nullable();
            $table->string('order_id')->nullable();
            $table->string('transaction_utr')->nullable();
            $table->decimal('authorized_amount', 10, 2);
            $table->decimal('captured_amount', 10, 2)->nullable();
            $table->string('status')->default('AUTHORIZED'); // AUTHORIZED, CAPTURED, VOIDED, CANCELLED
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->timestamp('authorized_at');
            $table->timestamp('capture_deadline'); // authorized_at + 24 hours
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('capture_deadline');
            $table->index('booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_transactions');
    }
};
