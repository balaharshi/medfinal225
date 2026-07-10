<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorServiceAssignment extends BaseModel
{
    protected $fillable = ['id', 'vendor_id', 'service_id', 'enabled', 'vendor_price', 'commission_type', 'commission_value'];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'vendor_price' => 'integer',
            'commission_value' => 'float',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
