<?php

namespace App\Models;

class VendorProfileChangeRequest extends BaseModel
{
    protected $fillable = [
        'id', 'vendor_id',
        'field_name',
        'current_value',
        'requested_value',
        'reason',
        'status',
        'admin_remarks',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
