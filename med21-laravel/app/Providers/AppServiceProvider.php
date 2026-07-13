<?php

namespace App\Providers;

use App\Models\Product;
use App\Models\Service;
use App\Observers\ImagePathObserver;
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
    }
}
