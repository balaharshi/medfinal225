<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referral extends BaseModel
{
    protected $fillable = [
        'id', 'referrer_id', 'referred_email', 'referred_user_id',
        'referral_code_id', 'status', 'referrer_reward',
        'referrer_reward_status', 'friend_discount',
        'friend_booking_id', 'vested_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'referrer_reward' => 'integer',
            'friend_discount' => 'integer',
            'vested_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function referralCode(): BelongsTo
    {
        return $this->belongsTo(ReferralCode::class);
    }

    public function friendBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'friend_booking_id');
    }
}
