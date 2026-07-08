<?php

namespace App\Models;

class Product extends BaseModel
{
    protected $fillable = [
        'name', 'subtitle', 'price', 'original_price', 'image', 'category',
        'subcategory', 'brand', 'rating', 'in_stock', 'description',
        'attributes', 'vendor_prices',
    ];

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
