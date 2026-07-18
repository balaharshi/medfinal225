<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RentMedicalEquipmentSeeder extends Seeder
{
    private function resolveImage(string $name): string
    {
        // Products that do not have a corresponding image file should return ''.
        $missing = [
            // Add product names here that do not have a corresponding image file.
        ];

        if (in_array($name, $missing, true)) {
            return '';
        }

        // Map product names to canonical slug-based filenames.
        $map = [
            'Electric Bed 3 Function' => 'electric-bed-3-function',
            'Electric Bed 5 Function' => 'electric-bed-5-function',
            'Oxygen Concentrator 5 ltr' => 'oxygen-concentrator-5-ltr',
            'Oxygen Cylinder Set 48cft (Includes regulator and trolley)' => 'oxygen-cylinder-set-48cft',
            'Patient Monitor 5 Parameter with trolley and accessories' => 'patient-monitor-5-parameter-with',
            'BIPAP Machine' => 'bipap-machine',
            'CPAP Machine' => 'cpap-machine',
            'Suction Machine' => 'suction-machine',
            'Infusion Pump' => 'infusion-pump',
            'Syringe Pump' => 'syringe-pump',
            'Patient Hoist' => 'patient-hoist',
            'Wheel Chair' => 'wheel-chair',
        ];

        $slug = $map[$name] ?? Str::slug($name);

        return "/images/rent-medical-equipment/{$slug}.jpg";
    }

    public function run(): void
    {
        $products = [
            ['name' => 'Electric Bed 3 Function', 'weekly_price' => 480, 'monthly_price' => 1344, 'security_deposit' => 2500],
            ['name' => 'Electric Bed 5 Function', 'weekly_price' => 660, 'monthly_price' => 1848, 'security_deposit' => 3000],
            ['name' => 'Oxygen Cylinder Set 48cft (Includes regulator and trolley)', 'weekly_price' => 120, 'monthly_price' => 336, 'security_deposit' => 900],
            ['name' => 'Oxygen Concentrator 5 ltr', 'weekly_price' => 300, 'monthly_price' => 840, 'security_deposit' => 2000],
            ['name' => 'Patient Monitor 5 Parameter with trolley and accessories', 'weekly_price' => 360, 'monthly_price' => 1008, 'security_deposit' => 1500],
            ['name' => 'BIPAP Machine', 'weekly_price' => 960, 'monthly_price' => 2688, 'security_deposit' => 3000],
            ['name' => 'CPAP Machine', 'weekly_price' => 780, 'monthly_price' => 2184, 'security_deposit' => 2500],
            ['name' => 'Suction Machine', 'weekly_price' => 120, 'monthly_price' => 336, 'security_deposit' => 500],
            ['name' => 'Infusion Pump', 'weekly_price' => 180, 'monthly_price' => 504, 'security_deposit' => 1800],
            ['name' => 'Syringe Pump', 'weekly_price' => 240, 'monthly_price' => 672, 'security_deposit' => 1800],
            ['name' => 'Patient Hoist', 'weekly_price' => 420, 'monthly_price' => 1176, 'security_deposit' => 3000],
            ['name' => 'Wheel Chair', 'weekly_price' => 90, 'monthly_price' => 252, 'security_deposit' => 250],
        ];

        foreach ($products as $data) {
            $product = Product::firstOrNew(['name' => $data['name']]);
            if (! $product->exists) {
                $product->id = SequentialId::next(Product::class, 'prod');
            }

            $slug = Str::slug($data['name']);
            $product->fill([
                'slug' => $slug,
                'subtitle' => "MRP per week AED {$data['weekly_price']} | MRP per month AED {$data['monthly_price']} | Security deposit AED {$data['security_deposit']}",
                'price' => $data['weekly_price'],
                'original_price' => $data['monthly_price'],
                'image' => $this->resolveImage($data['name']),
                'category' => 'rent-medical-equipment',
                'subcategory' => '',
                'brand' => 'Rental Equipment',
                'rating' => 4.8,
                'in_stock' => true,
                'description' => 'Weekly and monthly rental options with listed security deposits.',
                'attributes' => [
                    ['label' => 'MRP per week', 'value' => "AED {$data['weekly_price']}"],
                    ['label' => 'MRP per month', 'value' => "AED {$data['monthly_price']}"],
                    ['label' => 'Security deposit', 'value' => "AED {$data['security_deposit']}"],
                    ['label' => 'Booking notice', 'value' => '12 hours prior booking'],
                ],
                'vendor_prices' => [],
            ]);
            $product->save();
        }

        $this->command->info('Seeded ' . count($products) . ' rental products.');
    }
}
