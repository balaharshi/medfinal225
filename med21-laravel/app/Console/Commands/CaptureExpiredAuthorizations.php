<?php

namespace App\Console\Commands;

use App\Models\AuthTransaction;
use App\Services\EnbdpayService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CaptureExpiredAuthorizations extends Command
{
    protected $signature = 'payments:capture-expired';

    protected $description = 'Auto-capture AUTH transactions that have passed the 24-hour window';

    public function handle(EnbdpayService $enbdpayService): int
    {
        $expiredAuths = AuthTransaction::readyToCapture()->get();

        if ($expiredAuths->isEmpty()) {
            $this->info('No expired AUTH transactions found.');
            return self::SUCCESS;
        }

        $this->info("Found {$expiredAuths->count()} expired AUTH transactions to capture.");

        $successCount = 0;
        $failCount = 0;

        foreach ($expiredAuths as $auth) {
            try {
                $this->line("Capturing: {$auth->app_utr} (AED {$auth->authorized_amount})");

                $result = $enbdpayService->captureTransaction([
                    'transactionUtr' => $auth->transaction_utr,
                    'appUtr' => $auth->app_utr,
                    'orderId' => $auth->order_id,
                ]);

                $auth->update([
                    'status' => 'CAPTURED',
                    'captured_amount' => $auth->authorized_amount,
                    'captured_at' => now(),
                ]);

                Log::info('AUTH transaction auto-captured', [
                    'appUtr' => $auth->app_utr,
                    'orderId' => $auth->order_id,
                    'amount' => $auth->authorized_amount,
                ]);

                $successCount++;
                $this->info("  ✓ Captured successfully");
            } catch (\Exception $e) {
                $failCount++;
                $this->error("  ✗ Failed: {$e->getMessage()}");
                Log::error('AUTH auto-capture failed', [
                    'appUtr' => $auth->app_utr,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Done. Captured: {$successCount}, Failed: {$failCount}");
        return $failCount > 0 ? self::FAILURE : self::SUCCESS;
    }
}
