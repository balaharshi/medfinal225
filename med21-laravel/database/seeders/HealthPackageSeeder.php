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

        $packages = [
            [
                'name' => 'MedZiva Platinum Comprehensive Pack',
                'mrp' => 499,
                'old_price' => 650,
                'tag' => 'Most Popular',
                'desc' => 'Our gold standard full physical evaluation. Covers full profile lipids, diabetes checks, liver/kidney counts, heavy vitamins profile, and an at-home clinician consult.',
                'bullets' => ['Complete lipid panel & HbA1c', 'Liver & kidney metrics assessment', 'Clinician visiting consult included', 'Qualified blood sample collection'],
            ],
            [
                'name' => 'Cardiac Hazard Prevention Bundle',
                'mrp' => 349,
                'old_price' => 480,
                'tag' => 'Coronary Vetted',
                'desc' => 'A diagnostic profile targeting coronary risk parameters. Identifies high density lipid levels, specific cardiac proteins, uric index, and high tension blood pressure evaluations.',
                'bullets' => ['Total lipids & triglycerides index', 'High tension readings auditing', 'Uric acid indicators check', 'DHA approved physical analysis'],
            ],
            [
                'name' => 'Elite Fitness and Body Mass Audit',
                'mrp' => 299,
                'old_price' => 399,
                'tag' => 'Metabolism Vetted',
                'desc' => 'Constructed for athletes or customers during body composition tracking. Monitors endocrine indices, creatine, basic lipid metabolism, and thyroid indicators.',
                'bullets' => ['Thyroid profile & hormonal check', 'Creatine counts auditing', 'Safe home visit drawn vial', 'Metabolic rate overview report'],
            ],
            [
                'name' => 'Cancer / Tumour Marker Profile (Male)',
                'mrp' => 260,
                'old_price' => null,
                'tag' => "Men's Health",
                'desc' => 'Screening profile for men focused on cancer risk markers and early detection through at-home sample collection.',
                'bullets' => ['AFP', 'Total hCG', 'CA 19-9', 'CBC (19)', 'Prostate Profile: PSA Total, PSA Free, PSA Ratio'],
                'who' => 'Men for cancer screening & early detection',
                'prep' => 'No fasting required',
                'result' => 'Same day / Next day',
            ],
        ];

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
