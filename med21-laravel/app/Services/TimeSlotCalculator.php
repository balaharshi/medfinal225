<?php

namespace App\Services;

use App\Models\Service;
use App\Models\Vendor;
use App\Models\VendorServiceAssignment;
use App\Models\VendorWorkingHour;
use Carbon\Carbon;

class TimeSlotCalculator
{
    private const SLOT_DURATION_HOURS = 2;
    private const MIN_OVERLAP_MINUTES = 60; // minimum 1 hour overlap required

    /**
     * Parse booking_notice text into lead time in hours.
     * Handles formats like:
     *   "12 hours prior booking"   → 12
     *   "24 hours prior booking"   → 24
     *   "48 hours prior booking"   → 48
     */
    public function parseLeadTimeHours(?string $bookingNotice): int
    {
        if (! $bookingNotice) {
            return 12;
        }

        if (preg_match('/(\d+)\s*hours?\s*prior/i', $bookingNotice, $matches)) {
            return (int) $matches[1];
        }

        if (preg_match('/(\d+)\s*hours?/i', $bookingNotice, $matches)) {
            return (int) $matches[1];
        }

        if (preg_match('/(\d+)\s*days?\s*prior/i', $bookingNotice, $matches)) {
            return (int) $matches[1] * 24;
        }

        return 12;
    }

    /**
     * Get available 2-hour time slots for a service on a given date.
     *
     * Returns slots that are:
     *   - Within ALL eligible vendors' working hours (union)
     *   - After (now + lead time) for today's date
     */
    public function getAvailableSlots(
        string $serviceId,
        ?string $date = null,
        ?string $region = null
    ): array {
        $service = Service::query()->find($serviceId);
        if (! $service) {
            return $this->allSlots();
        }

        $targetDate = Carbon::parse($date ?? now()->toDateString())->startOfDay();
        $now = Carbon::now();
        $isToday = $targetDate->isSameDay($now);
        $dayOfWeek = $targetDate->dayOfWeek; // 0=Sun, 6=Sat

        $leadTimeHours = $this->parseLeadTimeHours($service->booking_notice);

        // Get eligible vendor IDs for this service
        $vendorIds = VendorServiceAssignment::query()
            ->where('service_id', $serviceId)
            ->where('enabled', true)
            ->pluck('vendor_id')
            ->all();

        if ($vendorIds === []) {
            return $isToday
                ? $this->filterByLeadTime($this->allSlots(), $now->copy()->addHours($leadTimeHours))
                : $this->allSlots();
        }

        // Get active vendors
        $vendors = Vendor::query()
            ->whereIn('id', $vendorIds)
            ->where('active', true)
            ->get();

        if ($vendors->isEmpty()) {
            return $isToday
                ? $this->filterByLeadTime($this->allSlots(), $now->copy()->addHours($leadTimeHours))
                : $this->allSlots();
        }

        // Get working hours for this day of week
        $workingHours = VendorWorkingHour::query()
            ->whereIn('vendor_id', $vendors->pluck('id'))
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();

        if ($workingHours->isEmpty()) {
            return $isToday
                ? $this->filterByLeadTime($this->allSlots(), $now->copy()->addHours($leadTimeHours))
                : $this->allSlots();
        }

        // Lead time starts from the earliest VENDOR working hour after now
        // (same logic as booking expiry — time outside vendor hours doesn't count)
        // Query ALL days, not just the target date, to find the next vendor start
        $allWorkingHours = VendorWorkingHour::query()
            ->whereIn('vendor_id', $vendors->pluck('id'))
            ->where('is_active', true)
            ->get();

        $nextVendorStart = null;
        foreach ($allWorkingHours as $wh) {
            $start = Carbon::parse($wh->start_time)->setDateFrom($now);
            if ($start->lt($now)) {
                $start->addDay();
            }
            if ($nextVendorStart === null || $start->lt($nextVendorStart)) {
                $nextVendorStart = $start;
            }
        }
        $earliestBookable = $nextVendorStart ? $nextVendorStart->copy()->addHours($leadTimeHours) : $now->copy()->addHours($leadTimeHours);

        // Compute the effective window (union of all vendor working hours)
        $ranges = [];
        foreach ($workingHours as $wh) {
            $rangeStart = Carbon::parse($wh->start_time)->setDateFrom($targetDate);
            $rangeEnd = Carbon::parse($wh->end_time)->setDateFrom($targetDate);

            // Merge overlapping ranges
            $merged = false;
            foreach ($ranges as &$existing) {
                if ($rangeStart->lte($existing['end']) && $rangeEnd->gte($existing['start'])) {
                    $existing['start'] = $existing['start']->min($rangeStart);
                    $existing['end'] = $existing['end']->max($rangeEnd);
                    $merged = true;
                    break;
                }
            }
            if (! $merged) {
                $ranges[] = ['start' => $rangeStart, 'end' => $rangeEnd];
            }
        }

        if ($ranges === []) {
            return [];
        }

        // Filter slots that fit within any working-hour range
        $allSlots = $this->allSlots();
        $available = [];

        foreach ($allSlots as $slot) {
            $slotStart = $targetDate->copy()->setTime($slot['startHour'], $slot['startMin'], 0);
            $slotEnd = $slotStart->copy()->addHours(self::SLOT_DURATION_HOURS);

            // Lead time check: slot must be at least leadTimeHours from earliestBookable
            if ($earliestBookable->gt($slotStart)) {
                continue;
            }

            // Slot is available if at least 1 hour overlaps with vendor's working hours
            foreach ($ranges as $range) {
                $overlapStart = $slotStart->max($range['start']);
                $overlapEnd = $slotEnd->min($range['end']);
                if ($overlapStart->lt($overlapEnd) && $overlapStart->diffInMinutes($overlapEnd) >= self::MIN_OVERLAP_MINUTES) {
                    $available[] = $slot;
                    break;
                }
            }
        }

        return $available;
    }

    /**
     * Generate all 12 standard 2-hour slots.
     */
    public function allSlots(): array
    {
        $slots = [];
        for ($hour = 0; $hour < 24; $hour += self::SLOT_DURATION_HOURS) {
            $start = sprintf('%02d:00', $hour);
            $end = sprintf('%02d:00', $hour + self::SLOT_DURATION_HOURS);
            $label = Carbon::parse($start)->format('h:iA') . '-' . Carbon::parse($end)->format('h:iA');
            $slots[] = [
                'label' => $label,
                'startHour' => $hour,
                'startMin' => 0,
                'endHour' => $hour + self::SLOT_DURATION_HOURS,
                'endMin' => 0,
            ];
        }
        return $slots;
    }

    /**
     * Filter slots where start is at or after the earliest bookable time.
     */
    private function filterByLeadTime(array $slots, Carbon $earliestBookable): array
    {
        return array_values(array_filter($slots, function ($slot) use ($earliestBookable) {
            $slotStart = $earliestBookable->copy()->setTime($slot['startHour'], $slot['startMin'], 0);
            if ($slotStart->lt($earliestBookable)) {
                $slotStart->addDay();
            }
            return $slotStart->gte($earliestBookable);
        }));
    }
}
