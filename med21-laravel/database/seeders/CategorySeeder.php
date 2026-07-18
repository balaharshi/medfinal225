<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Remove old/stale categories from previous seeders
        $validSlugs = ['home-healthcare', 'lab-tests-at-home', 'rent-medical-equipment'];
        Category::whereNotIn('slug', $validSlugs)->delete();
        Subcategory::whereNotIn('slug', ['nursing-care-at-home', 'physiotherapy-at-home', 'doctor-on-call',
            'long-term-specialized-care', 'speech-and-language-therapy', 'occupational-therapy', 'iv-therapy',
            'routine-blood-tests', 'preventive-health-packages', 'mens-health-packages', 'womens-health-packages',
            'std-sexual-health', 'specialized-diagnostic-tests', 'genetic-testing'
        ])->delete();

        $categories = [
            'home-healthcare' => [
                'title' => 'Home Healthcare',
                'subcategories' => [
                    'nursing-care-at-home' => 'Nursing Care at Home',
                    'physiotherapy-at-home' => 'Physiotherapy at Home',
                    'doctor-on-call' => 'Doctor on Call',
                    'long-term-specialized-care' => 'Long Term / Specialised Care',
                    'speech-and-language-therapy' => 'Speech and Language Therapy',
                    'occupational-therapy' => 'Occupational Therapy',
                    'iv-therapy' => 'IV Therapy',
                ],
            ],
            'lab-tests-at-home' => [
                'title' => 'Lab Tests at Home',
                'subcategories' => [
                    'routine-blood-tests' => 'Routine Blood Tests',
                    'preventive-health-packages' => 'Preventive Health Packages',
                    'mens-health-packages' => 'Men\'s Health Packages',
                    'womens-health-packages' => 'Women\'s Health Packages',
                    'std-sexual-health' => 'STD / Sexual Health',
                    'specialized-diagnostic-tests' => 'Specialized Diagnostic Tests',
                    'genetic-testing' => 'Genetic Testing',
                ],
            ],
            'rent-medical-equipment' => [
                'title' => 'Rent Medical Equipment',
                'subcategories' => [],
            ],
        ];

        foreach ($categories as $slug => $data) {
            $categoryImage = "/images/{$slug}/{$slug}.jpg";
            $category = Category::firstOrCreate(
                ['slug' => $slug],
                [
                    'id' => SequentialId::next(Category::class, 'cat'),
                    'title' => $data['title'],
                    'type' => 'service',
                    'image' => $categoryImage,
                    'description' => $data['title'] . ' category',
                ]
            );
            $category->update(['image' => $categoryImage]);

            foreach ($data['subcategories'] as $subSlug => $subTitle) {
                $subcategoryImage = "/images/{$slug}/{$subSlug}/{$subSlug}.jpg";
                $subcategory = $category->subcategories()->firstOrCreate(
                    ['slug' => $subSlug],
                    [
                        'id' => SequentialId::next(Subcategory::class, 'sub'),
                        'title' => $subTitle,
                        'image' => $subcategoryImage,
                    ]
                );
                $subcategory->update(['image' => $subcategoryImage]);
            }
        }

        $this->command->info('Seeded ' . count($categories) . ' categories with subcategories.');
    }
}
