<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Models\Enquiry;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Symfony\Component\HttpKernel\Exception\HttpException;

class EnquiryService
{
    public function getEnquiries(): array
    {
        return CaseKeys::camelize(Enquiry::query()->orderByDesc('created_at')->get());
    }

    public function createEnquiry(array $payload): array
    {
        $enquiry = Enquiry::query()->create([
            'id' => SequentialId::next(Enquiry::class, 'e'),
            'customer_name' => $payload['customerName'],
            'customer_email' => $payload['customerEmail'] ?? 'guest@example.com',
            'customer_phone' => $payload['customerPhone'] ?? 'N/A',
            'service_title' => $payload['serviceTitle'] ?? 'General Interest',
            'message' => $payload['message'],
            'contact_method' => $payload['contactMethod'] ?? null,
            'date' => $payload['date'] ?? now()->toDateString(),
            'status' => $payload['status'] ?? AppConstants::ENQUIRY_STATUSES['PENDING_RESPONSE'],
        ]);

        return CaseKeys::camelize($enquiry);
    }

    public function updateEnquiryStatus(string $id, ?string $status): array
    {
        $enquiry = Enquiry::query()->find($id) ?? throw new HttpException(404, 'Enquiry not found');
        $enquiry->forceFill(['status' => $status ?: AppConstants::ENQUIRY_STATUSES['ANSWERED']])->save();

        return CaseKeys::camelize($enquiry);
    }

    public function deleteEnquiry(string $id): array
    {
        $enquiry = Enquiry::query()->find($id) ?? throw new HttpException(404, 'Enquiry not found');
        $deleted = CaseKeys::camelize($enquiry);
        $enquiry->delete();

        return ['success' => true, 'deleted' => [$deleted]];
    }
}
