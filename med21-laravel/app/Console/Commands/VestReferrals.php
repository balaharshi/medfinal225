<?php

namespace App\Console\Commands;

use App\Services\ReferralService;
use Illuminate\Console\Command;

class VestReferrals extends Command
{
    protected $signature = 'referrals:vest';
    protected $description = 'Process referral rewards that have passed the vesting period';

    public function handle(ReferralService $referralService): int
    {
        $vested = $referralService->processVesting();
        $this->info("Vested {$vested} referral rewards.");

        return self::SUCCESS;
    }
}
