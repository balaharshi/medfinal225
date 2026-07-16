<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Vendor;
use App\Models\VendorServiceAssignment;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class HealthPackageSeeder extends Seeder
{
    public function run(): void
    {
        $demoVendor = Vendor::firstOrCreate(
            ['email' => 'vendor@medzivahealthcare.com'],
            ['id' => 'v-demo', 'name' => 'Demo Vendor', 'type' => 'Healthcare Provider', 'address' => 'Dubai', 'active' => true]
        );

        $packages = [];

        foreach ($packages as $index => $data) {
            $slug = Str::slug($data['name']) . '-' . ($index + 1);
            $service = Service::firstOrNew(['slug' => $slug]);
            if (! $service->exists) {
                $service->id = SequentialId::next(Service::class, 'srv');
            }

            $attributes = [];
            foreach ($data['bullets'] as $bullet) {
                $attributes[] = ['label' => 'Includes', 'value' => $bullet];
            }
            if (! empty($data['old_price'])) {
                $attributes[] = ['label' => 'Old Price', 'value' => (string) $data['old_price']];
            }
            if (! empty($data['tag'])) {
                $attributes[] = ['label' => 'Tag', 'value' => $data['tag']];
            }

            $service->fill([
                'title' => $data['name'],
                'slug' => $slug,
                'category' => 'health-packages',
                'subcategory' => 'preventive-health-packages',
                'status' => 'active',
                'active' => true,
                'price' => $data['mrp'],
                'original_price' => $data['old_price'] ?? $data['mrp'],
                'sale_price' => 0,
                'currency' => 'AED',
                'home_visit_fee_included' => false,
                'duration' => '',
                'estimated_visit_time' => '',
                'image' => 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400',
                'short_description' => $data['desc'],
                'full_description' => $data['desc'],
                'description' => $data['desc'],
                'inclusions' => [],
                'preparation_instructions' => $data['prep'] ?? '',
                'who_is_it_for' => $data['who'] ?? '',
                'service_location' => 'at-home',
                'availability' => '',
                'tags' => ['health-packages', 'premium'],
                'display_priority' => $index + 1,
                'seo_title' => $data['name'] . ' - MedZiva',
                'seo_description' => $data['desc'],
                'popular' => $index === 0,
                'enquiry_only' => false,
                'attributes' => $attributes,
                'vendor_prices' => [],
                'booking_notice' => '12 hours prior booking',
                'remarks' => '',
            ]);
            $service->save();

            VendorServiceAssignment::firstOrCreate(
                ['vendor_id' => $demoVendor->id, 'service_id' => $service->id],
                ['id' => SequentialId::next(VendorServiceAssignment::class, 'vsa'), 'enabled' => true]
            );
        }

        $this->command->info('Seeded ' . count($packages) . ' health packages.');
    }
}
