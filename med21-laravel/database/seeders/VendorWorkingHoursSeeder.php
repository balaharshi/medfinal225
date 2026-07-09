<?php

namespace Database\Seeders;

use App\Models\Vendor;
use App\Models\VendorWorkingHour;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;

class VendorWorkingHoursSeeder extends Seeder
{
    public function run(): void
    {
        $vendor = Vendor::firstWhere('email', 'vendor@medzivahealthcare.com');
        if (! $vendor) {
            return;
        }

        // Default: Mon-Sat, 9AM-6PM (slot-friendly: 8AM allows first 2hr slot 8-10AM to be fully within 9AM-6PM... 
        // Actually let's use two shifts to cover realistic healthcare providers:
        // Shift 1: 9AM-1PM, Shift 2: 2PM-6PM (break from 1-2PM)
        // OR simpler: 8AM-10PM for full coverage
        // Let's use a generous default: 8AM-10PM to allow all daytime + evening slots
        $defaultHours = [
            ['day_of_week' => 0, 'start_time' => '08:00', 'end_time' => '22:00'], // Sunday
            ['day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '22:00'], // Monday
            ['day_of_week' => 2, 'start_time' => '08:00', 'end_time' => '22:00'], // Tuesday
            ['day_of_week' => 3, 'start_time' => '08:00', 'end_time' => '22:00'], // Wednesday
            ['day_of_week' => 4, 'start_time' => '08:00', 'end_time' => '22:00'], // Thursday
            ['day_of_week' => 5, 'start_time' => '08:00', 'end_time' => '22:00'], // Friday
            ['day_of_week' => 6, 'start_time' => '08:00', 'end_time' => '22:00'], // Saturday
        ];

        foreach ($defaultHours as $entry) {
            VendorWorkingHour::firstOrCreate(
                ['vendor_id' => $vendor->id, 'day_of_week' => $entry['day_of_week']],
                [
                    'id' => SequentialId::next(VendorWorkingHour::class, 'vwh'),
                    'vendor_id' => $vendor->id,
                    'day_of_week' => $entry['day_of_week'],
                    'start_time' => $entry['start_time'],
                    'end_time' => $entry['end_time'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Seeded default working hours for demo vendor.');
    }
}
