<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Vendor;
use App\Models\VendorServiceAssignment;
use App\Support\SequentialId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LabTestSeeder extends Seeder
{
    use FormatsTitles;
    public function run(): void
    {
        $demoVendor = Vendor::firstOrCreate(
            ['email' => 'vendor@medzivahealthcare.com'],
            ['id' => 'v-demo', 'name' => 'Demo Vendor', 'type' => 'Healthcare Provider', 'address' => 'Dubai', 'active' => true]
        );

        $services = [
            // Routine Blood Tests
            ['sub' => 'routine-blood-tests', 'name' => 'Lipid Profile', 'mrp' => 120, 'who' => 'Cholesterol check, heart risk assessment', 'prep' => '9-12 hrs fasting preferred', 'results' => '24 hrs', 'includes' => 'Cholesterol, HDL, LDL, Triglycerides, HDL/Cholesterol Ratio'],
            ['sub' => 'routine-blood-tests', 'name' => 'Liver Function Test', 'mrp' => 200, 'who' => 'Liver health, fatigue, alcohol use, medication monitoring', 'prep' => 'No fasting required', 'results' => '24 hrs', 'includes' => 'ALT, AST, Bilirubin, Albumin, ALP'],
            ['sub' => 'routine-blood-tests', 'name' => 'Kidney Function Test', 'mrp' => 199, 'who' => 'Diabetes, hypertension, swelling, fatigue, kidney monitoring', 'prep' => 'No fasting required, Stay hydrated, Inform meds', 'results' => '24 hrs', 'includes' => 'Creatinine, Urea, eGFR, Uric Acid, Electrolytes'],
            ['sub' => 'routine-blood-tests', 'name' => 'Thyroid Function Test', 'mrp' => 120, 'who' => 'Weight changes, fatigue, hair fall, thyroid monitoring', 'prep' => 'No fasting required, Morning sample preferred, Inform meds', 'results' => '24 hrs', 'includes' => 'TSH, T3, T4'],

            // Preventive Health Packages
            ['sub' => 'preventive-health-packages', 'name' => 'Anemia Profile', 'mrp' => 249, 'who' => 'Fatigue, weakness, hair fall, suspected anemia', 'prep' => 'No fasting required, Stay hydrated', 'results' => '24-48 hrs', 'includes' => 'Vitamin D Total, CBC, Iron, TIBC, Ferritin, Vitamin B12, Folic Acid'],
            ['sub' => 'preventive-health-packages', 'name' => 'Advanced Anaemic Profile', 'mrp' => 349, 'who' => 'Individuals with suspected anemia or fatigue', 'prep' => 'No fasting required', 'results' => 'Same day / Next day', 'includes' => 'Peripheral Smear, CBC (19), Ferritin, Folate, Stool (14), UIBC, Urinalysis (21), Vitamin B12, Iron Studies'],
            ['sub' => 'preventive-health-packages', 'name' => 'Hair Health Essential', 'mrp' => 249, 'who' => 'Hair fall, thinning hair, fatigue, nutritional deficiencies', 'prep' => 'No fasting required, Stay hydrated, Inform meds', 'results' => '24-48 hrs', 'includes' => 'CBC, Vitamin D, Vitamin B12, Zinc, Iron, TSH'],
            ['sub' => 'preventive-health-packages', 'name' => 'Advanced Hair Loss Profile', 'mrp' => 350, 'who' => 'Adults experiencing hair fall or thinning', 'prep' => '8-10 hrs fasting (water allowed)', 'results' => 'Same day / Next day', 'includes' => 'CBC (19), Ferritin, Iron, Zinc, Testosterone (Total), TSH, Vitamin D Total, Vitamin B12, Folate'],
            ['sub' => 'preventive-health-packages', 'name' => 'Mini Health Check Profile', 'mrp' => 200, 'who' => 'Adults for routine preventive health screening', 'prep' => '8-10 hrs fasting (water allowed)', 'results' => '24-48 hrs', 'includes' => 'ALT/GPT, AST/GOT, Calcium, Cholesterol, CBC (19), Creatinine, ESR, GFR, Glucose (R), TSH, Urea, Uric Acid, Vitamin D Total'],
            ['sub' => 'preventive-health-packages', 'name' => 'Basic Health Check Profile', 'mrp' => 325, 'who' => 'Adults for routine preventive health screening', 'prep' => '8-10 hrs fasting (water allowed)', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Advanced Health Check Profile (86 Parameters)', 'mrp' => 420, 'who' => 'Adults for comprehensive annual health screening', 'prep' => '8-10 hrs fasting (water allowed)', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Bone Health Profile', 'mrp' => 150, 'who' => 'Bone pain, vitamin D deficiency, osteoporosis risk', 'prep' => 'No fasting required', 'results' => '24 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Diabetic Profile', 'mrp' => 320, 'who' => 'Diabetes screening and monitoring', 'prep' => '8-10 hrs fasting required', 'results' => '24 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Child Health Check Package (71 Parameters)', 'mrp' => 295, 'who' => 'Children for routine health screening', 'prep' => 'No fasting required', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Fitness Profile', 'mrp' => 249, 'who' => 'Active individuals for fitness monitoring', 'prep' => '8-10 hrs fasting required', 'results' => '24 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Master Health Checkup (92 Parameters)', 'mrp' => 800, 'who' => 'Comprehensive annual health screening', 'prep' => '10-12 hrs fasting required', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Obesity Profile', 'mrp' => 499, 'who' => 'Weight management and obesity assessment', 'prep' => '8-10 hrs fasting required', 'results' => '24 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Arthritic Profile', 'mrp' => 620, 'who' => 'Joint pain, arthritis screening', 'prep' => 'No fasting required', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Cardiac Profile', 'mrp' => 750, 'who' => 'Heart risk assessment, chest pain, family history', 'prep' => '10-12 hrs fasting required', 'results' => '24 hrs', 'includes' => ''],
            ['sub' => 'preventive-health-packages', 'name' => 'Pre-Marital Health Check-up Profile (Couples)', 'mrp' => 520, 'who' => 'Couples planning marriage', 'prep' => 'No fasting required', 'results' => '24-48 hrs', 'includes' => ''],

            // Men's Health
            ['sub' => 'mens-health-packages', 'name' => 'Male Infertility Profile', 'mrp' => 449, 'who' => 'Men undergoing fertility evaluation', 'prep' => '2-5 days abstinence required (for semen analysis)', 'results' => 'Same day / Next day', 'includes' => 'FSH, Prolactin, LH, Testosterone (Free & Total), CBC (19), Lipid Profile, Thyroid Profile, Thyroid Antibodies, Semen Analysis (20)'],
            ['sub' => 'mens-health-packages', 'name' => 'Preventive Health Checkup-Male (100 parameters)', 'mrp' => 1299, 'who' => 'Men aged 30+ for comprehensive annual health screening', 'prep' => 'Fasting required (10-12 hours)', 'results' => 'Same day / Next day', 'includes' => 'Apolipoprotein A1 & B, CBC (19), hsCRP, CKMB, Fasting & PP Glucose, HbA1c, HBsAg, HCV Ab, HIV Combo, Homocysteine, Microalbumin/Creatinine Ratio, fPSA, UIBC, Urinalysis (21), Kidney & Liver Function (18), Lipid Profile (5), Transferrin Saturation (3), Ionized Calcium, GFR, Bicarbonate, CEA'],

            // Women's Health
            ['sub' => 'womens-health-packages', 'name' => 'Menopause Profile', 'mrp' => 399, 'who' => 'Women with menopausal symptoms or hormonal imbalance', 'prep' => 'No fasting required', 'results' => 'Same day / Next day', 'includes' => 'Glucose (R), CBC (19), Iron, Lipid Profile, Creatinine, Thyroid Profile, FSH, Prolactin, LH, beta-hCG, Estradiol (E2), Progesterone, LBC (Gynae), Urinalysis (21)'],
            ['sub' => 'womens-health-packages', 'name' => 'Pre-Marital Health Check-up Profile (Female)', 'mrp' => 449, 'who' => 'Women planning marriage or pre-conception screening', 'prep' => 'No fasting required', 'results' => 'Same day / Next day', 'includes' => 'CBC (19), HbA1c, Blood Group (ABO Rh), Lipid Profile, LFT, Thyroid Profile, HIV Combo, HBsAg, HCV Ab, RPR/VDRL, Urinalysis (21), Progesterone'],
            ['sub' => 'womens-health-packages', 'name' => 'Pregnancy Profile', 'mrp' => 690, 'who' => 'Pregnant women or those planning a pregnancy', 'prep' => 'Fasting required for glucose tests (8-10 hours)', 'results' => 'Same day / Next day', 'includes' => ''],
            ['sub' => 'womens-health-packages', 'name' => 'Cancer / Tumour Marker Profile (Female)', 'mrp' => 400, 'who' => 'Women seeking cancer screening or with family history', 'prep' => 'No fasting required', 'results' => '2-3 working days', 'includes' => 'AFP, Total HCG, CA 125 (Ovarian), CA 15.3 (Breast), CA 19.9 (Pancreatic), CEA, CBC (19), Liquid-Based Cytology'],
            ['sub' => 'womens-health-packages', 'name' => 'Preventive Health Checkup-Female (95 parameters)', 'mrp' => 1299, 'who' => 'Women aged 30+ for comprehensive annual health screening', 'prep' => 'Fasting required (10-12 hours)', 'results' => 'Same day / Next day', 'includes' => 'Apolipoprotein A1 & B, CA 125, CEA, CBC (19), hsCRP, CKMB, Fasting & PP Glucose, HbA1c, HBsAg, HCV Ab, HIV Combo, Homocysteine, Liquid-Based Cytology, Microalbumin/Creatinine Ratio, UIBC, Urinalysis (21), Kidney & Liver Function (18), Lipid Profile (5), Transferrin Saturation (3)'],
            ['sub' => 'womens-health-packages', 'name' => 'Standard Women Wellness Package (56 parameters)', 'mrp' => 1100, 'who' => 'Women seeking broad hormonal, nutritional and cancer screening', 'prep' => 'Fasting required (10-12 hours)', 'results' => 'Same day / Next day', 'includes' => 'BhCG, Calcium, CA 125, CEA, DHEA-S, Estradiol (E2), FSH, Fasting & PP Glucose, HbA1c, Fasting Insulin, Liquid-Based Cytology, LH, Microalbumin/Creatinine Ratio, Phosphorus, Prolactin, Total Testosterone, UIBC, Vitamin D, Anaemia Profile I, Lipid Profile, Thyroid Profile, Transferrin Saturation'],
            ['sub' => 'womens-health-packages', 'name' => 'Female Infertility Profile', 'mrp' => 429, 'who' => 'Women experiencing difficulty conceiving', 'prep' => 'Test on Day 2-3 of menstrual cycle recommended; no fasting required', 'results' => '1-2 working days', 'includes' => ''],
            ['sub' => 'womens-health-packages', 'name' => 'Poly Cystic Ovary Syndrome (PCOS) Profile', 'mrp' => 720, 'who' => 'Women with suspected PCOS', 'prep' => 'Test on Day 2-3 of menstrual cycle recommended; no fasting required', 'results' => '1-2 working days', 'includes' => ''],

            // STD / Sexual Health
            ['sub' => 'std-sexual-health', 'name' => 'STD 4', 'mrp' => 300, 'who' => 'Basic STD screening', 'prep' => 'No fasting required', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'std-sexual-health', 'name' => 'STD 8', 'mrp' => 399, 'who' => 'Extended STD screening', 'prep' => 'No fasting required', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'std-sexual-health', 'name' => 'STD 16', 'mrp' => 850, 'who' => 'Comprehensive STD screening', 'prep' => 'No fasting required', 'results' => '24-48 hrs', 'includes' => ''],
            ['sub' => 'std-sexual-health', 'name' => 'STD 28', 'mrp' => 1200, 'who' => 'Full spectrum STD screening', 'prep' => 'No fasting required', 'results' => '24-48 hrs', 'includes' => ''],

            // Specialized Diagnostic Tests
            ['sub' => 'specialized-diagnostic-tests', 'name' => 'Gut Microbiome Test', 'mrp' => 2599, 'who' => 'Digestive health assessment', 'prep' => 'No fasting required', 'results' => '5-7 working days', 'includes' => ''],
            ['sub' => 'specialized-diagnostic-tests', 'name' => 'Comprehensive Allergy Test', 'mrp' => 1299, 'who' => 'Allergy screening', 'prep' => 'No fasting required', 'results' => '3-5 working days', 'includes' => ''],
            ['sub' => 'specialized-diagnostic-tests', 'name' => 'Food Intolerance Test', 'mrp' => 1199, 'who' => 'Food intolerance screening', 'prep' => 'No fasting required', 'results' => '3-5 working days', 'includes' => ''],

            // Genetic Testing
            ['sub' => 'genetic-testing', 'name' => 'DNA Ancestry Test', 'mrp' => 1500, 'who' => 'Ancestry and heritage', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Cross DNA Test', 'mrp' => 1500, 'who' => 'Paternity and relationship', 'prep' => 'No fasting required', 'results' => '5-7 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Health Test', 'mrp' => 1500, 'who' => 'Genetic health risk assessment', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Microbioma Oral Test', 'mrp' => 1500, 'who' => 'Oral microbiome analysis', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Nutrigenetics Test', 'mrp' => 1500, 'who' => 'Nutrition and genetics', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Pharmacogenomics plus Test', 'mrp' => 1500, 'who' => 'Drug response genetics', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Skin Care Test', 'mrp' => 1500, 'who' => 'Skin genetics', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Sports Test', 'mrp' => 1500, 'who' => 'Athletic performance genetics', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
            ['sub' => 'genetic-testing', 'name' => 'DNA Talent & Personality Test', 'mrp' => 1500, 'who' => 'Genetic talent assessment', 'prep' => 'No fasting required', 'results' => '10-15 working days', 'includes' => ''],
        ];

        foreach ($services as $index => $data) {
            $slug = Str::slug($data['name']) . '-' . ($index + 1);
            $service = Service::firstOrNew(['slug' => $slug]);
            if (! $service->exists) {
                $service->id = SequentialId::next(Service::class, 'srv');
            }

            $attributes = [];
            if (!empty($data['who'])) $attributes[] = ['label' => 'Who is it for?', 'value' => $data['who']];
            if (!empty($data['prep'])) $attributes[] = ['label' => 'Preparation', 'value' => $data['prep']];
            if (!empty($data['results'])) $attributes[] = ['label' => 'Results Time', 'value' => $data['results']];
            if (!empty($data['includes'])) $attributes[] = ['label' => 'Inclusions', 'value' => $data['includes']];

            $service->fill([
                'title' => $this->fmt($data['name']),
                'slug' => $slug,
                'category' => 'lab-tests-at-home',
                'subcategory' => $data['sub'],
                'status' => 'active',
                'active' => true,
                'price' => $data['mrp'],
                'original_price' => $data['mrp'],
                'sale_price' => 0,
                'currency' => 'AED',
                'home_visit_fee_included' => false,
                'duration' => '',
                'estimated_visit_time' => '',
                'image' => '/images/lab-tests/srv-lab-home-' . Str::slug(str_replace('&', 'and', $data['name'])) . '.jpg',
                'short_description' => $data['who'] ?: $data['name'],
                'full_description' => $data['name'],
                'description' => $data['name'],
                'inclusions' => [],
                'preparation_instructions' => $data['prep'] ?? '',
                'who_is_it_for' => $data['who'] ?? '',
                'service_location' => 'at-home',
                'availability' => '',
                'tags' => ['lab-test', $data['sub']],
                'display_priority' => $index + 1,
                'seo_title' => $data['name'] . ' - MedZiva',
                'seo_description' => $data['name'] . ' at home in Dubai',
                'popular' => false,
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

        $this->command->info('Seeded ' . count($services) . ' lab test services.');
    }
}
