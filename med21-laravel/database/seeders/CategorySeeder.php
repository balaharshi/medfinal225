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
        $categories = [
            'service' => [
                'title' => 'Service',
                'subcategories' => ['iv-therapy' => 'IV Therapy'],
            ],
            'home-healthcare' => [
                'title' => 'Home Healthcare',
                'subcategories' => ['nursing-care-at-home' => 'Nursing Care at Home'],
            ],
            'long-term-care' => [
                'title' => 'Long-Term Care',
                'subcategories' => ['long-term-specialized-care' => 'Long Term Specialised Care'],
            ],
            'doctor-on-call' => [
                'title' => 'Doctor on Call',
                'subcategories' => ['doctor-on-call' => 'Doctor on Call'],
            ],
            'physiotherapy' => [
                'title' => 'Physiotherapy',
                'subcategories' => ['physiotherapy-at-home' => 'Physiotherapy at Home'],
            ],
            'speech-therapy' => [
                'title' => 'Speech Therapy',
                'subcategories' => ['speech-and-language-therapy' => 'Speech and Language Therapy'],
            ],
            'occupational-therapy' => [
                'title' => 'Occupational Therapy',
                'subcategories' => ['occupational-therapy' => 'Occupational Therapy'],
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
            'lab-tests' => [
                'title' => 'Lab Tests (Biomarkers)',
                'subcategories' => ['customize-lab-package' => 'Create Your Own Package'],
            ],
        ];

        foreach ($categories as $slug => $data) {
            $category = Category::firstOrCreate(
                ['slug' => $slug],
                [
                    'id' => SequentialId::next(Category::class, 'cat'),
                    'title' => $data['title'],
                    'type' => 'service',
                    'image' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
                    'description' => $data['title'] . ' category',
                ]
            );

            foreach ($data['subcategories'] as $subSlug => $subTitle) {
                $subcategory = $category->subcategories()->firstOrCreate(
                    ['slug' => $subSlug],
                    [
                        'id' => SequentialId::next(Subcategory::class, 'sub'),
                        'title' => $subTitle,
                        'image' => 'https://images.unsplash.com/photo-1631563016585-64a1e38db6b1?auto=format&fit=crop&q=80&w=800',
                    ]
                );
                if ($subSlug === 'iv-therapy') {
                    $subcategory->update(['image' => '/images/services/iv-therapy-at-home.jpg']);
                }
            }
        }

        $this->command->info('Seeded ' . count($categories) . ' categories with subcategories.');
    }
}
