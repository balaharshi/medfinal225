<?php

namespace App\Console\Commands;

use App\Services\EnbdpayService;
use Illuminate\Console\Command;

class UatTransactionTest extends Command
{
    protected $signature = 'uat:test-transactions';

    protected $description = 'Run all 6 ENBDpay UAT test transaction scenarios';

    private EnbdpayService $enbdpay;

    public function __construct(EnbdpayService $enbdpay)
    {
        parent::__construct();
        $this->enbdpay = $enbdpay;
    }

    public function handle(): int
    {
        $this->info('===========================================');
        $this->info(' ENBDpay UAT Test Transaction Suite');
        $this->info('===========================================');
        $this->newLine();

        $this->info('ENBDpay accepts only: AUTH and PURCHASE');
        $this->info('Mapping from UAT matrix:');
        $this->info('  SALE         -> PURCHASE');
        $this->info('  AUTH_ONLY    -> AUTH');
        $this->info('  AUTH+capture -> AUTH + /capture');
        $this->newLine();

        $customer = [
            'fullName' => 'UAT Test Customer',
            'email' => 'uat@medzivahealthcare.com',
            'phone' => '500000000',
            'address' => 'Dubai, UAE',
        ];

        $results = [];

        // 1. Direct sale (PURCHASE) - 100 AED
        $results[] = $this->runScenario(1, 'Direct sale transaction - card', 100, 'PURCHASE', null, null, $customer);

        // 2. Auth-only (AUTH) - 200 AED
        $results[] = $this->runScenario(2, 'Auth-only - funds held', 200, 'AUTH', null, null, $customer);

        // 3. Auth first, then capture - 150 AED
        $results[] = $this->runScenario(3, 'Auth first, then capture', 150, 'AUTH', 'capture', 150, $customer);

        // 4. Auth 500, then capture partial - 500 AED
        $results[] = $this->runScenario(4, 'Auth 500, then capture partial', 500, 'AUTH', 'capture', 250, $customer);

        // 5. Purchase, then refund partial - 400 AED
        $results[] = $this->runScenario(5, 'Purchase, then refund partial', 400, 'PURCHASE', 'refund', 200, $customer);

        // 6. Purchase, then full refund - 250 AED
        $results[] = $this->runScenario(6, 'Purchase, then full refund', 250, 'PURCHASE', 'refund', 250, $customer);

        $this->newLine();
        $this->info('===========================================');
        $this->info(' RESULTS SUMMARY');
        $this->info('===========================================');
        $this->newLine();

        $this->table(
            ['S.No', 'Scenario', 'Amount', 'Type', 'Checkout Status', 'appUtr', 'redirectUrl'],
            collect($results)->map(fn($r) => [
                $r['scenario'],
                $r['description'],
                $r['amount'] . ' AED',
                $r['txnType'],
                $r['checkoutStatus'],
                $r['appUtr'] ?? 'N/A',
                $r['redirectUrl'] ?? 'N/A',
            ])->toArray()
        );

        $this->newLine();
        $this->info('===========================================');
        $this->info(' NEXT STEPS');
        $this->info('===========================================');
        $this->newLine();
        $this->info('1. Open each redirect URL above in a browser');
        $this->info('2. Complete payment using test card:');
        $this->info('   Card: 520473160013612');
        $this->info('   Expiry: 12/30');
        $this->info('   CVV: 123');
        $this->newLine();
        $this->info('3. After completing each payment, run:');
        $this->info('   php artisan uat:check-status');
        $this->newLine();
        $this->info('4. Then run follow-up operations (capture/refund):');
        $this->info('   php artisan uat:follow-up');
        $this->newLine();
        $this->info('5. Check ENBDpay dashboard to verify all transactions');

        return Command::SUCCESS;
    }

    private function runScenario(int $num, string $description, float $amount, string $txnType, ?string $followUp, ?float $followUpAmount, array $customer): array
    {
        $this->info("Scenario {$num}: {$description} ({$amount} AED)");
        $this->line("  ENBDpay type: {$txnType}");

        try {
            $checkout = $this->enbdpay->createCheckoutTransaction([
                'amount' => $amount,
                'transactionType' => $txnType,
                'description' => "UAT Test #{$num} - {$description}",
                'source' => 'UAT',
                'category' => 'Test',
                'customer' => $customer,
            ]);

            $appUtr = $checkout['appUtr'] ?? 'N/A';
            $orderId = $checkout['orderId'] ?? 'N/A';
            $redirectUrl = $checkout['redirectUri'] ?? 'N/A';
            $txnUtr = $checkout['transactionUtr'] ?? null;
            $status = $checkout['responseStatus'] ?? 'UNKNOWN';

            $this->info("  appUtr:        {$appUtr}");
            $this->info("  orderId:       {$orderId}");
            $this->info("  transactionUtr: " . ($txnUtr ?: 'pending payment'));
            $this->info("  status:        {$status}");
            $this->line("  redirectUrl:   {$redirectUrl}");
            $this->newLine();

            return [
                'scenario' => $num,
                'description' => $description,
                'amount' => $amount,
                'txnType' => $txnType,
                'appUtr' => $appUtr,
                'orderId' => $orderId,
                'transactionUtr' => $txnUtr,
                'redirectUrl' => $redirectUrl,
                'checkoutStatus' => $status,
                'followUp' => $followUp,
                'followUpAmount' => $followUpAmount,
            ];

        } catch (\Exception $e) {
            $this->error("  ERROR: {$e->getMessage()}");
            $this->newLine();

            return [
                'scenario' => $num,
                'description' => $description,
                'amount' => $amount,
                'txnType' => $txnType,
                'appUtr' => null,
                'orderId' => null,
                'transactionUtr' => null,
                'redirectUrl' => null,
                'checkoutStatus' => 'FAILED',
                'followUp' => null,
                'followUpAmount' => null,
            ];
        }
    }
}
