<?php

$jsonPath = base_path('../med21/src/db.json');
$payload = json_decode(file_get_contents($jsonPath), true);

if (! is_array($payload) || ! isset($payload['services']) || ! is_array($payload['services'])) {
    throw new RuntimeException('Unable to read frontend services from db.json');
}

$now = now();
$serviceIds = collect($payload['services'])->pluck('id')->all();

DB::transaction(function () use ($payload, $serviceIds, $now): void {
    DB::table('vendor_service_assignments')
        ->whereNotIn('service_id', $serviceIds)
        ->delete();

    DB::table('services')
        ->whereNotIn('id', $serviceIds)
        ->delete();

    foreach ($payload['services'] as $index => $service) {
        DB::table('services')->updateOrInsert(
            ['id' => $service['id']],
            [
                'title' => $service['title'] ?? '',
                'slug' => Str::slug($service['title'] ?? $service['id']),
                'category' => $service['category'] ?? null,
                'subcategory' => $service['subcategory'] ?? null,
                'status' => 'active',
                'active' => true,
                'price' => $service['price'] ?? 0,
                'original_price' => $service['originalPrice'] ?? null,
                'sale_price' => null,
                'currency' => 'AED',
                'home_visit_fee_included' => false,
                'duration' => $service['duration'] ?? null,
                'estimated_visit_time' => null,
                'image' => $service['image'] ?? null,
                'short_description' => $service['shortDescription'] ?? null,
                'full_description' => $service['description'] ?? null,
                'description' => $service['description'] ?? null,
                'inclusions' => null,
                'preparation_instructions' => $service['prep'] ?? null,
                'who_is_it_for' => $service['who'] ?? null,
                'service_location' => null,
                'availability' => null,
                'tags' => null,
                'display_priority' => $index + 1,
                'seo_title' => null,
                'seo_description' => null,
                'popular' => (bool) ($service['popular'] ?? false),
                'enquiry_only' => (bool) ($service['enquiryOnly'] ?? false),
                'attributes' => json_encode($service['attributes'] ?? []),
                'vendor_prices' => json_encode($service['vendorPrices'] ?? []),
                'booking_notice' => $service['bookingNotice'] ?? null,
                'remarks' => $service['remarks'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }
});

echo json_encode([
    'services' => DB::table('services')->count(),
    'duplicates' => DB::table('services')
        ->select('title')
        ->groupBy('title')
        ->havingRaw('count(*) > 1')
        ->count(),
], JSON_PRETTY_PRINT);

