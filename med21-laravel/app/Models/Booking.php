<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends BaseModel
{
    protected $fillable = [
        'id',
        'customer_name', 'customer_email', 'customer_phone', 'service_title',
        'vendor_name', 'vendor_id', 'service_id', 'category', 'subcategory', 'price', 'date', 'time_slot',
        'region', 'status', 'payment_status', 'payment_provider', 'payment_app_utr',
        'payment_order_id', 'payment_transaction_utr', 'payment_response_status',
            'payment_group_id',
            'paid_at', 'payment_captured_at', 'notes', 'accepted_at', 'completed_at', 'expires_at',
            'cost', 'reschedule_count', 'wallet_amount', 'wallet_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
            'cost' => 'integer',
            'wallet_amount' => 'integer',
            'payment_captured_at' => 'datetime',
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
