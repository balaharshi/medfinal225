<?php

namespace App\Console\Commands;

use App\Models\AuthTransaction;
use App\Models\Booking;
use App\Models\Wallet;
use App\Services\EnbdpayService;
use App\Services\WalletService;
use App\Support\CaseKeys;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CaptureExpiredAuthorizations extends Command
{
    protected $signature = 'payments:capture-expired';

    protected $description = 'Auto-capture AUTH transactions that have passed the 24-hour window and have vendor acceptance. Auto-void if no vendor accepted.';

    public function handle(EnbdpayService $enbdpayService, WalletService $walletService): int
    {
        $expiredAuths = AuthTransaction::readyToCapture()->get();

        if ($expiredAuths->isEmpty()) {
            $this->info('No expired AUTH transactions found.');
            return self::SUCCESS;
        }

        $this->info("Found {$expiredAuths->count()} expired AUTH transactions.");

        $captured = 0;
        $voided = 0;
        $failed = 0;

        foreach ($expiredAuths as $auth) {
            try {
                $bookings = $this->resolveBookings($auth);

                if ($bookings->isEmpty()) {
                    $this->warn("No bookings found for auth {$auth->app_utr}, voiding.");
                    $this->voidAuth($enbdpayService, $auth);
                    $voided++;
                    continue;
                }

                $allAccepted = $bookings->every(fn ($b) => in_array($b->status, ['Active', 'Completed'], true));
                $anyCancelled = $bookings->contains(fn ($b) => $b->status === 'Canceled');

                if ($allAccepted) {
                    $this->captureAuth($enbdpayService, $auth, $bookings);
                    $captured++;
                } elseif ($anyCancelled && $bookings->every(fn ($b) => $b->status === 'Canceled')) {
                    $this->voidAuth($enbdpayService, $auth);
                    $voided++;
                } else {
                    $this->voidAuthWithWalletCredit($enbdpayService, $walletService, $auth, $bookings);
                    $voided++;
                }
            } catch (\Exception $e) {
                $failed++;
                $this->error("Failed processing auth {$auth->app_utr}: {$e->getMessage()}");
                Log::error('AUTH processing failed', [
                    'appUtr' => $auth->app_utr,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Done. Captured: {$captured}, Voided: {$voided}, Failed: {$failed}");
        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function resolveBookings(AuthTransaction $auth): \Illuminate\Support\Collection
    {
        if ($auth->booking_id) {
            $booking = Booking::query()->find($auth->booking_id);
            return $booking ? collect([$booking]) : collect();
        }

        if ($auth->payment_group_id) {
            return Booking::query()
                ->where('payment_group_id', $auth->payment_group_id)
                ->get();
        }

        return collect();
    }

    private function captureAuth(EnbdpayService $enbdpayService, AuthTransaction $auth, $bookings): void
    {
        $this->line("Capturing: {$auth->app_utr} (AED {$auth->authorized_amount})");

        $enbdpayService->captureTransaction([
            'transactionUtr' => $auth->transaction_utr,
            'appUtr' => $auth->app_utr,
            'orderId' => $auth->order_id,
        ]);

        $auth->update([
            'status' => 'CAPTURED',
            'captured_amount' => $auth->authorized_amount,
            'captured_at' => now(),
        ]);

        foreach ($bookings as $booking) {
            $booking->forceFill([
                'payment_status' => 'Paid',
                'payment_captured_at' => now(),
            ])->save();
        }

        Log::info('AUTH transaction auto-captured', [
            'appUtr' => $auth->app_utr,
            'amount' => $auth->authorized_amount,
            'bookings' => $bookings->pluck('id')->all(),
        ]);

        $this->info("  ✓ Captured successfully");
    }

    private function voidAuth(EnbdpayService $enbdpayService, AuthTransaction $auth): void
    {
        $this->line("Voiding: {$auth->app_utr}");

        try {
            $enbdpayService->voidAuthorization([
                'transactionUtr' => $auth->transaction_utr,
                'appUtr' => $auth->app_utr,
                'orderId' => $auth->order_id,
            ]);
        } catch (\Exception $e) {
            $this->warn("Void API call failed (may already be voided): {$e->getMessage()}");
        }

        $auth->update([
            'status' => 'VOIDED',
            'voided_at' => now(),
        ]);

        Log::info('AUTH transaction auto-voided (no vendor accepted)', [
            'appUtr' => $auth->app_utr,
        ]);

        $this->info("  ✓ Voided");
    }

    private function voidAuthWithWalletCredit(EnbdpayService $enbdpayService, WalletService $walletService, AuthTransaction $auth, $bookings): void
    {
        $this->voidAuth($enbdpayService, $auth);

        foreach ($bookings as $booking) {
            $booking->forceFill([
                'payment_status' => 'Cancelled',
                'status' => 'Canceled',
            ])->save();

            try {
                $user = \App\Models\User::query()->where('email', $booking->customer_email)->first();
                if ($user) {
                    $wallet = Wallet::query()->where('user_id', $user->id)->first();
                    if ($wallet) {
                        $walletService->credit(
                            $wallet,
                            (int) $booking->price,
                            "Refund for cancelled booking {$booking->id} — no vendor available",
                            'booking',
                            $booking->id
                        );
                        $this->info("  Wallet credited AED {$booking->price} to {$user->email}");
                    }
                }
            } catch (\Exception $e) {
                $this->warn("Wallet credit failed: {$e->getMessage()}");
            }
        }
    }
}
