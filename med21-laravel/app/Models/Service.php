<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends BaseModel
{
    protected $fillable = [
        'title', 'slug', 'category', 'subcategory', 'status', 'active',
        'price', 'original_price', 'sale_price', 'currency',
        'home_visit_fee_included', 'duration', 'estimated_visit_time', 'image',
        'short_description', 'full_description', 'description', 'inclusions',
        'preparation_instructions', 'who_is_it_for', 'service_location',
        'availability', 'tags', 'display_priority', 'seo_title',
        'seo_description', 'popular', 'enquiry_only', 'attributes',
        'vendor_prices', 'booking_notice', 'remarks',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'home_visit_fee_included' => 'boolean',
            'popular' => 'boolean',
            'enquiry_only' => 'boolean',
            'inclusions' => 'array',
            'tags' => 'array',
            'attributes' => 'array',
            'vendor_prices' => 'array',
        ];
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(VendorServiceAssignment::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
