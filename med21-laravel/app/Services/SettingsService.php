<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Models\Booking;
use App\Models\Setting;
use App\Support\CaseKeys;

class SettingsService
{
    public function getSettings(): array
    {
        $row = Setting::query()->find(AppConstants::DEFAULT_SETTINGS_KEY);
        if (! $row) {
            return [
                'siteName' => 'MedZiva Home Healthcare',
                'vatPercent' => 5,
                'platformFeePercent' => 2.5,
                'defaultCurrency' => 'AED',
                'supportEmail' => 'support@medziva.ae',
                'serviceRegions' => ['Dubai', 'Sharjah'],
                'maintenanceMode' => false,
                'adminUsername' => 'admin',
            ];
        }

        return CaseKeys::camelize($row);
    }

    public function updateSettings(array $payload): array
    {
        $settings = Setting::query()->updateOrCreate(
            ['key' => AppConstants::DEFAULT_SETTINGS_KEY],
            CaseKeys::snakePayload($payload) + ['service_regions' => $payload['serviceRegions'] ?? ['Dubai', 'Sharjah']],
        );

        return ['success' => true, 'settings' => CaseKeys::camelize($settings)];
    }

    public function getRevenueReport(?string $from, ?string $to): array
    {
        $query = Booking::query()->where('status', 'Completed');
        if ($from) $query->where('date', '>=', $from);
        if ($to) $query->where('date', '<=', $to);

        $bookings = $query->get();
        $grossRevenue = $bookings->sum('price');
        $vendorCost = $bookings->sum('cost');
        $totalCompleted = $bookings->count();

        return [
            'grossRevenue' => (float) $grossRevenue,
            'totalCost' => (float) $vendorCost,
            'netProfit' => (float) ($grossRevenue - $vendorCost),
            'completedVisits' => $totalCompleted,
            'period' => ['from' => $from, 'to' => $to],
        ];
    }
}
