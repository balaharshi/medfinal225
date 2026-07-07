<?php

namespace App\Console\Commands;

use App\Services\EnbdpayService;
use Illuminate\Console\Command;

class UatVoidAuth extends Command
{
    protected $signature = 'uat:void-auth';

    protected $description = 'Create AUTH transaction, complete payment, then void it';

    private EnbdpayService $enbdpay;

    public function __construct(EnbdpayService $enbdpay)
    {
        parent::__construct();
        $this->enbdpay = $enbdpay;
    }

    public function handle(): int
    {
        $this->info('Creating AUTH transaction for Void Authorization test...');
        $this->newLine();

        try {
            $checkout = $this->enbdpay->createCheckoutTransaction([
                'amount' => 300,
                'transactionType' => 'AUTH',
                'description' => 'UAT Void Authorization Test - 300 AED',
                'source' => 'UAT',
                'category' => 'Test',
                'customer' => [
                    'fullName' => 'UAT Void Auth Test',
                    'email' => 'uat@medzivahealthcare.com',
                    'phone' => '500000000',
                    'address' => 'Dubai, UAE',
                ],
            ]);

            $appUtr = $checkout['appUtr'];
            $orderId = $checkout['orderId'];
            $txnUtr = $checkout['transactionUtr'];
            $redirectUrl = $checkout['redirectUri'];

            $this->info("  appUtr: {$appUtr}");
            $this->info("  orderId: {$orderId}");
            $this->info("  transactionUtr: {$txnUtr}");
            $this->newLine();

            // Open in browser
            $os = PHP_OS_FAMILY;
            if ($os === 'Darwin') {
                exec("open " . escapeshellarg($redirectUrl));
            } elseif ($os === 'Windows') {
                exec("start " . escapeshellarg($redirectUrl));
            } else {
                exec("xdg-open " . escapeshellarg($redirectUrl));
            }

            $this->info("  Opening in browser...");
            $this->newLine();
            $this->info("  Card: 520473160013612");
            $this->info("  Expiry: 12/30");
            $this->info("  CVV: 123");
            $this->newLine();
            $this->info("  Complete payment, then press ENTER to void...");

            $this->ask('Press ENTER after completing payment to void');

            $this->newLine();
            $this->info("  Now voiding authorization...");

            $result = $this->enbdpay->voidAuthorization([
                'appUtr' => $appUtr,
                'orderId' => $orderId,
                'transactionUtr' => $txnUtr,
            ]);

            $this->newLine();
            $this->info("  Void result:");
            $this->info("  Status: {$result['responseStatus']}");
            $this->info("  Message: {$result['responseMessage']}");
            $this->newLine();
            $this->info("Check ENBDpay dashboard to verify the void.");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("  ERROR: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }
}
