<?php

namespace App\Models;

class Setting extends BaseModel
{
    protected $fillable = [
        'key', 'site_name', 'vat_percent', 'platform_fee_percent',
        'default_currency', 'support_email', 'service_regions',
        'maintenance_mode', 'admin_username',
    ];

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
