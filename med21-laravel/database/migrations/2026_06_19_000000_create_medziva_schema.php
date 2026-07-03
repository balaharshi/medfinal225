<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->text('name');
            $table->string('type')->default('Pharmacy');
            $table->string('email')->nullable()->unique();
            $table->string('contact')->nullable();
            $table->float('rating')->default(5);
            $table->string('address')->default('Dubai');
            $table->float('commission')->default(10);
            $table->boolean('active')->default(true);
            $table->string('password_hash')->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('username')->nullable()->unique();
            $table->string('email')->nullable()->unique();
            $table->string('full_name');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('password_hash');
            $table->string('role')->default('customer');
            $table->string('vendor_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('vendor_id')->references('id')->on('vendors')->nullOnDelete();
        });

        Schema::create('categories', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->text('title');
            $table->text('image');
            $table->string('slug')->unique();
            $table->string('type')->default('service');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('subcategories', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('category_id');
            $table->text('title');
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->text('name');
            $table->string('subtitle')->default('');
            $table->integer('price')->default(0);
            $table->integer('original_price')->default(0);
            $table->text('image');
            $table->string('category')->default('devices-for-rent');
            $table->string('subcategory')->default('');
            $table->string('brand')->default('MedZiva Store');
            $table->float('rating')->default(5);
            $table->boolean('in_stock')->default(true);
            $table->text('description')->nullable();
            $table->json('attributes');
            $table->json('vendor_prices');
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->text('title');
            $table->string('slug')->default('');
            $table->string('category')->default('home-healthcare')->index();
            $table->string('subcategory')->default('');
            $table->string('status')->default('active');
            $table->boolean('active')->default(true);
            $table->integer('price')->default(0);
            $table->integer('original_price')->default(0);
            $table->integer('sale_price')->default(0);
            $table->string('currency')->default('AED');
            $table->boolean('home_visit_fee_included')->default(true);
            $table->string('duration')->default('1 Hour');
            $table->string('estimated_visit_time')->default('');
            $table->text('image');
            $table->text('short_description')->nullable();
            $table->text('full_description')->nullable();
            $table->text('description')->nullable();
            $table->json('inclusions');
            $table->text('preparation_instructions')->nullable();
            $table->text('who_is_it_for')->nullable();
            $table->string('service_location')->default('at-home');
            $table->text('availability')->nullable();
            $table->json('tags');
            $table->integer('display_priority')->default(100);
            $table->string('seo_title')->default('');
            $table->text('seo_description')->nullable();
            $table->boolean('popular')->default(false);
            $table->boolean('enquiry_only')->default(false);
            $table->json('attributes');
            $table->json('vendor_prices');
            $table->text('booking_notice')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('customer_name');
            $table->string('customer_email')->index();
            $table->string('customer_phone')->nullable();
            $table->text('service_title');
            $table->string('vendor_name')->index();
            $table->string('vendor_id')->nullable();
            $table->string('service_id')->nullable();
            $table->integer('price')->default(0);
            $table->string('date');
            $table->string('time_slot')->default('Flexible');
            $table->string('region')->default('Dubai');
            $table->string('status')->default('Pending');
            $table->string('payment_status')->default('Unpaid')->index();
            $table->string('payment_provider')->nullable();
            $table->string('payment_app_utr')->nullable()->index();
            $table->string('payment_order_id')->nullable();
            $table->string('payment_transaction_utr')->nullable()->index();
            $table->string('payment_response_status')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('vendor_id');
            $table->index('service_id');
        });

        Schema::create('enquiries', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->text('service_title');
            $table->text('message');
            $table->string('contact_method')->nullable();
            $table->string('date');
            $table->string('status')->default('Pending Response')->index();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table): void {
            $table->string('key')->primary();
            $table->string('site_name')->default('MedZiva Home Healthcare');
            $table->float('vat_percent')->default(5);
            $table->float('platform_fee_percent')->default(2.5);
            $table->string('default_currency')->default('AED');
            $table->string('support_email')->default('support@medziva.ae');
            $table->json('service_regions');
            $table->boolean('maintenance_mode')->default(false);
            $table->string('admin_username')->default('admin');
            $table->timestamps();
        });

        Schema::create('vendor_service_assignments', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('vendor_id')->index();
            $table->string('service_id')->index();
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->unique(['vendor_id', 'service_id'], 'vendor_service_assignments_vendor_service_uidx');
            $table->foreign('vendor_id')->references('id')->on('vendors')->cascadeOnDelete();
            $table->foreign('service_id')->references('id')->on('services')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_service_assignments');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('enquiries');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('services');
        Schema::dropIfExists('products');
        Schema::dropIfExists('subcategories');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('vendors');
    }
};
