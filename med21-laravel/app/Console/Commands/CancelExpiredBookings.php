<?php

namespace App\Console\Commands;

use App\Constants\AppConstants;
use App\Models\AuthTransaction;
use App\Models\Booking;
use App\Services\EnbdpayService;
use Illuminate\Console\Command;

class CancelExpiredBookings extends Command
{
    protected $signature = 'bookings:cancel-expired';

    protected $description = 'Cancel pending bookings that have passed their expiry time';

    public function handle(EnbdpayService $enbdpay): int
    {
        $expired = Booking::query()
            ->where('expires_at', '<=', now())
            ->where('status', AppConstants::BOOKING_STATUSES['PENDING'])
            ->whereNull('vendor_id')
            ->get();

        if ($expired->isEmpty()) {
            $this->info('No expired bookings found.');
            return self::SUCCESS;
        }

        $cancelled = 0;
        $voidedPayment = 0;

        foreach ($expired as $booking) {
            $booking->update([
                'status' => AppConstants::BOOKING_STATUSES['CANCELLED'],
            ]);
            $cancelled++;

            // Void any authorized but uncaptured payment
            $authTransaction = AuthTransaction::query()
                ->where('booking_id', $booking->id)
                ->where('status', 'AUTHORIZED')
                ->whereNull('voided_at')
                ->first();

            if ($authTransaction) {
                try {
                    $enbdpay->voidAuthorization([
                        'transactionUtr' => $authTransaction->transaction_utr,
                        'appUtr' => $authTransaction->app_utr,
                        'orderId' => $authTransaction->order_id,
                    ]);
                    $authTransaction->update([
                        'status' => 'VOIDED',
                        'voided_at' => now(),
                    ]);
                    $voidedPayment++;
                } catch (\Throwable $e) {
                    $this->warn("Failed to void payment for booking {$booking->id}: {$e->getMessage()}");
                }
            }

            $this->sendExpiryNotification($booking);
        }

        $this->info("Cancelled {$cancelled} expired booking(s), voided {$voidedPayment} payment authorization(s).");
        return self::SUCCESS;
    }

    private function sendExpiryNotification(Booking $booking): void
    {
        try {
            $email = $booking->customer_email;
            if (! $email || $email === 'guest@example.com') {
                return;
            }

            \Mail::to($email)->send(new \App\Mail\BookingExpired(
                \App\Support\CaseKeys::camelize($booking->toArray())
            ));
        } catch (\Throwable $e) {
            \Log::error('Failed to send booking expiry email: ' . $e->getMessage());
        }
    }
}
