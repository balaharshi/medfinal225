<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends BaseModel
{
    protected $fillable = [
        'id', 'name', 'type', 'email', 'contact', 'rating', 'address',
        'commission', 'active', 'password_hash', 'logo',
    ];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'rating' => 'float',
            'commission' => 'float',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(VendorServiceAssignment::class);
    }
}
