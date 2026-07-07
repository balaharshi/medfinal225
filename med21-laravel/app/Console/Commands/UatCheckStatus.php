<?php

namespace App\Console\Commands;

use App\Services\EnbdpayService;
use Illuminate\Console\Command;

class UatCheckStatus extends Command
{
    protected $signature = 'uat:check-status';

    protected $description = 'Check status of all UAT test transactions';

    private EnbdpayService $enbdpay;

    public function __construct(EnbdpayService $enbdpay)
    {
        parent::__construct();
        $this->enbdpay = $enbdpay;
    }

    public function handle(): int
    {
        $this->info('===========================================');
        $this->info(' ENBDpay UAT - Check Transaction Status');
        $this->info('===========================================');
        $this->newLine();

        $file = storage_path('app/uat_transactions.json');
        if (!file_exists($file)) {
            $this->error('No UAT transactions found. Run: php artisan uat:test-transactions');
            return Command::FAILURE;
        }

        $transactions = json_decode(file_get_contents($file), true);
        $rows = [];

        foreach ($transactions as $txn) {
            $this->info("Checking Scenario {$txn['scenario']}: {$txn['description']}...");
            $this->line("  appUtr: {$txn['appUtr']}");
            $this->line("  transactionUtr: {$txn['transactionUtr']}");

            try {
                $status = $this->enbdpay->checkCheckoutStatus([
                    'appUtr' => $txn['appUtr'],
                    'transactionUtr' => $txn['transactionUtr'],
                    'orderId' => $txn['orderId'],
                ]);

                $responseStatus = $status['responseStatus'] ?? $status['status'] ?? 'UNKNOWN';
                $this->info("  Status: {$responseStatus}");
                $this->newLine();

                // Update transactionUtr if it changed
                if (isset($status['transactionUtr']) && $status['transactionUtr'] !== $txn['transactionUtr']) {
                    $txn['transactionUtr'] = $status['transactionUtr'];
                    $this->line("  Updated transactionUtr: {$status['transactionUtr']}");
                }

                $rows[] = [
                    $txn['scenario'],
                    $txn['description'],
                    $txn['amount'] . ' AED',
                    $responseStatus,
                    $txn['appUtr'],
                    $status['transactionUtr'] ?? $txn['transactionUtr'],
                ];

                // Update status in file
                $txn['currentStatus'] = $responseStatus;

            } catch (\Exception $e) {
                $this->error("  ERROR: {$e->getMessage()}");
                $this->newLine();

                $rows[] = [
                    $txn['scenario'],
                    $txn['description'],
                    $txn['amount'] . ' AED',
                    'ERROR',
                    $txn['appUtr'],
                    $txn['transactionUtr'],
                ];
            }

            // Save updated transactionUtr back to file
            file_put_contents($file, json_encode($transactions, JSON_PRETTY_PRINT));
        }

        $this->newLine();
        $this->info('===========================================');
        $this->info(' STATUS SUMMARY');
        $this->info('===========================================');
        $this->newLine();

        $this->table(
            ['S.No', 'Scenario', 'Amount', 'Status', 'appUtr', 'transactionUtr'],
            $rows
        );

        $this->newLine();
        $this->info('If transactions are CAPTURED/PROCESSED, run follow-up:');
        $this->info('  php artisan uat:follow-up');

        return Command::SUCCESS;
    }
}
