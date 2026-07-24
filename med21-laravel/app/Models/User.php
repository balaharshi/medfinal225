<?php

namespace App\Models;

use App\Models\Concerns\UsesStringPrimaryKey;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use UsesStringPrimaryKey;

    protected $fillable = [
        'id', 'username', 'email', 'full_name', 'phone', 'address',
        'password_hash', 'role', 'vendor_id', 'is_active',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function getAuthPassword(): string
    {
        return (string) $this->password_hash;
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function referralCode(): HasOne
    {
        return $this->hasOne(ReferralCode::class);
    }
}
