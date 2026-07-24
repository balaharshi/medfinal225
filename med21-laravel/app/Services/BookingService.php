<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Models\Booking;
use App\Models\PromoCode;
use App\Models\Vendor;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BookingService
{
    public function __construct(
        private readonly VendorServiceAssignmentService $assignmentService,
        private readonly PusherService $pusherService,
    ) {
    }

    public function getBookings(): array
    {
        return CaseKeys::camelize(Booking::query()->orderByDesc('created_at')->get());
    }

    public function getBooking(string $id): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');

        return CaseKeys::camelize($booking);
    }

    public function createBookingsBatch(array $items, ?string $paymentGroupId = null, ?string $userId = null): array
    {
        if ($items === []) {
            throw new HttpException(422, 'At least one booking item is required');
        }

        $paymentGroupId ??= 'pg-' . strtolower(\Illuminate\Support\Str::random(16));
        $bookings = [];
        $totalAmount = 0;

        \DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $item['paymentGroupId'] = $paymentGroupId;
                $booking = $this->createBooking($item, $userId);
                $bookings[] = $booking;
                $totalAmount += (int) ($item['price'] ?? 0);
            }
            \DB::commit();
        } catch (\Throwable $e) {
            \DB::rollBack();
            throw $e;
        }

        return [
            'success' => true,
            'bookings' => $bookings,
            'paymentGroupId' => $paymentGroupId,
            'totalAmount' => $totalAmount,
        ];
    }

    public function createBooking(array $payload, ?string $userId = null): array
    {
        if (($payload['customerEmail'] ?? '') && ($payload['date'] ?? '') && ($payload['timeSlot'] ?? '')) {
            $existing = Booking::query()
                ->where('customer_email', $payload['customerEmail'])
                ->where('date', $payload['date'])
                ->where('time_slot', $payload['timeSlot'])
                ->where('service_id', $payload['serviceId'] ?? null)
                ->whereNotIn('status', ['Cancelled'])
                ->exists();
            if ($existing) {
                throw new HttpException(409, 'A booking already exists for this date and time slot.');
            }
        }

        if (($payload['vendorId'] ?? null) && ($payload['serviceId'] ?? null)) {
            $this->assignmentService->ensureVendorServiceEnabled((string) $payload['vendorId'], (string) $payload['serviceId']);
        }

        $category = $payload['category'] ?? null;
        $subcategory = $payload['subcategory'] ?? null;
        if (($payload['serviceId'] ?? null) && (!$category || !$subcategory)) {
            $service = \App\Models\Service::query()->find($payload['serviceId']);
            if ($service) {
                $category = $category ?: $service->category;
                $subcategory = $subcategory ?: $service->subcategory;
            }
        }

        $vendorCost = 0;
        $vendorId = $payload['vendorId'] ?? null;
        if ($vendorId && isset($payload['serviceId'])) {
            $assignment = \App\Models\VendorServiceAssignment::query()
                ->where('vendor_id', $vendorId)
                ->where('service_id', $payload['serviceId'])
                ->first();
            $vendorCost = $assignment?->vendor_price ?? 0;
        }

        return \DB::transaction(function () use ($payload, $userId, $vendorId, $vendorCost, $category, $subcategory): array {
            $price = (int) ($payload['price'] ?? 150);
            $walletAmount = 0;
            $walletTransactionId = null;
            $referralCode = $payload['referralCode'] ?? null;
            $friendDiscount = 0;
            $referralId = null;

            if ($referralCode && $userId) {
                $referralService = app(\App\Services\ReferralService::class);
                $referralValidation = $referralService->validateReferralCode($referralCode, $userId);
                if ($referralValidation['valid'] ?? false) {
                    $hasPriorBookings = Booking::query()
                        ->where('customer_email', $payload['customerEmail'] ?? '')
                        ->whereNotIn('status', ['Cancelled'])
                        ->exists();
                    if ($hasPriorBookings) {
                        throw new HttpException(400, 'Referral discount is only available for first-time bookings');
                    }
                    $friendDiscount = (int) ($referralValidation['friendDiscount'] ?? 0);
                    $price = max(0, $price - $friendDiscount);
                }
            }

            if ($userId) {
                $wallet = \App\Models\Wallet::query()->where('user_id', $userId)->first();
                if ($wallet && $wallet->balance > 0) {
                    $walletAmount = min($wallet->balance, $price);
                    $walletService = app(\App\Services\WalletService::class);
                    $txn = $walletService->debit(
                        $wallet,
                        $walletAmount,
                        'Payment for booking',
                        'booking_payment',
                        null,
                    );
                    $walletTransactionId = $txn->id;
                }
            }

            $fullyPaidViaWallet = $walletAmount >= $price;

            $booking = Booking::query()->create([
                'id' => SequentialId::next(Booking::class, 'b'),
                'customer_name' => $payload['customerName'],
                'customer_email' => $payload['customerEmail'] ?? 'guest@example.com',
                'customer_phone' => $payload['customerPhone'] ?? '',
                'service_title' => $payload['serviceTitle'],
                'vendor_name' => $payload['vendorName'] ?? 'Unassigned',
                'vendor_id' => $vendorId,
                'service_id' => $payload['serviceId'] ?? null,
                'category' => $category,
                'subcategory' => $subcategory,
                'price' => $price,
                'cost' => $vendorCost,
                'wallet_amount' => $walletAmount,
                'wallet_transaction_id' => $walletTransactionId,
                'date' => $payload['date'] ?? now()->toDateString(),
                'time_slot' => $payload['timeSlot'] ?? 'Flexible',
                'region' => $payload['region'] ?? 'Dubai',
                'status' => $payload['status'] ?? AppConstants::BOOKING_STATUSES['PENDING'],
                'payment_status' => $fullyPaidViaWallet ? AppConstants::PAYMENT_STATUSES['PAID'] : ($payload['paymentStatus'] ?? AppConstants::PAYMENT_STATUSES['UNPAID']),
                'payment_provider' => $fullyPaidViaWallet ? 'wallet' : ($payload['paymentProvider'] ?? null),
                'payment_app_utr' => $payload['paymentAppUtr'] ?? null,
                'payment_order_id' => $payload['paymentOrderId'] ?? null,
                'payment_transaction_utr' => $payload['paymentTransactionUtr'] ?? null,
                'payment_response_status' => $payload['paymentResponseStatus'] ?? null,
                'payment_group_id' => $payload['paymentGroupId'] ?? null,
                'paid_at' => $fullyPaidViaWallet ? now() : (isset($payload['paidAt']) ? new \DateTime($payload['paidAt']) : null),
                'expires_at' => now()->addHours(2),
                'notes' => $payload['notes'] ?? '',
            ]);

            if ($walletTransactionId) {
                $walletTxn = \App\Models\WalletTransaction::query()->find($walletTransactionId);
                if ($walletTxn) {
                    $walletTxn->forceFill(['reference_id' => $booking->id])->save();
                }
            }

            if ($referralCode && $userId && $friendDiscount > 0) {
                $referralService = app(\App\Services\ReferralService::class);
                $referral = $referralService->createReferral($referralCode, $userId, $booking->id);
                if ($referral) {
                    $referralId = $referral->id;
                }
            }

            $this->sendBookingConfirmationEmail($booking);
            $this->notifyEligibleVendors($booking);

            $result = CaseKeys::camelize($booking);
            if ($friendDiscount > 0) {
                $result['friendDiscount'] = $friendDiscount;
            }
            if ($referralId) {
                $result['referralId'] = $referralId;
            }

            return $result;
        });
    }

    public function attachBookingPayment(string $bookingId, array $payment = [], ?string $paymentGroupId = null): ?array
    {
        $fields = [
            'payment_status' => $payment['paymentStatus'] ?? AppConstants::PAYMENT_STATUSES['PENDING'],
            'payment_provider' => $payment['paymentProvider'] ?? 'ENBDpay',
            'payment_app_utr' => $payment['paymentAppUtr'] ?? null,
            'payment_order_id' => $payment['paymentOrderId'] ?? null,
            'payment_transaction_utr' => $payment['paymentTransactionUtr'] ?? null,
            'payment_response_status' => $payment['paymentResponseStatus'] ?? null,
        ];

        if ($paymentGroupId) {
            Booking::query()->where('payment_group_id', $paymentGroupId)->update($fields);
            $updated = Booking::query()->where('payment_group_id', $paymentGroupId)->get();
            return $updated->isNotEmpty() ? CaseKeys::camelize($updated) : null;
        }

        $booking = Booking::query()->find($bookingId);
        if (! $booking) {
            return null;
        }

        $booking->forceFill($fields)->save();

        return CaseKeys::camelize($booking);
    }

    public function updateBookingPaymentStatus(array $payment = [], ?string $paymentGroupId = null): ?array
    {
        $responseStatus = strtoupper((string) ($payment['responseStatus'] ?? $payment['paymentResponseStatus'] ?? ''));
        $paymentStatus = match (true) {
            in_array($responseStatus, ['CAPTURED', 'AUTHORIZED', 'PROCESSED', 'SUCCESS'], true) => AppConstants::PAYMENT_STATUSES['PAID'],
            in_array($responseStatus, ['CANCELLED', 'CANCELED', 'VOIDED'], true) => AppConstants::PAYMENT_STATUSES['CANCELLED'],
            in_array($responseStatus, ['FAILED', 'DECLINED', 'REJECTED', 'ERROR', 'AUTHORIZATION_DECLINED'], true) => AppConstants::PAYMENT_STATUSES['FAILED'],
            default => AppConstants::PAYMENT_STATUSES['PENDING'],
        };

        $paymentFields = $this->paymentStatusFields($payment, $responseStatus, $paymentStatus);

        if ($paymentGroupId) {
            Booking::query()
                ->where('payment_group_id', $paymentGroupId)
                ->update($paymentFields);
            $bookings = Booking::query()->where('payment_group_id', $paymentGroupId)->get();
            return $bookings->isNotEmpty() ? CaseKeys::camelize($bookings) : null;
        }

        $query = Booking::query()->where(function (Builder $query) use ($payment): void {
            foreach ([
                'id' => $payment['bookingId'] ?? null,
                'payment_app_utr' => $payment['appUtr'] ?? $payment['paymentAppUtr'] ?? null,
                'payment_transaction_utr' => $payment['transactionUtr'] ?? $payment['paymentTransactionUtr'] ?? null,
                'payment_order_id' => $payment['orderId'] ?? $payment['paymentOrderId'] ?? null,
            ] as $column => $value) {
                if ($value) {
                    $query->orWhere($column, $value);
                }
            }
        });

        $booking = $query->first();
        if (! $booking) {
            return null;
        }

        $booking->forceFill($paymentFields)->save();

        if ($booking->payment_group_id) {
            Booking::query()
                ->where('payment_group_id', $booking->payment_group_id)
                ->where('id', '!=', $booking->id)
                ->update($paymentFields);
        }

        if ($paymentStatus === AppConstants::PAYMENT_STATUSES['PAID']) {
            $this->sendPaymentConfirmationEmail($booking);
        }

        return CaseKeys::camelize($booking);
    }

    public function cancelBooking(string $id): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking record not found');
        $booking->forceFill(['status' => AppConstants::BOOKING_STATUSES['CANCELLED']])->save();

        return ['success' => true, 'updated' => CaseKeys::camelize($booking)];
    }

    public function updateBooking(string $id, array $payload): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking record not found');
        $booking->fill(CaseKeys::snakePayload($payload))->save();

        return CaseKeys::camelize($booking);
    }

    public function getVendorBookings(string $vendorId): array
    {
        $vendor = Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');
        $enabledServiceIds = collect($this->assignmentService->getEnabledVendorServices($vendorId))->pluck('id')->all();

        $bookings = Booking::query()
            ->where(function (Builder $query) use ($vendorId, $enabledServiceIds, $vendor): void {
                $query->where('vendor_id', $vendorId)
                    ->orWhere(function (Builder $query) use ($vendorId, $vendor): void {
                        $query->whereNull('vendor_id')
                            ->where('vendor_name', $vendor->name);
                    });

                if ($enabledServiceIds !== [] && $vendor->active !== false) {
                    $query->orWhere(function (Builder $query) use ($enabledServiceIds): void {
                        $query->whereNull('vendor_id')
                            ->where('status', AppConstants::BOOKING_STATUSES['PENDING'])
                            ->whereIn('service_id', $enabledServiceIds);
                    });
                }
            })
            ->orderByDesc('created_at')
            ->get();

        return CaseKeys::camelize($bookings);
    }

    public function acceptVendorBooking(string $bookingId, string $vendorId): array
    {
        $vendor = Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');
        if ($vendor->active === false) {
            throw new HttpException(403, 'Inactive vendors cannot accept bookings');
        }

        $booking = Booking::query()->find($bookingId) ?? throw new HttpException(404, 'Booking record not found');
        if ($booking->vendor_id) {
            throw new HttpException(409, 'This booking has already been accepted by another vendor');
        }
        if ($booking->status !== AppConstants::BOOKING_STATUSES['PENDING']) {
            throw new HttpException(409, 'Only pending bookings can be accepted');
        }
        if (! $booking->service_id) {
            throw new HttpException(400, 'Booking is missing a service assignment');
        }

        $this->assignmentService->ensureVendorServiceEnabled($vendorId, $booking->service_id);
        $vendorCost = 0;
        $assignment = \App\Models\VendorServiceAssignment::query()
            ->where('vendor_id', $vendorId)
            ->where('service_id', $booking->service_id)
            ->first();
        $vendorCost = $assignment?->vendor_price ?? 0;

        $updated = Booking::query()
            ->whereKey($bookingId)
            ->whereNull('vendor_id')
            ->where('status', AppConstants::BOOKING_STATUSES['PENDING'])
            ->update([
                'vendor_id' => $vendorId,
                'vendor_name' => $vendor->name,
                'status' => AppConstants::BOOKING_STATUSES['ACTIVE'],
                'accepted_at' => now(),
                'cost' => $vendorCost,
                'expires_at' => null,
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            throw new HttpException(409, 'This booking has already been accepted by another vendor');
        }

        $updatedBooking = Booking::query()->findOrFail($bookingId);
        $this->sendBookingStatusUpdateEmail($updatedBooking, 'Pending');

        return CaseKeys::camelize($updatedBooking);
    }

    public function updateVendorBookingStatus(string $id, string $vendorId, string $status): array
    {
        $allowedStatuses = ['In Progress', 'Completed', 'Canceled'];
        if (! in_array($status, $allowedStatuses, true)) {
            throw new HttpException(400, 'Invalid status. Allowed: ' . implode(', ', $allowedStatuses));
        }

        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');
        if ($booking->vendor_id !== $vendorId) {
            throw new HttpException(403, 'You can only update bookings assigned to you');
        }

        $previousStatus = $booking->status;
        $updateData = ['status' => $status];
        if ($status === 'Completed') {
            $updateData['completed_at'] = now();
        }

        $booking->forceFill($updateData)->save();

        $this->sendBookingStatusUpdateEmail($booking, $previousStatus);

        return CaseKeys::camelize($booking);
    }

    public function validatePromoCode(string $code, int $orderAmount): array
    {
        $promo = PromoCode::query()->where('code', strtoupper(trim($code)))->first();
        if (! $promo) {
            throw new HttpException(404, 'Promo code not found');
        }
        if (! $promo->active) {
            throw new HttpException(400, 'Promo code is no longer active');
        }
        if ($promo->expires_at && $promo->expires_at->isPast()) {
            throw new HttpException(400, 'Promo code has expired');
        }
        if ($promo->max_uses !== null && $promo->times_used >= $promo->max_uses) {
            throw new HttpException(400, 'Promo code has reached its usage limit');
        }
        if ($orderAmount < $promo->min_order) {
            throw new HttpException(400, 'Minimum order amount is AED ' . $promo->min_order);
        }

        $discountAmount = $promo->discount_type === 'percent'
            ? (int) round($orderAmount * $promo->discount_value / 100)
            : $promo->discount_value;

        if ($promo->max_discount !== null) {
            $discountAmount = min($discountAmount, $promo->max_discount);
        }
        $discountAmount = min($discountAmount, $orderAmount);

        return [
            'valid' => true,
            'code' => $promo->code,
            'discountType' => $promo->discount_type,
            'discountValue' => $promo->discount_value,
            'maxDiscount' => $promo->max_discount,
            'discountAmount' => $discountAmount,
        ];
    }

    public function applyPromoCode(string $code): void
    {
        $promo = PromoCode::query()->where('code', strtoupper(trim($code)))->first();
        if ($promo) {
            $promo->increment('times_used');
        }
    }

    public function getCustomerBookings(string $email): array
    {
        return CaseKeys::camelize(
            Booking::query()->where('customer_email', $email)->orderByDesc('created_at')->get()
        );
    }

    public function cancelCustomerBooking(string $id, string $email, bool $refundToWallet = false, ?string $userId = null): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');
        if ($booking->customer_email !== $email) {
            throw new HttpException(403, 'You can only cancel your own bookings');
        }
        if (! in_array($booking->status, [AppConstants::BOOKING_STATUSES['PENDING'], AppConstants::BOOKING_STATUSES['ACTIVE']], true)) {
            throw new HttpException(400, 'Only pending or active bookings can be cancelled');
        }
        $booking->forceFill(['status' => AppConstants::BOOKING_STATUSES['CANCELLED']])->save();

        $isCaptured = $booking->payment_captured_at !== null;
        $isAuthorized = $booking->payment_status === AppConstants::PAYMENT_STATUSES['PAID'] && ! $isCaptured;

        if ($isAuthorized) {
            try {
                $auth = \App\Models\AuthTransaction::query()
                    ->where('booking_id', $booking->id)
                    ->where('status', 'AUTHORIZED')
                    ->first();
                if ($auth) {
                    $enbdpayService = app(\App\Services\EnbdpayService::class);
                    $enbdpayService->voidAuthorization([
                        'transactionUtr' => $auth->transaction_utr,
                        'appUtr' => $auth->app_utr,
                        'orderId' => $auth->order_id,
                    ]);
                    $auth->update(['status' => 'VOIDED', 'voided_at' => now()]);
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to void auth on cancellation: ' . $e->getMessage());
            }
        }

        if ($refundToWallet && $isCaptured) {
            $refundAmount = $booking->price - ($booking->wallet_amount ?? 0);
            if ($refundAmount > 0) {
                $wallet = \App\Models\Wallet::query()->where('user_id', $userId ?? \App\Models\User::query()
                    ->where('email', $email)->value('id'))->first();
                if ($wallet) {
                    $walletService = app(\App\Services\WalletService::class);
                    $walletService->credit(
                        $wallet,
                        $refundAmount,
                        'Refund for cancelled booking ' . $booking->id,
                        'booking_refund',
                        $booking->id,
                    );
                }
            }
        }

        return CaseKeys::camelize($booking);
    }

    public function rescheduleCustomerBooking(string $id, string $email, ?string $date, ?string $timeSlot): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');
        if ($booking->customer_email !== $email) {
            throw new HttpException(403, 'You can only reschedule your own bookings');
        }
        if (! in_array($booking->status, [AppConstants::BOOKING_STATUSES['PENDING'], AppConstants::BOOKING_STATUSES['ACTIVE']], true)) {
            throw new HttpException(400, 'Only pending or active bookings can be rescheduled');
        }
        if (! $date || ! $timeSlot) {
            throw new HttpException(422, 'Date and time slot are required');
        }
        $previousDate = $booking->date;
        $previousTimeSlot = $booking->time_slot;
        $booking->forceFill(['date' => $date, 'time_slot' => $timeSlot, 'reschedule_count' => ($booking->reschedule_count ?? 0) + 1])->save();
        return [...CaseKeys::camelize($booking), 'previousDate' => $previousDate, 'previousTimeSlot' => $previousTimeSlot];
    }

    public function getAvailableTimeSlots(string $serviceId, ?string $date, ?string $region): array
    {
        $timeSlots = [
            ['label' => '06:00 AM - 08:00 AM', 'startHour' => 6, 'startMin' => 0],
            ['label' => '08:00 AM - 10:00 AM', 'startHour' => 8, 'startMin' => 0],
            ['label' => '10:00 AM - 12:00 PM', 'startHour' => 10, 'startMin' => 0],
            ['label' => '12:00 PM - 02:00 PM', 'startHour' => 12, 'startMin' => 0],
            ['label' => '02:00 PM - 04:00 PM', 'startHour' => 14, 'startMin' => 0],
            ['label' => '04:00 PM - 06:00 PM', 'startHour' => 16, 'startMin' => 0],
            ['label' => '06:00 PM - 08:00 PM', 'startHour' => 18, 'startMin' => 0],
            ['label' => '08:00 PM - 10:00 PM', 'startHour' => 20, 'startMin' => 0],
        ];

        if (! $date) return $timeSlots;

        $bookedSlots = Booking::query()
            ->where('date', $date)
            ->where('service_id', $serviceId)
            ->whereNotIn('status', ['Cancelled'])
            ->pluck('time_slot')
            ->toArray();

        return array_values(array_filter($timeSlots, fn ($slot) => ! in_array($slot['label'], $bookedSlots, true)));
    }

    private function paymentStatusFields(array $payment, string $responseStatus, string $paymentStatus): array
    {
        return [
            'payment_status' => $paymentStatus,
            'payment_provider' => 'ENBDpay',
            'payment_app_utr' => $payment['appUtr'] ?? $payment['paymentAppUtr'] ?? null,
            'payment_order_id' => $payment['orderId'] ?? $payment['paymentOrderId'] ?? null,
            'payment_transaction_utr' => $payment['transactionUtr'] ?? $payment['paymentTransactionUtr'] ?? null,
            'payment_response_status' => $responseStatus ?: null,
            'paid_at' => $paymentStatus === AppConstants::PAYMENT_STATUSES['PAID'] ? now() : null,
        ];
    }

    private function sendBookingConfirmationEmail(Booking $booking): void
    {
        try {
            $email = $booking->customer_email;
            if (! $email || $email === 'guest@example.com') {
                return;
            }

            \Mail::to($email)->send(new \App\Mail\BookingConfirmation(CaseKeys::camelize($booking->toArray())));
        } catch (\Throwable $e) {
            \Log::error('Failed to send booking confirmation email: ' . $e->getMessage());
        }
    }

    private function sendPaymentConfirmationEmail(Booking $booking): void
    {
        try {
            $email = $booking->customer_email;
            if (! $email || $email === 'guest@example.com') {
                return;
            }

            \Mail::to($email)->send(new \App\Mail\PaymentConfirmation(CaseKeys::camelize($booking->toArray())));
        } catch (\Throwable $e) {
            \Log::error('Failed to send payment confirmation email: ' . $e->getMessage());
        }
    }

    private function notifyEligibleVendors(Booking $booking): void
    {
        if (! $booking->service_id) {
            return;
        }

        $vendorIds = \App\Models\VendorServiceAssignment::query()
            ->where('service_id', $booking->service_id)
            ->where('enabled', true)
            ->pluck('vendor_id')
            ->all();

        if ($vendorIds === []) {
            return;
        }

        $vendors = Vendor::query()
            ->whereIn('id', $vendorIds)
            ->where('active', true)
            ->get();

        $bookingData = CaseKeys::camelize($booking->toArray());

        foreach ($vendors as $vendor) {
            if ($vendor->email) {
                try {
                    \Mail::to($vendor->email)->send(new \App\Mail\VendorNewBooking(
                        $bookingData,
                        $vendor->name
                    ));
                } catch (\Throwable $e) {
                    \Log::error('Failed to send vendor booking email to ' . $vendor->email . ': ' . $e->getMessage());
                }
            }

            $this->pusherService->triggerToChannel(
                "vendor-{$vendor->id}",
                'booking:new',
                ['message' => 'New booking available: ' . $booking->service_title, 'booking' => $bookingData]
            );
        }
    }

    private function sendVendorNewBookingEmail(Booking $booking): void
    {
        try {
            $vendor = Vendor::query()->find($booking->vendor_id);
            if (! $vendor || ! $vendor->email) {
                return;
            }

            \Mail::to($vendor->email)->send(new \App\Mail\VendorNewBooking(
                CaseKeys::camelize($booking->toArray()),
                $vendor->name
            ));
        } catch (\Throwable $e) {
            \Log::error('Failed to send vendor new booking email: ' . $e->getMessage());
        }
    }

    private function sendBookingStatusUpdateEmail(Booking $booking, string $previousStatus): void
    {
        try {
            $email = $booking->customer_email;
            if (! $email || $email === 'guest@example.com') {
                return;
            }

            \Mail::to($email)->send(new \App\Mail\BookingStatusUpdate(
                CaseKeys::camelize($booking->toArray()),
                $previousStatus
            ));
        } catch (\Throwable $e) {
            \Log::error('Failed to send booking status update email: ' . $e->getMessage());
        }
    }
}
