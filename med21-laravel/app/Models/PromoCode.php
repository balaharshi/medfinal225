<?php

namespace App\Models;

class PromoCode extends BaseModel
{
    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
