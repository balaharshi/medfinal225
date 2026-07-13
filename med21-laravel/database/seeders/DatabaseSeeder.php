<?php

namespace Database\Seeders;

use App\Constants\AppConstants;
use App\Models\PromoCode;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Setting::query()->updateOrCreate(['key' => AppConstants::DEFAULT_SETTINGS_KEY], [
            'site_name' => 'MedZiva Home Healthcare',
            'vat_percent' => 5,
            'platform_fee_percent' => 2.5,
            'default_currency' => 'AED',
            'support_email' => 'support@medziva.ae',
            'service_regions' => ['Dubai', 'Sharjah'],
            'maintenance_mode' => false,
            'admin_username' => 'admin',
        ]);

        $vendor = Vendor::query()->updateOrCreate(['email' => 'vendor@medziva.ae'], [
            'id' => 'v-demo-login',
            'name' => 'Demo Vendor',
            'type' => 'Nursing Provider',
            'contact' => '+971 50 000 0000',
            'address' => 'Dubai',
            'password_hash' => Hash::make('Medziva@123'),
            'active' => true,
        ]);

        User::query()->updateOrCreate(['email' => 'admin@medzivahealthcare.com'], [
            'id' => 'u-admin-login',
            'username' => 'admin',
            'full_name' => 'Admin User',
            'password_hash' => Hash::make('Medziva@123'),
            'role' => AppConstants::USER_ROLES['ADMIN'],
            'is_active' => true,
        ]);

        User::query()->updateOrCreate(['email' => 'vendor@medzivahealthcare.com'], [
            'id' => 'u-vendor-login',
            'username' => 'vendor',
            'full_name' => 'Demo Vendor',
            'password_hash' => Hash::make('Medziva@123'),
            'role' => AppConstants::USER_ROLES['VENDOR'],
            'vendor_id' => $vendor->id,
            'is_active' => true,
        ]);

        User::query()->updateOrCreate(['email' => 'customer@medzivahealthcare.com'], [
            'id' => 'u-customer-login',
            'username' => 'customer',
            'full_name' => 'Customer User',
            'phone' => '+971 50 111 1111',
            'address' => 'Dubai',
            'password_hash' => Hash::make('Medziva@123'),
            'role' => AppConstants::USER_ROLES['CUSTOMER'],
            'is_active' => true,
        ]);

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

        $this->call(HomeHealthcareSeeder::class);
        $this->call(IVTherapySeeder::class);
        $this->call(LabTestSeeder::class);
        $this->call(BiomarkerSeeder::class);
        $this->call(HealthPackageSeeder::class);
        $this->call(VendorWorkingHoursSeeder::class);
        $this->call(ProductSeeder::class);
    }
}
