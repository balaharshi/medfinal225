<?php

namespace App\Models;

class Product extends BaseModel
{
    protected function casts(): array
    {
        return [
            'in_stock' => 'boolean',
            'rating' => 'float',
            'attributes' => 'array',
            'vendor_prices' => 'array',
        ];
    }
}
