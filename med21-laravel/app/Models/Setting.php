<?php

namespace App\Models;

class Setting extends BaseModel
{
    protected $primaryKey = 'key';

    protected function casts(): array
    {
        return [
            'service_regions' => 'array',
            'maintenance_mode' => 'boolean',
            'vat_percent' => 'float',
            'platform_fee_percent' => 'float',
        ];
    }
}
