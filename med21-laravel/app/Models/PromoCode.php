<?php

namespace App\Models;

class PromoCode extends BaseModel
{
    protected $fillable = [
        'id', 'code', 'discount_percent', 'discount_type', 'discount_value',
        'max_discount', 'min_order', 'max_uses', 'uses', 'times_used',
        'expires_at', 'active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
