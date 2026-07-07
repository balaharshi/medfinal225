<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use App\Models\Service;
use App\Models\VendorServiceAssignment;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestAccountsSeeder extends Seeder
{
    private const PASSWORD = 'Test@12345';

    public function run(): void
    {
        // ── Customers ──────────────────────────────────────────────
        $customers = [
            [
                'fullName' => 'Ahmed Al Rashid',
                'email' => 'ahmed.test@medziva.ae',
                'phone' => '+971501112233',
                'address' => 'Dubai Marina, Dubai',
            ],
            [
                'fullName' => 'Fatima Khan',
                'email' => 'fatima.test@medziva.ae',
                'phone' => '+971552223344',
                'address' => 'Al Nahda, Sharjah',
            ],
            [
                'fullName' => 'Omar Hassan',
                'email' => 'omar.test@medziva.ae',
                'phone' => '+971563334455',
                'address' => 'Jumeirah Village Circle, Dubai',
            ],
        ];

        foreach ($customers as $c) {
            User::firstOrCreate(
                ['email' => $c['email']],
                [
                    'id' => SequentialId::next(User::class, 'u'),
                    'full_name' => $c['fullName'],
                    'phone' => $c['phone'],
                    'address' => $c['address'],
                    'password_hash' => Hash::make(self::PASSWORD),
                    'role' => 'customer',
                    'is_active' => true,
                ]
            );
        }

        // ── Vendors ───────────────────────────────────────────────
        $vendorsData = [
            [
                'name' => 'Al Noor Nursing Care',
                'email' => 'alnoor.test@medziva.ae',
                'type' => 'Nursing Provider',
                'contact' => '+971504445566',
                'address' => 'Deira, Dubai',
                // 3 services: 2 overlapping (srv-004, srv-017) + 1 unique (srv-001)
                'services' => ['srv-001', 'srv-004', 'srv-017'],
            ],
            [
                'name' => 'City Care Home Healthcare',
                'email' => 'citycare.test@medziva.ae',
                'type' => 'Healthcare Provider',
                'contact' => '+971556667788',
                'address' => 'Al Rigga, Dubai',
                // 3 services: 2 overlapping (srv-004, srv-017) + 1 unique (srv-050)
                'services' => ['srv-004', 'srv-017', 'srv-050'],
            ],
            [
                'name' => 'Best Care Medical Center',
                'email' => 'bestcare.test@medziva.ae',
                'type' => 'Healthcare Provider',
                'contact' => '+971568889900',
                'address' => 'Bur Dubai',
                // 3 services: 1 overlapping (srv-017) + 2 unique (srv-047, srv-003)
                'services' => ['srv-003', 'srv-017', 'srv-047'],
            ],
        ];

        foreach ($vendorsData as $vData) {
            $services = $vData['services'];
            unset($vData['services']);

            $vendor = Vendor::firstOrCreate(
                ['email' => $vData['email']],
                array_merge($vData, [
                    'id' => SequentialId::next(Vendor::class, 'v'),
                    'active' => true,
                    'rating' => 4.5,
                    'commission' => 10,
                    'password_hash' => Hash::make(self::PASSWORD),
                ])
            );

            // Create linked User account for vendor login
            User::firstOrCreate(
                ['email' => $vData['email']],
                [
                    'id' => SequentialId::next(User::class, 'u'),
                    'full_name' => $vData['name'],
                    'phone' => $vData['contact'],
                    'address' => $vData['address'],
                    'password_hash' => Hash::make(self::PASSWORD),
                    'role' => 'vendor',
                    'vendor_id' => $vendor->id,
                    'is_active' => true,
                ]
            );

            // Assign services to vendor
            foreach ($services as $serviceId) {
                $service = Service::find($serviceId);
                if ($service) {
                    VendorServiceAssignment::firstOrCreate(
                        ['vendor_id' => $vendor->id, 'service_id' => $serviceId],
                        [
                            'id' => SequentialId::next(VendorServiceAssignment::class, 'vsa'),
                            'enabled' => true,
                        ]
                    );
                }
            }
        }

        $this->command->info('Test accounts seeded: 3 customers + 3 vendors (all password: ' . self::PASSWORD . ')');
    }
}
