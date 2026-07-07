<?php

namespace App\Console\Commands;

use App\Services\EnbdpayService;
use Illuminate\Console\Command;

class UatSingleTransaction extends Command
{
    protected $signature = 'uat:pay {scenario?}';

    protected $description = 'Create and open a single UAT transaction in browser';

    private EnbdpayService $enbdpay;

    public function __construct(EnbdpayService $enbdpay)
    {
        parent::__construct();
        $this->enbdpay = $enbdpay;
    }

    public function handle(): int
    {
        $scenarios = [
            1 => ['Direct sale transaction - card', 100, 'PURCHASE', null, null],
            2 => ['Auth-only - funds held', 200, 'AUTH', null, null],
            3 => ['Auth first, then capture', 150, 'AUTH', 'capture', 150],
            4 => ['Auth 500, then capture partial', 500, 'AUTH', 'capture', 250],
            5 => ['Purchase, then refund partial', 400, 'PURCHASE', 'refund', 200],
            6 => ['Purchase, then full refund', 250, 'PURCHASE', 'refund', 250],
        ];

        $num = (int) $this->argument('scenario');

        if ($num && isset($scenarios[$num])) {
            return $this->runOne($num, $scenarios[$num]);
        }

        foreach ($scenarios as $num => $scenario) {
            $result = $this->runOne($num, $scenario);
            if ($result !== Command::SUCCESS) {
                return $result;
            }
            if ($num < 6) {
                $this->newLine();
                $this->info('Press ENTER to create next transaction...');
                $this->line('(Complete payment for the current one first)');
                $this->line('(Press CTRL+C to stop)');
                $this->newLine();
                $this->getLine(); // waits for ENTER
            }
        }

        $this->newLine();
        $this->info('All scenarios created. Run: php artisan uat:follow-up');
        return Command::SUCCESS;
    }

    private function runOne(int $num, array $scenario): int
    {
        [$description, $amount, $txnType, $followUp, $followUpAmount] = $scenario;

        $this->info("Creating Scenario {$num}: {$description} ({$amount} AED)...");

        try {
            $checkout = $this->enbdpay->createCheckoutTransaction([
                'amount' => $amount,
                'transactionType' => $txnType,
                'description' => "UAT Test #{$num} - {$description}",
                'source' => 'UAT',
                'category' => 'Test',
                'customer' => [
                    'fullName' => 'UAT Test Customer',
                    'email' => 'uat@medzivahealthcare.com',
                    'phone' => '500000000',
                    'address' => 'Dubai, UAE',
                ],
            ]);

            $appUtr = $checkout['appUtr'];
            $redirectUrl = $checkout['redirectUri'];

            $this->info("  appUtr: {$appUtr}");
            $this->info("  orderId: {$checkout['orderId']}");
            $this->info("  transactionUtr: {$checkout['transactionUtr']}");
            $this->newLine();
            $this->info("  Opening in browser...");
            $this->newLine();

            // Open in default browser
            $this->openBrowser($redirectUrl);

            $this->info("  Card: 520473160013612");
            $this->info("  Expiry: 12/30");
            $this->info("  CVV: 123");
            $this->newLine();
            $this->info("  Complete payment, then press ENTER to continue...");

            // Save transaction details
            $file = storage_path('app/uat_transactions.json');
            $existing = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
            $existing[] = [
                'scenario' => $num,
                'description' => $description,
                'amount' => $amount,
                'txnType' => $txnType,
                'appUtr' => $appUtr,
                'orderId' => $checkout['orderId'],
                'transactionUtr' => $checkout['transactionUtr'],
                'redirectUrl' => $redirectUrl,
                'followUp' => $followUp,
                'followUpAmount' => $followUpAmount,
            ];
            file_put_contents($file, json_encode($existing, JSON_PRETTY_PRINT));

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("  ERROR: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }

    private function openBrowser(string $url): void
    {
        $os = PHP_OS_FAMILY;
        if ($os === 'Darwin') {
            exec("open " . escapeshellarg($url));
        } elseif ($os === 'Windows') {
            exec("start " . escapeshellarg($url));
        } else {
            exec("xdg-open " . escapeshellarg($url));
        }
    }
}
