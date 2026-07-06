<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuthTransaction extends Model
{
    protected $fillable = [
        'booking_id',
        'app_utr',
        'order_id',
        'transaction_utr',
        'authorized_amount',
        'captured_amount',
        'status',
        'customer_name',
        'customer_email',
        'customer_phone',
        'authorized_at',
        'capture_deadline',
        'captured_at',
        'voided_at',
        'notes',
    ];

    protected $casts = [
        'authorized_amount' => 'decimal:2',
        'captured_amount' => 'decimal:2',
        'authorized_at' => 'datetime',
        'capture_deadline' => 'datetime',
        'captured_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    public function scopePending($query)
    {
        return $query->where('status', 'AUTHORIZED')
            ->where('capture_deadline', '>', now());
    }

    public function scopeReadyToCapture($query)
    {
        return $query->where('status', 'AUTHORIZED')
            ->where('capture_deadline', '<=', now());
    }

    public function isPending(): bool
    {
        return $this->status === 'AUTHORIZED' && $this->capture_deadline->isFuture();
    }

    public function isReadyToCapture(): bool
    {
        return $this->status === 'AUTHORIZED' && $this->capture_deadline->isPast();
    }

    public function hoursUntilCapture(): float
    {
        if ($this->status !== 'AUTHORIZED') {
            return 0;
        }

        return max(0, now()->diffInHours($this->capture_deadline, false));
    }
}
