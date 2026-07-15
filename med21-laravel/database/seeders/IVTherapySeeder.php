<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Service;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class IVTherapySeeder extends Seeder
{
    private const DEFAULT_DISCLAIMER = "Disclaimer-\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy.";

    public function run(): void
    {
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

        $subcategorySlug = 'iv-therapy';
        $subcategories = $category->subcategories()->firstOrCreate(
            ['slug' => $subcategorySlug],
            [
                'id' => SequentialId::next(\App\Models\Subcategory::class, 'sub'),
                'title' => 'IV Therapy',
                'image' => 'https://images.unsplash.com/photo-1631563016585-64a1e38db6b1?auto=format&fit=crop&q=80&w=800',
            ]
        );

        $services = $this->getServiceData();

        foreach ($services as $index => $data) {
            $mrp = $data['mrp'];
            $salePrice = $data['sale_price'];
            $duration = $data['duration'] ?: '';
            $hasContentColumns = true;

            $vendorPrices = [];

            $attributes = [];
            if ($hasContentColumns && !empty($data['key_ingredients'])) {
                $attributes['key_ingredients'] = $data['key_ingredients'];
            }
            if ($hasContentColumns && !empty($data['clinical_benefits'])) {
                $attributes['clinical_benefits'] = $data['clinical_benefits'];
            }

            $disclaimer = null;
            if ($hasContentColumns) {
                $disclaimer = $data['disclaimer'] ?: self::DEFAULT_DISCLAIMER;
                $disclaimer = preg_replace('/Disclaimer-\s+/', "Disclaimer-\n", $disclaimer);
            }

            $description = $data['description'] ?: ($data['clinical_benefits'] ?: $data['name']);

            $slug = Str::slug($data['name']) . '-' . ($index + 1);
            $service = Service::firstOrNew(['slug' => $slug]);
            if (! $service->exists) {
                $service->id = SequentialId::next(Service::class, 'srv');
            }

            $image = $this->resolveImage($slug, $data['name']);

            $service->fill([
                'title' => $data['name'],
                'slug' => $slug,
                'category' => 'service',
                'subcategory' => $subcategorySlug,
                'status' => 'active',
                'active' => true,
                'price' => $mrp,
                'original_price' => $mrp,
                'sale_price' => $salePrice,
                'currency' => 'AED',
                'home_visit_fee_included' => true,
                'duration' => $duration,
                'estimated_visit_time' => '',
                'image' => $image,
                'short_description' => $description,
                'full_description' => $description,
                'description' => $description,
                'inclusions' => [],
                'preparation_instructions' => '',
                'who_is_it_for' => '',
                'service_location' => 'at-home',
                'availability' => '',
                'tags' => ['iv-therapy', 'wellness', 'drip'],
                'display_priority' => $index + 1,
                'seo_title' => $data['name'] . ' - MedZiva',
                'seo_description' => $description,
                'popular' => $index < 3,
                'enquiry_only' => false,
                'attributes' => $hasContentColumns ? array_merge($attributes, [
                    'disclaimer' => $disclaimer,
                    'key_ingredients' => $attributes['key_ingredients'] ?? null,
                    'clinical_benefits' => $attributes['clinical_benefits'] ?? null,
                ]) : [],
                'vendor_prices' => $vendorPrices,
                'booking_notice' => '24 hours prior booking',
                'lead_time_minutes' => 1440,
                'booking_notice_minutes' => 1440,
                'remarks' => '',
            ]);
            $service->save();
        }

        $this->command->info('Synced ' . count($services) . ' IV Therapy services.');
    }

    private function resolveImage(string $slug, string $name): string
    {
        $registry = config('medziva.images.services.iv-therapy', []);
        $filename = $registry[$slug] ?? null;

        if ($filename) {
            $path = '/images/services/' . $filename;
            $fullPath = config('medziva.frontend_public_path') . $path;
            if (File::exists($fullPath)) {
                return $path;
            }
        }

        return config('medziva.images.defaults.iv-therapy', 'https://images.unsplash.com/photo-1631563016585-64a1e38db6b1?auto=format&fit=crop&q=80&w=400');
    }

    private function getServiceData(): array
    {
        return [
            [
                'name' => 'Skin Glow IV Therapy',
                'mrp' => 850,
                'sale_price' => 699,
                'vendor_prices' => [],
                'description' => 'This powerful blend of antioxidants and vitamins promotes a radiant complexion by reducing oxidative stress and improving skin health.',
                'key_ingredients' => "Alpha Lipoic Acid\nZinc Sulphate\nSelenium\nVitamin C",
                'clinical_benefits' => "● Brightens skin and improves tone\n● Reduces signs of aging and oxidative stress\n● Promotes collagen synthesis and skin elasticity",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Hair, Skin & Nail Care IV Therapy',
                'mrp' => 850,
                'sale_price' => 699,
                'vendor_prices' => [],
                'description' => 'For those looking to improve the appearance and health of their hair, nails and skin, this drip delivers essential nutrients to promote regeneration and hydration.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nBiotin\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Promotes healthy hair growth and nail strength\n● Enhances skin hydration and elasticity\n● Reduces inflammation and supports skin healing",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Energy & Weight Loss IV Therapy',
                'mrp' => 900,
                'sale_price' => 749,
                'vendor_prices' => [],
                'description' => 'Supports your metabolism and energy levels with its potent blend of vitamins, minerals and amino acids. Ideal for patients dealing with fatigue, weight management issues or those seeking enhanced athletic performance.',
                'key_ingredients' => "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Boosts energy and endurance\n● Enhances fat metabolism\n● Reduces exercise-related fatigue and muscle cramps",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Immune & Hydration Drip',
                'mrp' => 799,
                'sale_price' => 649,
                'vendor_prices' => [],
                'description' => 'Strengthen your immune defenses and ensure optimal hydration with this drip, formulated to help fight infections and promote recovery from illness.',
                'key_ingredients' => "Vitamin C\nZinc Sulphate\nMagnesium Chloride\nN-Acetylcysteine (NAC)\nSelenium",
                'clinical_benefits' => "● Supports immune system function\n● Enhances hydration and recovery\n● Reduces oxidative stress and inflammation",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Antistress / Relax IV Therapy',
                'mrp' => 899,
                'sale_price' => 749,
                'vendor_prices' => [],
                'description' => 'Reduces mental fatigue and sharpens focus while promoting relaxation and reducing stress.',
                'key_ingredients' => "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Supports neurotransmitter function for sharper focus\n● Promotes better concentration\n● Magnesium and B vitamins help soothe the nervous system, leading to a more relaxed state of mind",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Gut Cleanse & Acne Cure IV Therapy',
                'mrp' => 899,
                'sale_price' => 699,
                'vendor_prices' => [],
                'description' => 'This IV drip is designed to improve skin health and reduce acne through a blend of vitamins, minerals and antioxidants that support both skin and gut health.',
                'key_ingredients' => "Vitamin B Complex (B1, B5, B6, B12)\nMagnesium Chloride\nZinc Sulphate\nN-Acetylcysteine (NAC)\nL-Glutamine\nAlpha Lipoic Acid (ALA)\nAscorbic Acid (Vitamin C)",
                'clinical_benefits' => "● Sebum Regulation: Vitamins and zinc decrease oil production\n● Anti Inflammatory Effects: Magnesium, NAC, ALA and Vitamin C minimizes inflammation\n● Anti Oxidant Support: NAC, ALA and Vitamin C combat oxidative stress\n● Gut Health Improvement: L-Glutamine enhances gut health, reducing systemic inflammation",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Memory Boost and Focus IV Therapy',
                'mrp' => 899,
                'sale_price' => 699,
                'vendor_prices' => [],
                'description' => 'Designed for those seeking improved cognitive function, this drip supports brain health, reduces mental fatigue and sharpens focus.',
                'key_ingredients' => "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Enhances memory and cognitive function\n● Reduces mental fatigue and brain fog\n● Supports neurotransmitter function for sharper focus",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Surgery Recovery IV Therapy',
                'mrp' => 899,
                'sale_price' => 749,
                'vendor_prices' => [],
                'description' => 'This drip is specifically designed to support recovery following surgery by providing essential vitamins and amino acids that enhance healing, reduce inflammation and boost overall recovery.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nNiacinamide\nVitamin B2\nMagnesium Chloride\nZinc Sulphate\nIron III Hydroxide Sucrose\nL-Glutamine\nFolic Acid\nAscorbic Acid",
                'clinical_benefits' => "● Enhances Healing: Vitamins and amino acids promote tissue repair and recovery\n● Reduced Inflammation: Ingredients like Niacinamide and Vitamin C help mitigate inflammation\n● Support for immune function: Zinc and Vitamin B6 boost immune response\n● Energy production: B vitamins facilitate energy metabolism to support recovery",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Women Health / Fertility IV Therapy',
                'mrp' => 899,
                'sale_price' => 749,
                'vendor_prices' => [],
                'description' => 'This drip is designed to support women\'s fertility and reproductive health by improving egg quality, balancing hormones, reducing oxidative stress, and promoting overall reproductive wellness.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nVitamin B2\nMagnesium Chloride\nZinc Sulphate\nAscorbic Acid\nN-Acetylcysteine\nSelenium",
                'clinical_benefits' => "● Enhances women's fertility and health by improving egg quality, regulating hormones and reducing oxidative stress\n● Boosts energy and balances hormones\n● Provides antioxidant protection, promoting reproductive wellness",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Men Power IV Drip',
                'mrp' => 839,
                'sale_price' => 699,
                'vendor_prices' => [],
                'description' => 'This drip is designed to support men\'s sexual health and vitality by enhancing energy levels, promoting healthy blood flow, supporting testosterone production, and improving overall performance and wellness.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nMagnesium Chloride\nZinc Sulphate\nL-Glutamine\nL-Arginine\nAscorbic Acid\nTaurine\nSelenium",
                'clinical_benefits' => "● Supports men's sexual performance by boosting energy, improving blood flow and enhancing overall vitality\n● Stimulates nitric oxide production promoting better circulation and erectile function\n● Zinc Sulphate aids testosterone synthesis",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Liver Detox Drip / After Party',
                'mrp' => 899,
                'sale_price' => 699,
                'vendor_prices' => [],
                'description' => 'Promotes liver health and detoxification with this formula, ideal for those exposed to environmental toxins, medications or poor dietary habits.',
                'key_ingredients' => "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
                'clinical_benefits' => "● Supports detoxification and liver function\n● Reduces oxidative stress on the liver\n● Enhances fat metabolism and energy production",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Antiaging with NAD 100mg IV Therapy',
                'mrp' => 999,
                'sale_price' => 799,
                'vendor_prices' => [],
                'description' => 'Perfect for those seeking anti aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.',
                'key_ingredients' => 'NAD+ 100mg',
                'clinical_benefits' => "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Antiaging with NAD 250mg IV Therapy',
                'mrp' => 1199,
                'sale_price' => 999,
                'vendor_prices' => [],
                'description' => 'Perfect for those seeking anti aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.',
                'key_ingredients' => 'NAD+ 250mg',
                'clinical_benefits' => "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
            ],
            [
                'name' => 'Antiaging with NAD 500mg IV Therapy',
                'mrp' => 1699,
                'sale_price' => 1399,
                'vendor_prices' => [],
                'description' => 'Perfect for those seeking anti aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.',
                'key_ingredients' => 'NAD+ 500mg',
                'clinical_benefits' => "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
                'disclaimer' => self::DEFAULT_DISCLAIMER,
                'duration' => '',
        ];
    }
}
