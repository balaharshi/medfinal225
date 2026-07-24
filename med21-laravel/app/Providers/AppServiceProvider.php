<?php

namespace App\Providers;

use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use App\Observers\ImagePathObserver;
use App\Services\ReferralService;
use App\Services\WalletService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Service::observe(ImagePathObserver::class);
        Product::observe(ImagePathObserver::class);

        User::created(function (User $user): void {
            if ($user->role === 'customer') {
                $walletService = app(WalletService::class);
                $walletService->createWallet($user->id);

                $referralService = app(ReferralService::class);
                $referralService->generateCode($user);
            }
        });
    }
}
