<?php

namespace App\Models;

class PromoCode extends BaseModel
{
    protected $fillable = [
        'id', 'code', 'discount_percent', 'max_uses', 'uses', 'expires_at', 'active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
