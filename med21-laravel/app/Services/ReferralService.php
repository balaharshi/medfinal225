<?php

namespace App\Services;

use App\Models\Referral;
use App\Models\ReferralCode;
use App\Models\Setting;
use App\Models\User;
use App\Models\Wallet;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ReferralService
{
    public function __construct(
        private readonly WalletService $walletService,
    ) {
    }

    public function generateCode(User $user): ReferralCode
    {
        $prefix = strtoupper(substr((string) $user->full_name, 0, 3));
        if (strlen($prefix) < 3) {
            $prefix = str_pad($prefix, 3, 'X');
        }

        $phone = (string) $user->phone;
        $suffix = strlen($phone) >= 3 ? substr($phone, -3) : str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
        $baseCode = $prefix . $suffix;

        $code = $baseCode;
        $attempts = 0;
        while (ReferralCode::query()->where('code', $code)->exists() && $attempts < 10) {
            $attempts++;
            $code = $prefix . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
        }

        return ReferralCode::query()->create([
            'id' => SequentialId::next(ReferralCode::class, 'rfc'),
            'user_id' => $user->id,
            'code' => $code,
        ]);
    }

    public function getCode(string $userId): ?array
    {
        $code = ReferralCode::query()->where('user_id', $userId)->first();
        if (! $code) {
            return null;
        }

        $referralLink = config('app.url') . '?ref=' . $code->code;

        return [
            ...CaseKeys::camelize($code),
            'shareLink' => $referralLink,
        ];
    }

    public function getStats(string $userId): array
    {
        $code = ReferralCode::query()->where('user_id', $userId)->first();
        if (! $code) {
            return [
                'invitesSent' => 0,
                'completedReferrals' => 0,
                'totalRewardsEarned' => 0,
                'pendingRewards' => 0,
            ];
        }

        $completed = Referral::query()
            ->where('referral_code_id', $code->id)
            ->where('status', 'completed')
            ->count();

        $pending = Referral::query()
            ->where('referral_code_id', $code->id)
            ->where('status', 'pending')
            ->count();

        $totalRewards = (int) Referral::query()
            ->where('referral_code_id', $code->id)
            ->where('referrer_reward_status', 'paid')
            ->sum('referrer_reward');

        $pendingRewards = (int) Referral::query()
            ->where('referral_code_id', $code->id)
            ->where('referrer_reward_status', 'pending')
            ->sum('referrer_reward');

        return [
            'invitesSent' => (int) Referral::query()->where('referral_code_id', $code->id)->count(),
            'completedReferrals' => $completed,
            'totalRewardsEarned' => $totalRewards,
            'pendingRewards' => $pendingRewards,
        ];
    }

    public function getHistory(string $userId): array
    {
        $code = ReferralCode::query()->where('user_id', $userId)->first();
        if (! $code) {
            return [];
        }

        return CaseKeys::camelize(
            Referral::query()
                ->where('referral_code_id', $code->id)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function applyCode(string $codeStr, string $referredUserId): array
    {
        $code = ReferralCode::query()->where('code', strtoupper(trim($codeStr)))->first();
        if (! $code) {
            throw new HttpException(404, 'Referral code not found');
        }

        if (! $code->active) {
            throw new HttpException(400, 'Referral code is no longer active');
        }

        if ($code->max_uses !== null && $code->times_used >= $code->max_uses) {
            throw new HttpException(400, 'Referral code has reached its usage limit');
        }

        $referredUser = User::query()->find($referredUserId);
        if (! $referredUser) {
            throw new HttpException(404, 'User not found');
        }

        if ($code->user_id === $referredUserId) {
            throw new HttpException(400, 'You cannot use your own referral code');
        }

        $referrer = User::query()->find($code->user_id);
        if (! $referrer) {
            throw new HttpException(400, 'Referrer account not found');
        }

        $config = $this->getConfig();
        $maxPerYear = (int) ($config['max_per_year'] ?? 20);
        $oneYearAgo = now()->subYear();
        $yearlyCount = Referral::query()
            ->where('referrer_id', $code->user_id)
            ->where('created_at', '>=', $oneYearAgo)
            ->where('status', '!=', 'revoked')
            ->count();

        if ($yearlyCount >= $maxPerYear) {
            throw new HttpException(400, 'This referral code has reached its yearly limit');
        }

        $existing = Referral::query()
            ->where('referral_code_id', $code->id)
            ->where('referred_email', $referredUser->email)
            ->exists();
        if ($existing) {
            throw new HttpException(400, 'This email has already used this referral code');
        }

        return [
            'valid' => true,
            'code' => $code->code,
            'referrerName' => $referrer->full_name,
            'friendDiscount' => (int) ($config['friend_discount'] ?? 25),
        ];
    }

    public function createReferral(string $referralCodeStr, string $referredUserId, string $friendBookingId): ?Referral
    {
        $code = ReferralCode::query()->where('code', strtoupper(trim($referralCodeStr)))->first();
        if (! $code) {
            return null;
        }

        $referredUser = User::query()->find($referredUserId);
        if (! $referredUser) {
            return null;
        }

        if ($code->user_id === $referredUserId) {
            return null;
        }

        $config = $this->getConfig();
        $friendDiscount = (int) ($config['friend_discount'] ?? 25);
        $referrerReward = (int) ($config['referrer_reward'] ?? 25);

        $referral = Referral::query()->create([
            'id' => SequentialId::next(Referral::class, 'ref'),
            'referrer_id' => $code->user_id,
            'referred_email' => $referredUser->email,
            'referred_user_id' => $referredUserId,
            'referral_code_id' => $code->id,
            'status' => 'pending',
            'referrer_reward' => $referrerReward,
            'referrer_reward_status' => 'pending',
            'friend_discount' => $friendDiscount,
            'friend_booking_id' => $friendBookingId,
            'expires_at' => now()->addDays(90),
        ]);

        $code->forceFill(['times_used' => $code->times_used + 1])->save();

        return $referral;
    }

    public function validateReferralCode(string $codeStr, string $userId): array
    {
        return $this->applyCode($codeStr, $userId);
    }

    public function processVesting(): int
    {
        $config = $this->getConfig();
        $vestingDays = (int) ($config['vesting_days'] ?? 7);

        $referrals = Referral::query()
            ->where('status', 'pending')
            ->where('referrer_reward_status', 'pending')
            ->whereNotNull('friend_booking_id')
            ->where('created_at', '<=', now()->subDays($vestingDays))
            ->get();

        $vested = 0;
        foreach ($referrals as $referral) {
            $wallet = Wallet::query()->where('user_id', $referral->referrer_id)->first();
            if (! $wallet) {
                continue;
            }

            $this->walletService->credit(
                $wallet,
                $referral->referrer_reward,
                'Referral reward from ' . ($referral->referred_email ?? 'a friend'),
                'referral',
                $referral->id,
            );

            $referral->forceFill([
                'status' => 'completed',
                'referrer_reward_status' => 'paid',
                'vested_at' => now(),
            ])->save();

            $vested++;
        }

        return $vested;
    }

    public function getConfig(): array
    {
        $settings = Setting::query()->where('key', 'config')->first();
        $config = $settings?->referral_config;

        if (is_string($config)) {
            $config = json_decode($config, true);
        }

        return $config ?? [
            'referrer_reward' => 25,
            'friend_discount' => 25,
            'vesting_days' => 7,
            'max_per_year' => 20,
        ];
    }

    public function updateConfig(array $payload): array
    {
        $settings = Setting::query()->where('key', 'config')->first();
        if (! $settings) {
            throw new HttpException(404, 'Settings not found');
        }

        $current = $settings->referral_config;
        if (is_string($current)) {
            $current = json_decode($current, true);
        }
        $current ??= ['referrer_reward' => 25, 'friend_discount' => 25, 'vesting_days' => 7, 'max_per_year' => 20];

        if (isset($payload['referrerReward'])) {
            $current['referrer_reward'] = (int) $payload['referrerReward'];
        }
        if (isset($payload['friendDiscount'])) {
            $current['friend_discount'] = (int) $payload['friendDiscount'];
        }
        if (isset($payload['vestingDays'])) {
            $current['vesting_days'] = (int) $payload['vestingDays'];
        }
        if (isset($payload['maxPerYear'])) {
            $current['max_per_year'] = (int) $payload['maxPerYear'];
        }

        $settings->forceFill(['referral_config' => json_encode($current)])->save();

        return $current;
    }

    public function adminGetAll(): array
    {
        return CaseKeys::camelize(
            Referral::query()
                ->with(['referrer:id,full_name,email', 'referredUser:id,full_name,email', 'referralCode:id,code'])
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function adminRevoke(string $referralId): array
    {
        $referral = Referral::query()->find($referralId);
        if (! $referral) {
            throw new HttpException(404, 'Referral not found');
        }

        $referral->forceFill(['status' => 'revoked'])->save();

        return CaseKeys::camelize($referral);
    }
}
