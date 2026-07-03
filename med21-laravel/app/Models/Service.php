<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends BaseModel
{
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
