<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Service;
use App\Models\Vendor;
use App\Models\VendorServiceAssignment;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class IVTherapySeeder extends Seeder
{
    private const DEFAULT_DISCLAIMER = "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy.";

    public function run(): void
    {
        $demoVendor = Vendor::firstOrCreate(
            ['email' => 'vendor@medzivahealthcare.com'],
            [
                'id' => 'v-demo',
                'name' => 'Demo Vendor',
                'type' => 'Healthcare Provider',
                'address' => 'Dubai',
                'active' => true,
            ]
        );

        $category = Category::firstOrCreate(
            ['slug' => 'service'],
            [
                'id' => SequentialId::next(Category::class, 'cat'),
                'title' => 'Service',
                'type' => 'service',
                'image' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
                'description' => 'Professional healthcare services',
            ]
        );

        $subcategories = $category->subcategories()->firstOrCreate(
            ['slug' => 'iv-therapy'],
            [
                'id' => SequentialId::next(\App\Models\Subcategory::class, 'sub'),
                'title' => 'IV Therapy',
                'image' => 'https://images.unsplash.com/photo-1631563016585-64a1e38db6b1?auto=format&fit=crop&q=80&w=800',
            ]
        );

        $services = [
            [
                'name' => 'Skin Glow IV Therapy',
                'mrp' => 850,
                'sale_price' => 850,
                'description' => 'This powerful blend of antioxidants and vitamins promotes a radiant complexion by reducing oxidative stress and improving skin health.',
                'key_ingredients' => "Alpha Lipoic Acid\nZinc Sulphate\nSelenium\nVitamin C",
                'clinical_benefits' => "● Brightens skin and improves tone\n● Reduces signs of aging and oxidative stress\n● Promotes collagen synthesis and skin elasticity",
                'popular' => true,
            ],
            [
                'name' => 'Hair, Skin & Nail Care IV Therapy',
                'mrp' => 850,
                'sale_price' => 850,
                'description' => 'For those looking to improve the appearance and health of their hair, nails and skin, this drip delivers essential nutrients to promote regeneration and hydration.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nBiotin\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Promotes healthy hair growth and nail strength\n● Enhances skin hydration and elasticity\n● Reduces inflammation and supports skin healing",
                'popular' => false,
            ],
            [
                'name' => 'Energy & Weight Loss IV Therapy',
                'mrp' => 900,
                'sale_price' => 900,
                'description' => 'Supports your metabolism and energy levels with its potent blend of vitamins, minerals and amino acids. Ideal for patients dealing with fatigue, weight management issues or those seeking enhanced athletic performance.',
                'key_ingredients' => "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Boosts energy and endurance\n● Enhances fat metabolism\n● Reduces exercise-related fatigue and muscle cramps",
                'popular' => false,
            ],
            [
                'name' => 'Immune & Hydration Drip',
                'mrp' => 799,
                'sale_price' => 799,
                'description' => 'Strengthen your immune defenses and ensure optimal hydration with this drip, formulated to help fight infections and promote recovery from illness.',
                'key_ingredients' => "Vitamin C\nZinc Sulphate\nMagnesium Chloride\nN-Acetylcysteine (NAC)\nSelenium",
                'clinical_benefits' => "● Supports immune system function\n● Enhances hydration and recovery\n● Reduces oxidative stress and inflammation",
                'popular' => false,
            ],
            [
                'name' => 'Antistress / Relax IV Therapy',
                'mrp' => 899,
                'sale_price' => 899,
                'description' => 'Reduces mental fatigue and sharpens focus while promoting relaxation and reducing stress.',
                'key_ingredients' => "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Supports neurotransmitter function for sharper focus\n● Promotes better concentration and focus\n● Promotes relaxation and reduces stress\n● Magnesium and B vitamins help soothe the nervous system, leading to a more relaxed state of mind",
                'popular' => false,
            ],
            [
                'name' => 'Gut Cleanse & Acne Cure IV Therapy',
                'mrp' => 899,
                'sale_price' => 899,
                'description' => 'This IV drip is designed to improve skin health and reduce acne through a blend of vitamins, minerals and antioxidants that support both skin and gut health.',
                'key_ingredients' => "Vitamin B Complex (B1, B5, B6, B12)\nMagnesium Chloride\nZinc Sulphate\nN-Acetylcysteine (NAC)\nL-Glutamine\nAlpha Lipoic Acid (ALA)\nAscorbic Acid (Vitamin C)",
                'clinical_benefits' => "● Sebum Regulation: Vitamins and zinc decrease oil production\n● Anti Inflammatory Effects: Magnesium, NAC, ALA and Vitamin C minimizes inflammation\n● Anti Oxidant Support: NAC, ALA and Vitamin C combat oxidative stress\n● Gut Health Improvement: L-Glutamine enhances gut health, reducing systemic inflammation",
                'popular' => false,
            ],
            [
                'name' => 'Memory Boost and Focus IV Therapy',
                'mrp' => 899,
                'sale_price' => 899,
                'description' => 'Designed for those seeking improved cognitive function, this drip supports brain health, reduces mental fatigue and sharpens focus.',
                'key_ingredients' => "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Enhances memory and cognitive function\n● Reduces mental fatigue and brain fog\n● Supports neurotransmitter function for sharper focus",
                'popular' => false,
            ],
            [
                'name' => 'Surgery Recovery IV Therapy',
                'mrp' => 899,
                'sale_price' => 899,
                'description' => 'This drip is specifically designed to support recovery following surgery by providing essential vitamins and amino acids that enhance healing, reduce inflammation and boost overall recovery.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nNiacinamide\nVitamin B2\nMagnesium Chloride\nZinc Sulphate\nIron III Hydroxide Sucrose\nL-Glutamine\nFolic Acid\nAscorbic Acid",
                'clinical_benefits' => "● Enhances Healing: Vitamins and amino acids promote tissue repair and recovery\n● Reduced Inflammation: Ingredients like Niacinamide and Vitamin C help mitigate inflammation\n● Support for immune function: Zinc and Vitamin B6 boost immune response\n● Energy production: B vitamins facilitate energy metabolism to support recovery",
                'popular' => false,
            ],
            [
                'name' => 'Women Health / Fertility IV Therapy',
                'mrp' => 899,
                'sale_price' => 899,
                'description' => "This drip is designed to support women's fertility and reproductive health by improving egg quality, balancing hormones, reducing oxidative stress, and promoting overall reproductive wellness.",
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nVitamin B2\nMagnesium Chloride\nZinc Sulphate\nAscorbic Acid\nN-Acetylcysteine\nSelenium",
                'clinical_benefits' => "● Enhances women's fertility and health by improving egg quality, regulating hormones and reducing oxidative stress\n● Boosts energy and balances hormones\n● Provides antioxidant protection, promoting reproductive wellness",
                'popular' => false,
            ],
            [
                'name' => 'Men Power IV Drip',
                'mrp' => 839,
                'sale_price' => 839,
                'description' => "This drip is designed to support men's sexual health and vitality by enhancing energy levels, promoting healthy blood flow, supporting testosterone production, and improving overall performance and wellness.",
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nMagnesium Chloride\nZinc Sulphate\nL-Glutamine\nL-Arginine\nAscorbic Acid\nTaurine\nSelenium",
                'clinical_benefits' => "● Supports men's sexual performance by boosting energy, improving blood flow and enhancing overall vitality\n● Stimulates nitric oxide production promoting better circulation and erectile function\n● Zinc Sulphate aids testosterone synthesis",
                'popular' => false,
            ],
            [
                'name' => 'Liver Detox Drip / After Party',
                'mrp' => 899,
                'sale_price' => 899,
                'description' => 'Promotes liver health and detoxification with this formula, ideal for those exposed to environmental toxins, medications or poor dietary habits.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Supports detoxification and liver function\n● Reduces oxidative stress on the liver\n● Enhances fat metabolism and energy production",
                'popular' => false,
            ],
            [
                'name' => 'Antiaging with NAD 100mg IV Therapy',
                'mrp' => 999,
                'sale_price' => 999,
                'description' => 'Perfect for those seeking anti-aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.',
                'key_ingredients' => 'NAD+ 100mg',
                'clinical_benefits' => "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
                'popular' => false,
            ],
            [
                'name' => 'Antiaging with NAD 250mg IV Therapy',
                'mrp' => 1199,
                'sale_price' => 1199,
                'description' => 'Perfect for those seeking anti-aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.',
                'key_ingredients' => 'NAD+ 250mg',
                'clinical_benefits' => "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
                'popular' => false,
            ],
            [
                'name' => 'Antiaging with NAD 500mg IV Therapy',
                'mrp' => 1699,
                'sale_price' => 1699,
                'description' => 'Perfect for those seeking anti-aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.',
                'key_ingredients' => 'NAD+ 500mg',
                'clinical_benefits' => "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
                'popular' => true,
            ],
        ];

        foreach ($services as $index => $data) {
            $slug = Str::slug($data['name']) . '-' . ($index + 1);
            $service = Service::firstOrNew(['slug' => $slug]);
            if (! $service->exists) {
                $service->id = SequentialId::next(Service::class, 'srv');
            }

            $service->fill([
                'title' => $data['name'],
                'slug' => $slug,
                'category' => 'iv-therapy',
                'subcategory' => 'iv-therapy',
                'status' => 'active',
                'active' => true,
                'price' => $data['mrp'],
                'original_price' => $data['mrp'],
                'sale_price' => 0,
                'currency' => 'AED',
                'home_visit_fee_included' => true,
                'duration' => '1 Session',
                'estimated_visit_time' => '',
                'image' => 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&q=80&w=400',
                'short_description' => $data['description'],
                'full_description' => $data['description'],
                'description' => $data['description'],
                'inclusions' => [],
                'preparation_instructions' => '',
                'who_is_it_for' => '',
                'service_location' => 'at-home',
                'availability' => '',
                'tags' => ['iv-therapy', 'wellness', 'drip'],
                'display_priority' => $index + 1,
                'seo_title' => $data['name'] . ' - MedZiva',
                'seo_description' => $data['description'],
                'popular' => $data['popular'],
                'enquiry_only' => false,
                'attributes' => [
                    'disclaimer' => self::DEFAULT_DISCLAIMER,
                    'key_ingredients' => $data['key_ingredients'],
                    'clinical_benefits' => $data['clinical_benefits'],
                ],
                'vendor_prices' => [],
                'booking_notice' => '24 hours prior booking',
                'remarks' => '',
            ]);
            $service->save();

            VendorServiceAssignment::firstOrCreate(
                ['vendor_id' => $demoVendor->id, 'service_id' => $service->id],
                [
                    'id' => SequentialId::next(VendorServiceAssignment::class, 'vsa'),
                    'enabled' => true,
                ]
            );
        }

        $this->command->info('Synced ' . count($services) . ' IV Therapy services.');
    }
}
