<?php

namespace App\Services;

use App\Models\Service;
use App\Models\Vendor;
use App\Models\VendorServiceAssignment;
use App\Support\CaseKeys;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VendorServiceAssignmentService
{
    public function getVendorServiceAssignments(string $vendorId): array
    {
        $this->ensureVendorExists($vendorId);
        $assignments = VendorServiceAssignment::query()->where('vendor_id', $vendorId)->get()->keyBy('service_id');

        return Service::query()->get()->map(function (Service $service) use ($assignments): array {
            $assignment = $assignments->get($service->id);

            return [
                ...CaseKeys::camelize($service),
                'assigned' => (bool) $assignment,
                'enabled' => (bool) ($assignment?->enabled),
                'status' => $assignment?->enabled ? 'Enabled' : 'Disabled',
                'assignmentId' => $assignment?->id,
                'vendorPrice' => $assignment?->vendor_price,
                'commissionType' => $assignment?->commission_type,
                'commissionValue' => $assignment?->commission_value,
            ];
        })->values()->all();
    }

    public function setVendorServiceAssignment(string $vendorId, string $serviceId, mixed $enabled = true, ?int $vendorPrice = null, ?string $commissionType = null, ?float $commissionValue = null): array
    {
        $this->ensureVendorExists($vendorId);
        if (! Service::query()->whereKey($serviceId)->exists()) {
            throw new HttpException(404, 'Service not found');
        }

        $data = [
            'id' => "vsa-{$vendorId}-{$serviceId}",
            'enabled' => (bool) $enabled,
        ];
        if ($vendorPrice !== null) $data['vendor_price'] = $vendorPrice;
        if ($commissionType !== null) $data['commission_type'] = $commissionType;
        if ($commissionValue !== null) $data['commission_value'] = $commissionValue;

        $assignment = VendorServiceAssignment::query()->updateOrCreate(
            ['vendor_id' => $vendorId, 'service_id' => $serviceId],
            $data,
        );

        return CaseKeys::camelize($assignment);
    }

    public function bulkSetVendorServiceAssignments(string $vendorId, array $serviceIds = [], mixed $enabled = true, ?int $vendorPrice = null): array
    {
        $this->ensureVendorExists($vendorId);
        if ($serviceIds === []) {
            throw new HttpException(400, 'At least one serviceId is required');
        }

        $assignments = [];
        foreach ($serviceIds as $serviceId) {
            $assignments[] = $this->setVendorServiceAssignment($vendorId, (string) $serviceId, $enabled, $vendorPrice);
        }

        return ['success' => true, 'count' => count($assignments), 'assignments' => $assignments];
    }

    public function getEnabledVendorServices(string $vendorId): array
    {
        $this->ensureVendorExists($vendorId);
        $ids = VendorServiceAssignment::query()
            ->where('vendor_id', $vendorId)
            ->where('enabled', true)
            ->pluck('service_id');

        return Service::query()->whereIn('id', $ids)->get()
            ->map(fn (Service $service) => [...CaseKeys::camelize($service), 'status' => 'Enabled', 'enabled' => true])
            ->values()
            ->all();
    }

    public function ensureVendorServiceEnabled(string $vendorId, string $serviceId): void
    {
        $exists = VendorServiceAssignment::query()
            ->where('vendor_id', $vendorId)
            ->where('service_id', $serviceId)
            ->where('enabled', true)
            ->exists();

        if (! $exists) {
            throw new HttpException(403, 'This service is not enabled for the selected vendor');
        }
    }

    private function ensureVendorExists(string $vendorId): Vendor
    {
        $vendor = Vendor::query()->find($vendorId);
        if (! $vendor) {
            throw new HttpException(404, 'Vendor not found');
        }

        return $vendor;
    }
}
