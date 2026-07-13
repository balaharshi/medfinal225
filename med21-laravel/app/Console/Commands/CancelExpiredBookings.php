<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Illuminate\Console\Command;

class CancelExpiredBookings extends Command
{
    protected $signature = 'bookings:cancel-expired';

    protected $description = 'Cancel bookings that have passed their expiry time';

    public function handle(): int
    {
        $expired = Booking::query()
            ->where('status', 'Pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update([
                'status' => 'Canceled',
                'updated_at' => now(),
            ]);

        if ($expired > 0) {
            $this->info("Canceled {$expired} expired booking(s).");
        } else {
            $this->info('No expired bookings found.');
        }

        return self::SUCCESS;
    }
}
