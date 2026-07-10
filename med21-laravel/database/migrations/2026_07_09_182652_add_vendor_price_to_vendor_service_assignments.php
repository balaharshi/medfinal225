<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_service_assignments', function (Blueprint $table) {
            $table->integer('vendor_price')->nullable()->after('enabled')
                ->comment('What the vendor charges MedZiva (AED). Null means use service price.');
            $table->string('commission_type')->nullable()->after('vendor_price')
                ->default('fixed')
                ->comment('fixed = vendor_price is AED amount, percentage = % of MRP');
            $table->decimal('commission_value', 8, 2)->nullable()->after('commission_type')
                ->comment('Used when commission_type=percentage. E.g., 20 = 20% off MRP');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_service_assignments', function (Blueprint $table) {
            $table->dropColumn(['vendor_price', 'commission_type', 'commission_value']);
        });
    }
};
