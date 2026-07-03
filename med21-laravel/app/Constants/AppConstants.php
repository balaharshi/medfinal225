<?php

namespace App\Constants;

final class AppConstants
{
    public const USER_ROLES = [
        'SUPER_ADMIN' => 'super_admin',
        'ADMIN' => 'admin',
        'VENDOR' => 'vendor',
        'STAFF' => 'staff',
        'CUSTOMER' => 'customer',
    ];

    public const BOOKING_STATUSES = [
        'PENDING' => 'Pending',
        'ACTIVE' => 'Active',
        'COMPLETED' => 'Completed',
        'CANCELLED' => 'Canceled',
    ];

    public const PAYMENT_STATUSES = [
        'UNPAID' => 'Unpaid',
        'PENDING' => 'Pending',
        'PAID' => 'Paid',
        'FAILED' => 'Failed',
        'CANCELLED' => 'Canceled',
    ];

    public const ENQUIRY_STATUSES = [
        'PENDING_RESPONSE' => 'Pending Response',
        'ANSWERED' => 'Answered',
    ];

    public const DEFAULT_SETTINGS_KEY = 'config';
}
