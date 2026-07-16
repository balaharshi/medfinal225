<?php

namespace App\Models;

class Enquiry extends BaseModel
{
    protected $fillable = [
        'id', 'customer_name', 'customer_email', 'customer_phone', 'service_title',
        'message', 'contact_method', 'date', 'status',
    ];
}
