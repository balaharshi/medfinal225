<?php

namespace App\Console\Commands;

use App\Services\EnbdpayService;
use Illuminate\Console\Command;

class UatFollowUp extends Command
{
    protected $signature = 'uat:follow-up';

    protected $description = 'Run follow-up operations (capture/refund) for UAT test transactions';

    private EnbdpayService $enbdpay;

    public function __construct(EnbdpayService $enbdpay)
    {
        parent::__construct();
        $this->enbdpay = $enbdpay;
    }

    public function handle(): int
    {
        $this->info('===========================================');
        $this->info(' ENBDpay UAT - Follow-up Operations');
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
            if (!$txn['followUp']) {
                $this->line("Scenario {$txn['scenario']}: No follow-up needed, skipping.");
                $rows[] = [
                    $txn['scenario'],
                    $txn['description'],
                    'N/A',
                    'SKIPPED',
                ];
                continue;
            }

            $this->info("Scenario {$txn['scenario']}: {$txn['description']}");
            $this->line("  Follow-up: {$txn['followUp']} " . ($txn['followUpAmount'] ?? ''));
            $this->line("  appUtr: {$txn['appUtr']}");
            $this->line("  transactionUtr: {$txn['transactionUtr']}");

            try {
                $result = match ($txn['followUp']) {
                    'capture' => $this->doCapture($txn),
                    'refund' => $this->doRefund($txn),
                    default => ['status' => 'SKIPPED'],
                };

                $this->info("  Result: {$result['status']}");
                $this->newLine();

                $rows[] = [
                    $txn['scenario'],
                    $txn['description'],
                    $txn['followUp'] . ' ' . ($txn['followUpAmount'] ?? ''),
                    $result['status'],
                ];

            } catch (\Exception $e) {
                $this->error("  ERROR: {$e->getMessage()}");
                $this->newLine();

                $rows[] = [
                    $txn['scenario'],
                    $txn['description'],
                    $txn['followUp'] . ' ' . ($txn['followUpAmount'] ?? ''),
                    'FAILED',
                ];
            }
        }

        $this->newLine();
        $this->info('===========================================');
        $this->info(' FOLLOW-UP RESULTS');
        $this->info('===========================================');
        $this->newLine();

        $this->table(
            ['S.No', 'Scenario', 'Operation', 'Result'],
            $rows
        );

        $this->newLine();
        $this->info('Check ENBDpay dashboard to verify all transactions.');
        $this->info('Run: php artisan uat:check-status to verify final states.');

        return Command::SUCCESS;
    }

    private function doCapture(array $txn): array
    {
        $result = $this->enbdpay->captureTransaction([
            'appUtr' => $txn['appUtr'],
            'orderId' => $txn['orderId'],
            'transactionUtr' => $txn['transactionUtr'],
            'amount' => $txn['followUpAmount'],
        ]);

        return ['status' => $result['responseStatus'] ?? 'CAPTURED'];
    }

    private function doRefund(array $txn): array
    {
        $result = $this->enbdpay->refundTransaction([
            'appUtr' => $txn['appUtr'],
            'orderId' => $txn['orderId'],
            'transactionUtr' => $txn['transactionUtr'],
            'amount' => $txn['followUpAmount'],
            'reason' => 'UAT test - ' . ($txn['followUpAmount'] == $txn['amount'] ? 'full refund' : 'partial refund'),
        ]);

        return ['status' => $result['responseStatus'] ?? 'REFUNDED'];
    }
}
