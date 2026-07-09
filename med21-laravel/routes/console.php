<?php

use App\Console\Commands\CancelExpiredBookings;
use App\Console\Commands\CaptureExpiredAuthorizations;
use App\Console\Commands\SendBookingReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(CaptureExpiredAuthorizations::class)->hourly();
Schedule::command(CancelExpiredBookings::class)->everyFiveMinutes();
Schedule::command(SendBookingReminders::class)->hourly();
