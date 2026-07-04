<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table): void {
            $table->string('logo')->nullable()->after('name');
        });

        Schema::create('vendor_profile_change_requests', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('vendor_id')->index();
            $table->string('field_name');
            $table->text('current_value')->nullable();
            $table->text('requested_value');
            $table->text('reason')->nullable();
            $table->string('status')->default('pending');
            $table->text('admin_remarks')->nullable();
            $table->timestamps();

            $table->foreign('vendor_id')->references('id')->on('vendors')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_profile_change_requests');
        Schema::table('vendors', function (Blueprint $table): void {
            $table->dropColumn('logo');
        });
    }
};
