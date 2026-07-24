<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralCode extends BaseModel
{
    protected $fillable = [
        'id', 'user_id', 'code', 'times_used', 'max_uses', 'active',
    ];

    protected function casts(): array
    {
        return [
            'times_used' => 'integer',
            'max_uses' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }
}
