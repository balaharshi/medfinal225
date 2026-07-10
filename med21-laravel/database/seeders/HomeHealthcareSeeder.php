<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Vendor;
use App\Models\VendorServiceAssignment;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class HomeHealthcareSeeder extends Seeder
{
    use FormatsTitles;
    private const SUBCATEGORY_MAP = [
        'Nursing care at Home' => 'nursing-care-at-home',
        'Long Term Specialised care' => 'long-term-specialized-care',
        'Doctor on Call' => 'doctor-on-call',
        'Physiotherapy at home' => 'physiotherapy-at-home',
        'Speech and Language Therapy' => 'speech-and-language-therapy',
        'Occupational Therapy' => 'occupational-therapy',
    ];

    private const CATEGORY_MAP = [
        'Nursing care at Home' => 'home-healthcare',
        'Long Term Specialised care' => 'long-term-care',
        'Doctor on Call' => 'doctor-on-call',
        'Physiotherapy at home' => 'physiotherapy',
        'Speech and Language Therapy' => 'speech-therapy',
        'Occupational Therapy' => 'occupational-therapy',
    ];

    private const CATEGORY_IMAGES = [
        'nursing-care-at-home' => '/images/services/Generic Nurse Visit.jpg',
        'long-term-specialized-care' => '/images/services/DHA Nurse.jpg',
        'doctor-on-call' => '/images/services/Doctor at Home.jpg',
        'physiotherapy-at-home' => '/images/services/physiotherapy_session.jpg',
        'speech-and-language-therapy' => '/images/services/speech_therapy_session.jpg',
        'occupational-therapy' => '/images/services/occupational_therapy_session.jpg',
    ];

    private function resolveImage(string $title, string $subcat): string
    {
        // Map specific titles to their images
        $titleMap = [
            'Generic Nurse Visit' => '/images/services/Generic Nurse Visit.jpg',
            'Wound care and Surgical Dressing-Small' => '/images/services/Wound Care and Surgical Dressing-Small.jpg',
            'Wound care and Surgical Dressing-Medium' => '/images/services/Wound Care and Surgical Dressing-Medium.jpg',
            'Wound care and Surgical Dressing-Large' => '/images/services/Wound Care and Surgical Dressing-Large.jpg',
            'Catheterisation at home' => '/images/services/Catheterisation at home (Female).jpg',
            'IV antibiotics at home (with Dr Prescription)' => '/images/services/IV antibiotics at home (with Dr Prescription).jpg',
            'Doctor at Home' => '/images/services/Doctor at Home.jpg',
            'Doctor at Hotel' => '/images/services/Doctor at Hotel.jpg',
            'Physiotherapy-1 Hour Session' => '/images/services/physiotherapy_session.jpg',
            'Physiotherapy-1 Hour Session/Week (6 Sessions)' => '/images/services/physiotherapy_session.jpg',
            'Speech and Language Therapy' => '/images/services/speech_therapy_session.jpg',
            'Occupational Therapy' => '/images/services/occupational_therapy_session.jpg',
        ];
        if (isset($titleMap[$title])) return $titleMap[$title];
        if (str_starts_with($title, 'DHA Registered Nurse')) return '/images/services/DHA Nurse.jpg';
        if (str_starts_with($title, 'Care Giver')) return '/images/services/Caregiver.jpg';
        return '/images/services/Generic Nurse Visit.jpg';
    }

    public function run(): void
    {
        $demoVendor = Vendor::firstOrCreate(
            ['email' => 'vendor@medzivahealthcare.com'],
            ['id' => 'v-demo', 'name' => 'Demo Vendor', 'type' => 'Healthcare Provider', 'address' => 'Dubai', 'active' => true]
        );

        $services = [
            // Nursing care at Home
            ['sub' => 'Nursing care at Home', 'name' => 'Generic Nurse Visit', 'mrp' => 250, 'desc' => 'Expert nursing support brought to you — routine care, recovery assistance, and health monitoring, all in one visit.'],
            ['sub' => 'Nursing care at Home', 'name' => 'Wound care and Surgical Dressing-Small', 'mrp' => 500, 'desc' => 'Precise, hygienic care for minor wounds and small surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.'],
            ['sub' => 'Nursing care at Home', 'name' => 'Wound care and Surgical Dressing-Medium', 'mrp' => 650, 'desc' => 'Precise, hygienic care for minor wounds and medium surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.'],
            ['sub' => 'Nursing care at Home', 'name' => 'Wound care and Surgical Dressing-Large', 'mrp' => 1000, 'desc' => 'Precise, hygienic care for minor wounds and large surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.'],
            ['sub' => 'Nursing care at Home', 'name' => 'Catheterisation at home', 'mrp' => 850, 'desc' => 'Safe, sterile catheter insertion and care delivered in the comfort of your home — performed by a trained clinical nurse with full privacy, dignity, and clinical precision.'],
            ['sub' => 'Nursing care at Home', 'name' => 'IV antibiotics at home (with Dr Prescription)', 'mrp' => 750, 'desc' => 'Complete your antibiotic course from the comfort of home — a qualified nurse administers your prescribed IV treatment safely and efficiently, so you recover without the hospital stay.'],

            // Long Term Specialised care
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-24 Hours Live In (30 Days, 1 Staff)', 'mrp' => 25000, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-24 Hours Live In (30 Days, 2 Staff)', 'mrp' => 30000, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-12 Hours (30 Days, 1 Staff)', 'mrp' => 15000, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-8 Hours (30 Days, 1 Staff)', 'mrp' => 10000, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-Less Than 12 Hours/Day (30 Days, 1 Staff)', 'mrp' => 13000, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-24 Hours Live In (1 Day, 1 Staff)', 'mrp' => 1500, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-24 Hours Live In (1 Day, 2 Staff)', 'mrp' => 2500, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'DHA Registered Nurse-12 Hours (1 Day, 1 Staff)', 'mrp' => 1000, 'desc' => 'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'Care Giver-24 Hours Live In (30 Days, 1 Staff)', 'mrp' => 17000, 'desc' => 'Continuous, compassionate support from a live-in caregiver — helping with daily activities, mobility, and wellbeing, day and night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'Care Giver-24 Hours Live In (30 Days, 2 Staff)', 'mrp' => 25000, 'desc' => 'Continuous, compassionate support from a live-in caregiver — helping with daily activities, mobility, and wellbeing, day and night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'Care Giver-12 Hours (30 Days, 1 Staff)', 'mrp' => 12000, 'desc' => 'Continuous, compassionate support from a live-in caregiver — helping with daily activities, mobility, and wellbeing, day and night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'Care Giver-Less Than 12 Hours/Day (30 Days, 1 Staff)', 'mrp' => 11000, 'desc' => 'Continuous, compassionate support from a live-in caregiver — helping with daily activities, mobility, and wellbeing, day and night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'Care Giver-24 Hours Live In (1 Day, 1 Staff)', 'mrp' => 850, 'desc' => 'Continuous, compassionate support from a live-in caregiver — helping with daily activities, mobility, and wellbeing, day and night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'Care Giver-24 Hours Live In (1 Day, 2 Staff)', 'mrp' => 1050, 'desc' => 'Continuous, compassionate support from a live-in caregiver — helping with daily activities, mobility, and wellbeing, day and night.'],
            ['sub' => 'Long Term Specialised care', 'name' => 'Care Giver-12 Hours (1 Day, 1 Staff)', 'mrp' => 700, 'desc' => 'Continuous, compassionate support from a live-in caregiver — helping with daily activities, mobility, and wellbeing, day and night.'],

            // Doctor on Call
            ['sub' => 'Doctor on Call', 'name' => 'Doctor at Home', 'mrp' => 500, 'desc' => 'A qualified doctor visits you for consultations, diagnosis, and treatment — no waiting rooms, no commute.'],
            ['sub' => 'Doctor on Call', 'name' => 'Doctor at Hotel', 'mrp' => 1000, 'desc' => 'A qualified doctor brought to your hotel — expert diagnosis and treatment, right where you are in the city.'],

            // Physiotherapy at home
            ['sub' => 'Physiotherapy at home', 'name' => 'Physiotherapy-1 Hour Session', 'mrp' => 400, 'desc' => 'A dedicated hour with a certified physiotherapist to assess, treat, and rehabilitate — helping you move better, recover faster.'],
            ['sub' => 'Physiotherapy at home', 'name' => 'Physiotherapy-1 Hour Session/Week (6 Sessions)', 'mrp' => 2000, 'desc' => 'A dedicated hour with a certified physiotherapist to assess, treat, and rehabilitate — helping you move better, recover faster.'],

            // Speech and Language Therapy
            ['sub' => 'Speech and Language Therapy', 'name' => 'Speech and Language Therapy', 'mrp' => 400, 'desc' => 'Structured sessions addressing speech delays, articulation challenges, and swallowing difficulties — delivered by a qualified speech and language specialist.'],

            // Occupational Therapy
            ['sub' => 'Occupational Therapy', 'name' => 'Occupational Therapy', 'mrp' => 400, 'desc' => 'Practical, goal-driven sessions helping you regain independence in daily tasks — from fine motor skills and cognitive function to adaptive techniques for work, home, and life.'],
        ];

        foreach ($services as $index => $data) {
            $subcatSlug = self::SUBCATEGORY_MAP[$data['sub']];
            $slug = Str::slug($this->fmt($data['name'])) . '-' . ($index + 1);
            $service = Service::firstOrNew(['slug' => $slug]);
            if (! $service->exists) {
                $service->id = SequentialId::next(Service::class, 'srv');
            }

            $service->fill([
                'title' => $this->fmt($data['name']),
                'slug' => $slug,
                'category' => self::CATEGORY_MAP[$data['sub']],
                'subcategory' => $subcatSlug,
                'status' => 'active',
                'active' => true,
                'price' => $data['mrp'],
                'original_price' => $data['mrp'],
                'sale_price' => 0,
                'currency' => 'AED',
                'home_visit_fee_included' => true,
                'duration' => '1 Session',
                'estimated_visit_time' => '',
                'image' => $this->resolveImage($data['name'], $subcatSlug),
                'short_description' => $data['desc'],
                'full_description' => $data['desc'],
                'description' => $data['desc'],
                'inclusions' => [],
                'preparation_instructions' => '',
                'who_is_it_for' => '',
                'service_location' => 'at-home',
                'availability' => '',
                'tags' => [$subcatSlug, 'home-healthcare'],
                'display_priority' => $index + 1,
                'seo_title' => $data['name'] . ' - MedZiva',
                'seo_description' => $data['desc'],
                'popular' => in_array($data['name'], ['Generic Nurse Visit', 'Physiotherapy-1 Hour Session', 'Doctor at Home']),
                'enquiry_only' => false,
                'attributes' => [],
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

        $this->command->info('Seeded ' . count($services) . ' home healthcare services.');
    }
}
