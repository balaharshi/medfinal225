<?php

namespace Database\Seeders;

use App\Constants\AppConstants;
use App\Models\PromoCode;
use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorServiceAssignment;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Settings ────────────────────────────────────────────────
        Setting::query()->updateOrCreate(['key' => AppConstants::DEFAULT_SETTINGS_KEY], [
            'site_name' => 'MedZiva Home Healthcare',
            'vat_percent' => 5,
            'platform_fee_percent' => 2.5,
            'default_currency' => 'AED',
            'support_email' => 'support@medzivahealthcare.com',
            'service_regions' => ['Dubai', 'Sharjah'],
            'maintenance_mode' => false,
            'admin_username' => 'admin',
        ]);

        // ── Super Admin ─────────────────────────────────────────────
        User::query()->updateOrCreate(['email' => 'superadmin@medzivahealthcare.com'], [
            'id' => 'u-superadmin',
            'full_name' => 'Super Admin',
            'password_hash' => Hash::make('Medziva@123'),
            'role' => AppConstants::USER_ROLES['SUPER_ADMIN'],
            'is_active' => true,
        ]);

        // ── Admin ───────────────────────────────────────────────────
        User::query()->updateOrCreate(['email' => 'admin@medzivahealthcare.com'], [
            'id' => 'u-admin',
            'full_name' => 'Admin User',
            'password_hash' => Hash::make('Medziva@123'),
            'role' => AppConstants::USER_ROLES['ADMIN'],
            'is_active' => true,
        ]);

        // ── Demo Vendor ─────────────────────────────────────────────
        $vendor = Vendor::query()->updateOrCreate(['email' => 'vendor@medzivahealthcare.com'], [
            'id' => 'v-demo',
            'name' => 'Demo Vendor',
            'type' => 'Healthcare Provider',
            'contact' => '+971 50 000 0000',
            'address' => 'Dubai',
            'rating' => 5.0,
            'commission' => 10,
            'active' => true,
            'password_hash' => Hash::make('Medziva@123'),
        ]);

        // Vendor User Account (for vendor panel login)
        User::query()->updateOrCreate(['email' => 'vendor@medzivahealthcare.com'], [
            'id' => 'u-vendor',
            'full_name' => 'Demo Vendor',
            'password_hash' => Hash::make('Medziva@123'),
            'role' => AppConstants::USER_ROLES['VENDOR'],
            'vendor_id' => $vendor->id,
            'is_active' => true,
        ]);

        // ── Demo Customer ───────────────────────────────────────────
        User::query()->updateOrCreate(['email' => 'customer@medzivahealthcare.com'], [
            'id' => 'u-customer',
            'full_name' => 'Demo Customer',
            'phone' => '+971 50 111 1111',
            'address' => 'Dubai Marina, Dubai',
            'password_hash' => Hash::make('Medziva@123'),
            'role' => AppConstants::USER_ROLES['CUSTOMER'],
            'is_active' => true,
        ]);

        // ── Promo Code ──────────────────────────────────────────────
        PromoCode::query()->updateOrCreate(
            ['code' => 'MEDZIVA10'],
            [
                'id' => 'promo-medziva10',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'max_discount' => 100,
                'min_order' => 0,
                'max_uses' => null,
                'times_used' => 0,
                'active' => true,
            ]
        );

        // ── Services ────────────────────────────────────────────────
        $this->call(HomeHealthcareSeeder::class);
        $this->call(IVTherapySeeder::class);
        $this->call(LabTestSeeder::class);
        $this->call(BiomarkerSeeder::class);

        // Vendor setup
        $this->call(VendorWorkingHoursSeeder::class);

        // ── Products ────────────────────────────────────────────────
        $this->call(ProductSeeder::class);

        // ── Assign ALL services to demo vendor ──────────────────────
        $allActiveServices = Service::query()->where('active', true)->where('status', 'active')->pluck('id');
        foreach ($allActiveServices as $serviceId) {
            VendorServiceAssignment::updateOrCreate(
                ['vendor_id' => $vendor->id, 'service_id' => $serviceId],
                ['id' => SequentialId::next(VendorServiceAssignment::class, 'vsa'), 'enabled' => true]
            );
        }

        $this->command->info('Seed complete:');
        $this->command->info('  Super Admin: superadmin@medzivahealthcare.com / Medziva@123');
        $this->command->info('  Admin:       admin@medzivahealthcare.com / Medziva@123');
        $this->command->info('  Vendor:      vendor@medzivahealthcare.com / Medziva@123');
        $this->command->info('  Customer:    customer@medzivahealthcare.com / Medziva@123');
        $this->command->info("  Vendor has {$allActiveServices->count()} services enabled");
    }
}
