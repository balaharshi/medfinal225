<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends BaseModel
{
    protected $fillable = [
        'id', 'wallet_id', 'type', 'amount',
        'balance_before', 'balance_after', 'description',
        'reference_type', 'reference_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'balance_before' => 'integer',
            'balance_after' => 'integer',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }
}
