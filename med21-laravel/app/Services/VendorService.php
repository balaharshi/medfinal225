<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Models\Booking;
use App\Models\Vendor;
use App\Models\VendorProfileChangeRequest;
use App\Models\VendorWorkingHour;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VendorService
{
    public function __construct(
        private readonly VendorServiceAssignmentService $assignmentService,
    ) {
    }

    public function getVendors(): array
    {
        return CaseKeys::camelize(Vendor::query()->get());
    }

    public function createVendor(array $payload): array
    {
        $vendor = Vendor::query()->create([
            'id' => $payload['id'] ?? SequentialId::next(Vendor::class, 'v'),
            'name' => $payload['name'],
            'logo' => $payload['logo'] ?? null,
            'type' => $payload['type'] ?? 'Pharmacy',
            'email' => $payload['email'] ?? null,
            'contact' => $payload['contact'] ?? '',
            'rating' => (float) ($payload['rating'] ?? 5),
            'address' => $payload['address'] ?? 'Dubai',
            'commission' => (float) ($payload['commission'] ?? 10),
            'active' => $payload['active'] ?? true,
            'password_hash' => isset($payload['password']) ? \Hash::make($payload['password']) : null,
        ]);

        if ($vendor->email && isset($payload['password'])) {
            $existingUser = \App\Models\User::query()->where('email', $vendor->email)->first();
            if (! $existingUser) {
                \App\Models\User::query()->create([
                    'id' => SequentialId::next(\App\Models\User::class, 'u'),
                    'full_name' => $vendor->name,
                    'email' => $vendor->email,
                    'password_hash' => \Hash::make($payload['password']),
                    'role' => AppConstants::USER_ROLES['VENDOR'],
                    'vendor_id' => $vendor->id,
                    'is_active' => true,
                ]);
            }
        }

        $activeServices = \App\Models\Service::query()->where('active', true)->where('status', 'active')->pluck('id');
        foreach ($activeServices as $serviceId) {
            \App\Models\VendorServiceAssignment::updateOrCreate(
                ['vendor_id' => $vendor->id, 'service_id' => $serviceId],
                ['id' => SequentialId::next(\App\Models\VendorServiceAssignment::class, 'vsa'), 'enabled' => true]
            );
        }

        return CaseKeys::camelize($vendor);
    }

    public function updateVendor(string $id, array $payload): array
    {
        $vendor = Vendor::query()->find($id) ?? throw new HttpException(404, 'Vendor not found');
        $vendor->fill(CaseKeys::snakePayload($payload));
        if (isset($payload['rating'])) {
            $vendor->rating = (float) $payload['rating'];
        }
        if (isset($payload['commission'])) {
            $vendor->commission = (float) $payload['commission'];
        }
        $vendor->save();

        return CaseKeys::camelize($vendor);
    }

    public function deleteVendor(string $id): array
    {
        $vendor = Vendor::query()->find($id) ?? throw new HttpException(404, 'Vendor not found');
        $deleted = CaseKeys::camelize($vendor);
        $vendor->delete();

        return ['success' => true, 'deleted' => [$deleted]];
    }

    public function getVendorProfile(string $id): array
    {
        return CaseKeys::camelize(Vendor::query()->find($id) ?? throw new HttpException(404, 'Vendor not found'));
    }

    public function getVendorServices(string $vendorId): array
    {
        return $this->assignmentService->getEnabledVendorServices($vendorId);
    }

    public function getVendorProfileChangeRequests(string $vendorId): array
    {
        return CaseKeys::camelize(
            VendorProfileChangeRequest::query()->where('vendor_id', $vendorId)->orderByDesc('created_at')->get()
        );
    }

    public function createVendorProfileChangeRequest(string $vendorId, array $payload): array
    {
        $vendor = Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');

        $fieldName = $payload['fieldName'] ?? '';
        $allowed = ['name', 'type', 'contact', 'address', 'email'];
        if (! in_array($fieldName, $allowed, true)) {
            throw new HttpException(400, 'This field cannot be changed via request');
        }

        $request = VendorProfileChangeRequest::query()->create([
            'id' => SequentialId::next(VendorProfileChangeRequest::class, 'vpcr'),
            'vendor_id' => $vendorId,
            'field_name' => $fieldName,
            'current_value' => (string) ($vendor->{$fieldName} ?? ''),
            'requested_value' => (string) ($payload['requestedValue'] ?? ''),
            'reason' => $payload['reason'] ?? null,
            'status' => 'pending',
        ]);

        return CaseKeys::camelize($request);
    }

    public function getAllVendorProfileChangeRequests(): array
    {
        return CaseKeys::camelize(
            VendorProfileChangeRequest::query()->with('vendor')->orderByDesc('created_at')->get()
        );
    }

    public function reviewVendorProfileChangeRequest(string $id, string $status, ?string $remarks = null): array
    {
        $request = VendorProfileChangeRequest::query()->find($id) ?? throw new HttpException(404, 'Request not found');

        if (! in_array($status, ['approved', 'rejected'], true)) {
            throw new HttpException(400, 'Status must be approved or rejected');
        }

        $request->update(['status' => $status, 'admin_remarks' => $remarks]);

        if ($status === 'approved') {
            $vendor = Vendor::query()->find($request->vendor_id);
            if ($vendor) {
                $vendor->update([$request->field_name => $request->requested_value]);
            }
        }

        return CaseKeys::camelize($request);
    }

    public function getVendorSlaMetrics(): array
    {
        $vendors = Vendor::query()->where('active', true)->get()->keyBy('id');

        $allBookings = Booking::query()
            ->whereIn('vendor_id', $vendors->keys())
            ->whereIn('status', ['Active', 'Completed', 'Canceled'])
            ->get()
            ->groupBy('vendor_id');

        $metrics = $vendors->map(function (Vendor $vendor) use ($allBookings) {
            $bookings = $allBookings->get($vendor->id, collect());

            $totalBookings = $bookings->count();
            $completedBookings = $bookings->where('status', 'Completed')->count();
            $canceledBookings = $bookings->where('status', 'Canceled')->count();
            $activeBookings = $bookings->where('status', 'Active')->count();

            $acceptanceRate = $totalBookings > 0
                ? round(($totalBookings - $canceledBookings) / $totalBookings * 100, 1)
                : 0;

            $completionRate = $totalBookings > 0
                ? round($completedBookings / $totalBookings * 100, 1)
                : 0;

            $avgResponseTimeMinutes = null;
            $responseTimes = $bookings
                ->filter(fn ($b) => $b->accepted_at && $b->created_at)
                ->map(fn ($b) => $b->created_at->diffInMinutes($b->accepted_at));

            if ($responseTimes->isNotEmpty()) {
                $avgResponseTimeMinutes = round($responseTimes->avg(), 1);
            }

            $avgCompletionTimeHours = null;
            $completionTimes = $bookings
                ->filter(fn ($b) => $b->completed_at && $b->accepted_at)
                ->map(fn ($b) => $b->accepted_at->diffInHours($b->completed_at));

            if ($completionTimes->isNotEmpty()) {
                $avgCompletionTimeHours = round($completionTimes->avg(), 1);
            }

            $totalRevenue = $bookings->where('status', 'Completed')->sum('price');

            return [
                'vendorId' => $vendor->id,
                'vendorName' => $vendor->name,
                'totalBookings' => $totalBookings,
                'completedBookings' => $completedBookings,
                'activeBookings' => $activeBookings,
                'canceledBookings' => $canceledBookings,
                'acceptanceRate' => $acceptanceRate,
                'completionRate' => $completionRate,
                'avgResponseTimeMinutes' => $avgResponseTimeMinutes,
                'avgCompletionTimeHours' => $avgCompletionTimeHours,
                'totalRevenue' => $totalRevenue,
            ];
        });

        return $metrics->toArray();
    }

    public function getVendorWorkingHours(string $vendorId): array
    {
        return CaseKeys::camelize(
            VendorWorkingHour::query()->where('vendor_id', $vendorId)->orderBy('day_of_week')->get()
        );
    }

    public function updateVendorWorkingHours(string $vendorId, array $payload): array
    {
        $vendor = Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');

        $hours = $payload['hours'] ?? $payload;
        if (isset($hours['hours'])) {
            $hours = $hours['hours'];
        }

        foreach ($hours as $hourData) {
            $dayOfWeek = $hourData['dayOfWeek'] ?? null;
            if ($dayOfWeek === null) continue;

            VendorWorkingHour::query()->updateOrCreate(
                ['vendor_id' => $vendorId, 'day_of_week' => $dayOfWeek],
                [
                    'id' => SequentialId::next(VendorWorkingHour::class, 'vwh'),
                    'start_time' => $hourData['startTime'] ?? '08:00',
                    'end_time' => $hourData['endTime'] ?? '22:00',
                    'is_active' => $hourData['isActive'] ?? true,
                ]
            );
        }

        return $this->getVendorWorkingHours($vendorId);
    }

    public function exportVendorCatalog(string $vendorId): string
    {
        $vendor = Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');
        $csv = "Service ID,Service Title,Category,Subcategory,Price (AED),Enabled\n";
        $services = $this->assignmentService->getAllServicesWithAssignmentStatus($vendorId);

        foreach ($services as $service) {
            $csv .= implode(',', [
                $service['id'],
                '"' . str_replace('"', '""', $service['title']) . '"',
                $service['category'],
                $service['subcategory'],
                $service['price'],
                $service['enabled'] ? 'Yes' : 'No',
            ]) . "\n";
        }

        return $csv;
    }

    public function importVendorCatalog(string $vendorId, string $filePath): array
    {
        $vendor = Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');
        $imported = 0;
        $errors = [];

        if (($handle = fopen($filePath, 'r')) === false) {
            throw new HttpException(400, 'Could not open file');
        }

        $header = fgetcsv($handle);
        if (! $header || count($header) < 6) {
            fclose($handle);
            throw new HttpException(400, 'Invalid CSV format');
        }

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 6) continue;
            $serviceId = trim($row[0]);
            $enabled = strtolower(trim($row[5] ?? '')) === 'yes';

            if (! $serviceId) continue;

            try {
                \App\Models\VendorServiceAssignment::updateOrCreate(
                    ['vendor_id' => $vendorId, 'service_id' => $serviceId],
                    [
                        'id' => SequentialId::next(\App\Models\VendorServiceAssignment::class, 'vsa'),
                        'vendor_price' => (int) ($row[4] ?? 0),
                        'enabled' => $enabled,
                    ]
                );
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Service {$serviceId}: {$e->getMessage()}";
            }
        }

        fclose($handle);

        return [
            'success' => true,
            'imported' => $imported,
            'errors' => $errors,
        ];
    }
}
