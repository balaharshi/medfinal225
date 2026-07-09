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

    /**
     * Role hierarchy: higher index = more privileged.
     * Super Admin (index 0) can delete anyone.
     * Admin (index 1) can delete Admin(1), Vendor(2), Staff(3), Customer(4) — but NOT Super Admin(0).
     */
    public const ROLE_HIERARCHY = [
        'super_admin' => 0,
        'admin'       => 1,
        'vendor'      => 2,
        'staff'       => 3,
        'customer'    => 4,
    ];

    /**
     * Check if $actorRole can perform privileged action on $targetRole.
     * Actor can target anyone at same or lower privilege (higher index).
     */
    public static function canManageRole(string $actorRole, string $targetRole): bool
    {
        $actorLevel = self::ROLE_HIERARCHY[$actorRole] ?? 99;
        $targetLevel = self::ROLE_HIERARCHY[$targetRole] ?? 99;

        return $actorLevel <= $targetLevel;
    }

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
