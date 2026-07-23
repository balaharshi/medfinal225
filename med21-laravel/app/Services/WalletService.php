<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Symfony\Component\HttpKernel\Exception\HttpException;

class WalletService
{
    public function createWallet(string $userId): Wallet
    {
        $wallet = Wallet::query()->create([
            'id' => SequentialId::next(Wallet::class, 'wal'),
            'user_id' => $userId,
            'balance' => 0,
        ]);

        $config = $this->getConfig();
        $welcomeBonus = (int) ($config['welcome_bonus'] ?? 0);

        if ($welcomeBonus > 0) {
            $this->credit($wallet, $welcomeBonus, 'Welcome bonus', 'promotional_credit', null);
        }

        return $wallet->fresh();
    }

    public function getWallet(string $userId): ?array
    {
        $wallet = Wallet::query()->where('user_id', $userId)->first();
        if (! $wallet) {
            return null;
        }

        $transactions = $wallet->transactions()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return [
            ...CaseKeys::camelize($wallet),
            'transactions' => CaseKeys::camelize($transactions),
        ];
    }

    public function getBalance(string $userId): int
    {
        $wallet = Wallet::query()->where('user_id', $userId)->first();
        return $wallet?->balance ?? 0;
    }

    public function getTransactions(string $userId, int $perPage = 20): array
    {
        $wallet = Wallet::query()->where('user_id', $userId)->first();
        if (! $wallet) {
            return ['data' => [], 'total' => 0];
        }

        $paginator = $wallet->transactions()
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return [
            'data' => CaseKeys::camelize($paginator->items()),
            'total' => $paginator->total(),
            'currentPage' => $paginator->currentPage(),
            'lastPage' => $paginator->lastPage(),
        ];
    }

    public function credit(Wallet $wallet, int $amount, string $description, ?string $referenceType = null, ?string $referenceId = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw new HttpException(400, 'Credit amount must be positive');
        }

        $balanceBefore = $wallet->balance;
        $balanceAfter = $balanceBefore + $amount;

        $transaction = WalletTransaction::query()->create([
            'id' => SequentialId::next(WalletTransaction::class, 'wtx'),
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'description' => $description,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);

        $wallet->forceFill(['balance' => $balanceAfter])->save();

        return $transaction;
    }

    public function debit(Wallet $wallet, int $amount, string $description, ?string $referenceType = null, ?string $referenceId = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw new HttpException(400, 'Debit amount must be positive');
        }

        if ($wallet->balance < $amount) {
            throw new HttpException(400, 'Insufficient wallet balance');
        }

        $balanceBefore = $wallet->balance;
        $balanceAfter = $balanceBefore - $amount;

        $transaction = WalletTransaction::query()->create([
            'id' => SequentialId::next(WalletTransaction::class, 'wtx'),
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'description' => $description,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);

        $wallet->forceFill(['balance' => $balanceAfter])->save();

        return $transaction;
    }

    public function getConfig(): array
    {
        $settings = Setting::query()->where('key', 'config')->first();
        $config = $settings?->wallet_config;

        if (is_string($config)) {
            $config = json_decode($config, true);
        }

        return $config ?? ['welcome_bonus' => 0];
    }

    public function updateConfig(array $payload): array
    {
        $settings = Setting::query()->where('key', 'config')->first();
        if (! $settings) {
            throw new HttpException(404, 'Settings not found');
        }

        $current = $settings->wallet_config;
        if (is_string($current)) {
            $current = json_decode($current, true);
        }
        $current ??= ['welcome_bonus' => 0];

        $current['welcome_bonus'] = (int) ($payload['welcomeBonus'] ?? $current['welcome_bonus']);

        $settings->forceFill(['wallet_config' => json_encode($current)])->save();

        return $current;
    }

    public function adminCredit(string $userId, int $amount, string $description): array
    {
        $wallet = Wallet::query()->where('user_id', $userId)->first();
        if (! $wallet) {
            throw new HttpException(404, 'Wallet not found for this user');
        }

        $transaction = $this->credit($wallet, $amount, $description, 'admin_credit', null);

        return [
            'success' => true,
            'transaction' => CaseKeys::camelize($transaction),
            'balance' => $wallet->fresh()->balance,
        ];
    }

    public function adminDebit(string $userId, int $amount, string $description): array
    {
        $wallet = Wallet::query()->where('user_id', $userId)->first();
        if (! $wallet) {
            throw new HttpException(404, 'Wallet not found for this user');
        }

        $transaction = $this->debit($wallet, $amount, $description, 'admin_debit', null);

        return [
            'success' => true,
            'transaction' => CaseKeys::camelize($transaction),
            'balance' => $wallet->fresh()->balance,
        ];
    }
}
