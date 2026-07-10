<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Models\Booking;
use App\Models\Category;
use App\Models\Enquiry;
use App\Models\Product;
use App\Models\PromoCode;
use App\Models\Service;
use App\Models\Setting;
use App\Models\VendorProfileChangeRequest;
use App\Models\Subcategory;
use App\Models\User;
use App\Models\Vendor;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CatalogService
{
    private string $defaultImage = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400';

    public function __construct(
        private readonly VendorServiceAssignmentService $assignmentService,
        private readonly TimeSlotCalculator $timeSlotCalculator,
        private readonly PusherService $pusherService,
    ) {
    }

    public function getDatabase(): array
    {
        return [
            'categories' => $this->getCategories(),
            'products' => $this->getProducts(),
            'services' => $this->getServices(true),
            'vendors' => $this->getVendors(),
            'settings' => $this->getSettings(),
            'bookings' => $this->getBookings(),
            'enquiries' => $this->getEnquiries(),
        ];
    }

    public function getCategories(): array
    {
        return Category::query()->with('subcategories')->get()
            ->map(function (Category $category): array {
                $data = CaseKeys::camelize($category);
                $data['subcategories'] = collect($data['subcategories'] ?? [])
                    ->map(fn (array $sub) => Arr::except($sub, ['categoryId', 'createdAt', 'updatedAt']))
                    ->all();

                return $data;
            })
            ->all();
    }

    public function createCategory(array $payload): array
    {
        $category = Category::query()->create([
            'id' => SequentialId::next(Category::class, 'cat'),
            'title' => $payload['title'],
            'slug' => Str::slug($payload['title']),
            'image' => $payload['image'] ?? $this->defaultImage,
            'description' => $payload['description'] ?? '',
            'type' => $payload['type'] ?? 'service',
        ]);

        return [...CaseKeys::camelize($category), 'subcategories' => []];
    }

    public function updateCategory(string $id, array $payload): array
    {
        $category = Category::query()->find($id) ?? throw new HttpException(404, 'Category not found');
        $category->fill(array_filter([
            'title' => $payload['title'] ?? null,
            'slug' => isset($payload['title']) ? Str::slug($payload['title']) : null,
            'image' => $payload['image'] ?? null,
            'description' => array_key_exists('description', $payload) ? $payload['description'] : null,
            'type' => $payload['type'] ?? null,
        ], fn ($value) => $value !== null));
        $category->save();

        return collect($this->getCategories())->firstWhere('id', $category->id);
    }

    public function deleteCategory(string $id): array
    {
        $category = Category::query()->find($id) ?? throw new HttpException(404, 'Category not found');
        $deleted = CaseKeys::camelize($category);
        $category->delete();

        return ['success' => true, 'deleted' => [$deleted]];
    }

    public function createSubcategory(string $categoryId, array $payload): array
    {
        if (! Category::query()->whereKey($categoryId)->exists()) {
            throw new HttpException(404, 'Parent category not found');
        }

        $subcategory = Subcategory::query()->create([
            'id' => SequentialId::next(Subcategory::class, 'sub'),
            'category_id' => $categoryId,
            'title' => $payload['title'],
            'image' => $payload['image'] ?? null,
        ]);

        return Arr::except(CaseKeys::camelize($subcategory), ['categoryId', 'createdAt', 'updatedAt']);
    }

    public function deleteSubcategory(string $categoryId, string $subcategoryId): array
    {
        $subcategory = Subcategory::query()->find($subcategoryId);
        if (! $subcategory || $subcategory->category_id !== $categoryId) {
            throw new HttpException(404, 'Subcategory not found');
        }

        $deleted = CaseKeys::camelize($subcategory);
        $subcategory->delete();

        return ['success' => true, 'deleted' => [$deleted]];
    }

    public function getProducts(): array
    {
        return CaseKeys::camelize(Product::query()->get());
    }

    public function createProduct(array $payload): array
    {
        $price = (int) ($payload['price'] ?? 0);
        $product = Product::query()->create([
            'id' => SequentialId::next(Product::class, 'prod'),
            'name' => $payload['name'],
            'subtitle' => $payload['subtitle'] ?? '',
            'price' => $price,
            'original_price' => (int) ($payload['originalPrice'] ?? $price),
            'image' => $payload['image'] ?? 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400',
            'category' => $payload['category'] ?? 'devices-for-rent',
            'subcategory' => $payload['subcategory'] ?? '',
            'brand' => $payload['brand'] ?? 'MedZiva Store',
            'rating' => (float) ($payload['rating'] ?? 5),
            'in_stock' => $payload['inStock'] ?? true,
            'description' => $payload['description'] ?? '',
            'attributes' => is_array($payload['attributes'] ?? null) ? $payload['attributes'] : [],
            'vendor_prices' => is_array($payload['vendorPrices'] ?? null) ? $payload['vendorPrices'] : [],
        ]);

        return CaseKeys::camelize($product);
    }

    public function deleteProduct(string $id): array
    {
        $product = Product::query()->find($id) ?? throw new HttpException(404, 'Product not found');
        $deleted = CaseKeys::camelize($product);
        $product->delete();

        return ['success' => true, 'deleted' => [$deleted]];
    }

    public function getServices(bool $includeHidden = false): array
    {
        $query = Service::query()->orderBy('display_priority')->orderByDesc('updated_at');
        if (! $includeHidden) {
            $query->where('active', true)->where('status', 'active');
        }

        return CaseKeys::camelize($query->get());
    }

    public function createService(array $payload): array
    {
        $service = Service::query()->create([
            'id' => SequentialId::next(Service::class, 'srv'),
            ...$this->normalizeServicePayload($payload),
        ]);

        return CaseKeys::camelize($service);
    }

    public function updateService(string $id, array $payload): array
    {
        $service = Service::query()->find($id) ?? throw new HttpException(404, 'Service not found');
        $service->fill($this->normalizeServicePayload($payload, true));
        $service->save();

        return CaseKeys::camelize($service);
    }

    public function deleteService(string $id): array
    {
        $service = Service::query()->find($id) ?? throw new HttpException(404, 'Service not found');
        $deleted = CaseKeys::camelize($service);
        $service->delete();

        return ['success' => true, 'deleted' => [$deleted]];
    }

    public function getVendors(): array
    {
        return CaseKeys::camelize(Vendor::query()->get());
    }

    public function getUsers(): array
    {
        return CaseKeys::camelize(User::query()->orderByDesc('created_at')->get());
    }

    public function deleteUser(string $id, string $actorRole): array
    {
        $user = User::query()->find($id) ?? throw new HttpException(404, 'User not found');

        if (!AppConstants::canManageRole($actorRole, (string) $user->role)) {
            throw new HttpException(403, 'You do not have permission to delete this user.');
        }

        $deleted = CaseKeys::camelize($user);
        $user->delete();

        return ['success' => true, 'deleted' => [$deleted]];
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
            $existingUser = User::query()->where('email', $vendor->email)->first();
            if (! $existingUser) {
                User::query()->create([
                    'id' => SequentialId::next(User::class, 'u'),
                    'full_name' => $vendor->name,
                    'email' => $vendor->email,
                    'password_hash' => \Hash::make($payload['password']),
                    'role' => AppConstants::USER_ROLES['VENDOR'],
                    'vendor_id' => $vendor->id,
                    'is_active' => true,
                ]);
            }
        }

        // Auto-assign all active services to the new vendor
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

    public function getBookings(): array
    {
        return CaseKeys::camelize(Booking::query()->orderByDesc('created_at')->get());
    }

    public function getBooking(string $id): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');

        return CaseKeys::camelize($booking);
    }

    public function createBooking(array $payload): array
    {
        if (($payload['vendorId'] ?? null) && ($payload['serviceId'] ?? null)) {
            $this->assignmentService->ensureVendorServiceEnabled((string) $payload['vendorId'], (string) $payload['serviceId']);
        }

        // Prevent duplicate bookings for same customer+service+date+slot
        $customerEmail = $payload['customerEmail'] ?? '';
        if ($customerEmail && $customerEmail !== 'guest@example.com' && ($payload['serviceId'] ?? null)) {
            $duplicate = Booking::query()
                ->where('customer_email', $customerEmail)
                ->where('service_id', $payload['serviceId'])
                ->where('date', $payload['date'] ?? now()->toDateString())
                ->where('time_slot', $payload['timeSlot'] ?? 'Flexible')
                ->whereIn('status', [AppConstants::BOOKING_STATUSES['PENDING'], AppConstants::BOOKING_STATUSES['ACTIVE']])
                ->exists();

            if ($duplicate) {
                throw new HttpException(409, 'You already have a pending booking for this service at the same date and time');
            }
        }

        // Resolve category/subcategory from service record if serviceId provided
        $category = $payload['category'] ?? null;
        $subcategory = $payload['subcategory'] ?? null;
        if (($payload['serviceId'] ?? null) && (!$category || !$subcategory)) {
            $service = \App\Models\Service::query()->find($payload['serviceId']);
            if ($service) {
                $category = $category ?: $service->category;
                $subcategory = $subcategory ?: $service->subcategory;
            }
        }

        $booking = Booking::query()->create([
            'id' => SequentialId::next(Booking::class, 'b'),
            'customer_name' => $payload['customerName'],
            'customer_email' => $payload['customerEmail'] ?? 'guest@example.com',
            'customer_phone' => $payload['customerPhone'] ?? '',
            'service_title' => $payload['serviceTitle'],
            'vendor_name' => $payload['vendorName'] ?? 'Unassigned',
            'vendor_id' => $payload['vendorId'] ?? null,
            'service_id' => $payload['serviceId'] ?? null,
            'category' => $category,
            'subcategory' => $subcategory,
            'price' => (int) ($payload['price'] ?? 150),
            'date' => $payload['date'] ?? now()->toDateString(),
            'time_slot' => $payload['timeSlot'] ?? 'Flexible',
            'region' => $payload['region'] ?? 'Dubai',
            'status' => $payload['status'] ?? AppConstants::BOOKING_STATUSES['PENDING'],
            'payment_status' => $payload['paymentStatus'] ?? AppConstants::PAYMENT_STATUSES['UNPAID'],
            'payment_provider' => $payload['paymentProvider'] ?? null,
            'payment_app_utr' => $payload['paymentAppUtr'] ?? null,
            'payment_order_id' => $payload['paymentOrderId'] ?? null,
            'payment_transaction_utr' => $payload['paymentTransactionUtr'] ?? null,
            'payment_response_status' => $payload['paymentResponseStatus'] ?? null,
            'paid_at' => isset($payload['paidAt']) ? new \DateTime($payload['paidAt']) : null,
            'notes' => $payload['notes'] ?? '',
            'expires_at' => $this->calculateBookingExpiry($payload['serviceId'] ?? null, $payload['date'] ?? null),
        ]);

        $this->sendBookingConfirmationEmail($booking);

        // Notify all eligible vendors with this service enabled
        $this->notifyEligibleVendors($booking);

        return CaseKeys::camelize($booking);
    }

    public function attachBookingPayment(string $bookingId, array $payment = []): ?array
    {
        $booking = Booking::query()->find($bookingId);
        if (! $booking) {
            return null;
        }

        $booking->forceFill([
            'payment_status' => $payment['paymentStatus'] ?? AppConstants::PAYMENT_STATUSES['PENDING'],
            'payment_provider' => $payment['paymentProvider'] ?? 'ENBDpay',
            'payment_app_utr' => $payment['paymentAppUtr'] ?? null,
            'payment_order_id' => $payment['paymentOrderId'] ?? null,
            'payment_transaction_utr' => $payment['paymentTransactionUtr'] ?? null,
            'payment_response_status' => $payment['paymentResponseStatus'] ?? null,
        ])->save();

        return CaseKeys::camelize($booking);
    }

    public function updateBookingPaymentStatus(array $payment = []): ?array
    {
        $responseStatus = strtoupper((string) ($payment['responseStatus'] ?? $payment['paymentResponseStatus'] ?? ''));
        $paymentStatus = match (true) {
            in_array($responseStatus, ['CAPTURED', 'AUTHORIZED', 'PROCESSED', 'SUCCESS'], true) => AppConstants::PAYMENT_STATUSES['PAID'],
            in_array($responseStatus, ['CANCELLED', 'CANCELED', 'VOIDED'], true) => AppConstants::PAYMENT_STATUSES['CANCELLED'],
            in_array($responseStatus, ['FAILED', 'DECLINED', 'REJECTED', 'ERROR', 'AUTHORIZATION_DECLINED'], true) => AppConstants::PAYMENT_STATUSES['FAILED'],
            default => AppConstants::PAYMENT_STATUSES['PENDING'],
        };

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

        $booking->forceFill([
            'payment_status' => $paymentStatus,
            'payment_provider' => 'ENBDpay',
            'payment_app_utr' => $payment['appUtr'] ?? $payment['paymentAppUtr'] ?? null,
            'payment_order_id' => $payment['orderId'] ?? $payment['paymentOrderId'] ?? null,
            'payment_transaction_utr' => $payment['transactionUtr'] ?? $payment['paymentTransactionUtr'] ?? null,
            'payment_response_status' => $responseStatus ?: null,
            'paid_at' => $paymentStatus === AppConstants::PAYMENT_STATUSES['PAID'] ? now() : null,
        ])->save();

        if ($paymentStatus === AppConstants::PAYMENT_STATUSES['PAID']) {
            $this->sendPaymentConfirmationEmail($booking);
        }

        return CaseKeys::camelize($booking);
    }

    public function cancelBooking(string $id): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking record not found');
        $previousStatus = $booking->status;
        $booking->forceFill(['status' => AppConstants::BOOKING_STATUSES['CANCELLED']])->save();

        $this->handleCancellationPayment($booking);
        $this->sendBookingStatusUpdateEmail($booking, $previousStatus);
        $this->sendVendorCancellationEmail($booking);

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
        $updated = Booking::query()
            ->whereKey($bookingId)
            ->whereNull('vendor_id')
            ->where('status', AppConstants::BOOKING_STATUSES['PENDING'])
            ->update([
                'vendor_id' => $vendorId,
                'vendor_name' => $vendor->name,
                'status' => AppConstants::BOOKING_STATUSES['ACTIVE'],
                'accepted_at' => now(),
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            throw new HttpException(409, 'This booking has already been accepted by another vendor');
        }

        $updatedBooking = Booking::query()->findOrFail($bookingId);
        $this->sendBookingStatusUpdateEmail($updatedBooking, 'Pending');
        $this->sendVendorAcceptanceEmail($updatedBooking);

        return CaseKeys::camelize($updatedBooking);
    }

    public function getVendorServices(string $vendorId): array
    {
        return $this->assignmentService->getEnabledVendorServices($vendorId);
    }

    public function getVendorProfile(string $id): array
    {
        return CaseKeys::camelize(Vendor::query()->find($id) ?? throw new HttpException(404, 'Vendor not found'));
    }

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

    public function getCustomerBookings(string $email): array
    {
        return CaseKeys::camelize(
            Booking::query()->where('customer_email', $email)->orderByDesc('created_at')->get()
        );
    }

    public function cancelCustomerBooking(string $id, string $email): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');
        if ($booking->customer_email !== $email) {
            throw new HttpException(403, 'You can only cancel your own bookings');
        }
        if (! in_array($booking->status, [AppConstants::BOOKING_STATUSES['PENDING'], AppConstants::BOOKING_STATUSES['ACTIVE']], true)) {
            throw new HttpException(400, 'Only pending or active bookings can be cancelled');
        }
        $previousStatus = $booking->status;
        $booking->forceFill(['status' => AppConstants::BOOKING_STATUSES['CANCELLED']])->save();

        $this->handleCancellationPayment($booking);
        $this->sendBookingStatusUpdateEmail($booking, $previousStatus);
        $this->sendVendorCancellationEmail($booking);

        return CaseKeys::camelize($booking);
    }

    public function rescheduleCustomerBooking(string $id, string $email, string $newDate, string $newTimeSlot): array
    {
        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');
        if ($booking->customer_email !== $email) {
            throw new HttpException(403, 'You can only reschedule your own bookings');
        }
        if ($booking->status !== AppConstants::BOOKING_STATUSES['PENDING'] && $booking->status !== AppConstants::BOOKING_STATUSES['ACTIVE']) {
            throw new HttpException(400, 'Only pending or active bookings can be rescheduled');
        }

        // Check 1 free reschedule limit
        if ($booking->reschedule_count >= 1) {
            throw new HttpException(400, 'You have already used your free reschedule. Contact support for further changes.');
        }

        // Check 24 hours notice before original appointment
        try {
            $originalAppointment = \Carbon\Carbon::parse($booking->date . ' ' . explode('-', str_replace(' ', '', $booking->time_slot))[0]);
        } catch (\Throwable) {
            $originalAppointment = \Carbon\Carbon::parse($booking->date);
        }
        if (now()->diffInHours($originalAppointment, false) <= 24) {
            throw new HttpException(400, 'Rescheduling requires at least 24 hours notice before your original appointment.');
        }

        // Validate new date/time slot is available
        if ($booking->service_id) {
            $available = $this->timeSlotCalculator->getAvailableSlots($booking->service_id, $newDate);
            $slotAvailable = \Illuminate\Support\Collection::make($available)->first(fn ($s) => $s['label'] === $newTimeSlot);
            if (! $slotAvailable) {
                throw new HttpException(400, 'The selected time slot is not available. Please choose from the available slots.');
            }
        }

        $previousStatus = $booking->status;
        $updateData = [
            'date' => $newDate,
            'time_slot' => $newTimeSlot,
            'reschedule_count' => $booking->reschedule_count + 1,
        ];

        // If a vendor was assigned, put back to unassigned so all vendors can re-accept
        if ($booking->vendor_id) {
            $updateData['vendor_id'] = null;
            $updateData['vendor_name'] = 'Unassigned';
            $updateData['status'] = AppConstants::BOOKING_STATUSES['PENDING'];
            $updateData['accepted_at'] = null;

            // Notify the previously assigned vendor
            $this->sendVendorCancellationEmail($booking);
        }

        $booking->forceFill($updateData)->save();

        // Notify all eligible vendors about the rescheduled slot
        if ($booking->service_id) {
            $this->notifyEligibleVendors($booking);
        }

        // Notify customer
        $this->sendBookingStatusUpdateEmail($booking, $previousStatus);

        return CaseKeys::camelize($booking);
    }

    public function updateVendorBookingStatus(string $id, string $vendorId, string $status): array
    {
        $allowedStatuses = ['In Progress', 'Completed', 'Canceled'];
        if (! in_array($status, $allowedStatuses, true)) {
            throw new HttpException(400, 'Invalid status. Allowed: '.implode(', ', $allowedStatuses));
        }

        $booking = Booking::query()->find($id) ?? throw new HttpException(404, 'Booking not found');
        if ($booking->vendor_id !== $vendorId) {
            throw new HttpException(403, 'You can only update bookings assigned to you');
        }
        $vendor = Vendor::query()->find($vendorId);
        if (! $vendor || ! $vendor->active) {
            throw new HttpException(403, 'This vendor account has been deactivated');
        }

        $previousStatus = $booking->status;
        $updateData = ['status' => $status];
        if ($status === 'Completed') {
            $updateData['completed_at'] = now();
        }

        $booking->forceFill($updateData)->save();

        if ($status === 'Canceled') {
            $this->sendBookingStatusUpdateEmail($booking, $previousStatus);
            $this->sendVendorCancellationEmail($booking);
        }

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
            throw new HttpException(400, 'Minimum order amount is AED '.$promo->min_order);
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

    private function normalizeServicePayload(array $payload, bool $partial = false): array
    {
        $has = fn (string $key): bool => array_key_exists($key, $payload);
        $list = fn (mixed $value): array => is_array($value)
            ? array_values(array_filter(array_map('strval', $value)))
            : array_values(array_filter(array_map('trim', preg_split('/[\n,]+/', (string) $value) ?: [])));
        $set = function (string $key, mixed $value) use (&$updates, $partial): void {
            if (! $partial || $value !== null) {
                $updates[$key] = $value;
            }
        };

        $updates = [];
        $set('title', $this->sanitizeServiceName($payload['title'] ?? null));
        $set('slug', $has('slug') ? Str::slug((string) $payload['slug']) : (($payload['title'] ?? null) ? Str::slug($this->sanitizeServiceName($payload['title'])) : ($partial ? null : '')));
        $set('category', $payload['category'] ?? ($partial ? null : 'home-healthcare'));
        $set('subcategory', $payload['subcategory'] ?? ($partial ? null : ''));
        $set('status', $payload['status'] ?? ($partial ? null : 'active'));
        $set('active', $has('active') ? (bool) $payload['active'] : ($partial ? null : true));
        $set('price', $has('price') ? (int) $payload['price'] : ($partial ? null : 0));
        $set('original_price', $has('originalPrice') ? (int) $payload['originalPrice'] : ($has('price') ? (int) $payload['price'] : ($partial ? null : 0)));
        $set('sale_price', $has('salePrice') ? (int) $payload['salePrice'] : ($has('price') ? (int) $payload['price'] : ($partial ? null : 0)));
        $set('currency', $payload['currency'] ?? ($partial ? null : 'AED'));
        $set('home_visit_fee_included', $has('homeVisitFeeIncluded') ? (bool) $payload['homeVisitFeeIncluded'] : ($partial ? null : true));
        $set('duration', $payload['duration'] ?? ($partial ? null : '1 Hour'));
        $set('estimated_visit_time', $payload['estimatedVisitTime'] ?? ($partial ? null : ''));
        $set('image', $payload['image'] ?? ($partial ? null : $this->defaultImage));
        $set('short_description', $this->sanitizeDescription($payload['shortDescription'] ?? $payload['description'] ?? ($partial ? null : '')));
        $set('full_description', $this->sanitizeDescription($payload['fullDescription'] ?? $payload['description'] ?? ($partial ? null : '')));
        $set('description', $this->sanitizeDescription($payload['description'] ?? $payload['shortDescription'] ?? ($partial ? null : '')));
        $set('inclusions', $has('inclusions') ? $list($payload['inclusions']) : ($partial ? null : []));
        $set('preparation_instructions', $payload['preparationInstructions'] ?? ($partial ? null : ''));
        $set('who_is_it_for', $payload['whoIsItFor'] ?? ($partial ? null : ''));
        $set('service_location', $payload['serviceLocation'] ?? ($partial ? null : 'at-home'));
        $set('availability', $payload['availability'] ?? ($partial ? null : ''));
        $set('tags', $has('tags') ? (is_array($payload['tags']) ? $payload['tags'] : $list($payload['tags'])) : ($partial ? null : []));
        $set('display_priority', $has('displayPriority') ? (int) $payload['displayPriority'] : ($partial ? null : 100));
        $set('seo_title', $payload['seoTitle'] ?? ($partial ? null : ''));
        $set('seo_description', $this->sanitizeDescription($payload['seoDescription'] ?? ($partial ? null : '')));
        $set('popular', $has('popular') ? (bool) $payload['popular'] : ($partial ? null : false));
        $set('enquiry_only', $has('enquiryOnly') ? (bool) $payload['enquiryOnly'] : ($partial ? null : false));
        $set('attributes', is_array($payload['attributes'] ?? null) ? $payload['attributes'] : ($partial ? null : []));
        $set('vendor_prices', is_array($payload['vendorPrices'] ?? null) ? $payload['vendorPrices'] : ($partial ? null : []));
        $set('booking_notice', $this->sanitizeBookingNotice($payload['bookingNotice'] ?? ($partial ? null : '')));
        $set('remarks', $this->sanitizeDescription($payload['remarks'] ?? ($partial ? null : '')));

        return array_filter($updates, fn ($value) => $value !== null);
    }

    private function sanitizeServiceName(?string $name): ?string
    {
        if ($name === null) {
            return null;
        }

        // Fix common misspellings
        $name = str_ireplace('physiotheraphy', 'Physiotherapy', $name);
        $name = str_ireplace('physiotherapy', 'Physiotherapy', $name);

        // Add spaces around hyphens if missing
        $name = preg_replace('/(\w)-(\w)/', '$1 - $2', $name);
        $name = preg_replace('/(\w)-\s/', '$1 - ', $name);
        $name = preg_replace('/\s-(\w)/', ' - $1', $name);

        // Fix title case
        $name = ucfirst(trim($name));

        // Fix " - " formatting
        $name = preg_replace('/\s*-\s*/', ' - ', $name);

        // Clean up extra spaces
        $name = preg_replace('/\s+/', ' ', trim($name));

        return $name;
    }

    private function sanitizeDescription(?string $description): ?string
    {
        if ($description === null || $description === '') {
            return $description;
        }

        // Remove vendor-specific text patterns
        $patterns = [
            '/\d+\s*hours?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/\d+\s*days?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/vendor\s*\d+(\s*and\s*\d+)?/i',
            '/prior\s*notice\s*for\s*vendor/i',
            '/hours?\s*prior\s*for\s*vendor/i',
            '/days?\s*prior\s*for\s*vendor/i',
        ];

        foreach ($patterns as $pattern) {
            $description = preg_replace($pattern, '', $description);
        }

        // Fix typos
        $description = str_ireplace('prioir', 'prior', $description);
        $description = str_ireplace('recieve', 'receive', $description);
        $description = str_ireplace('seperate', 'separate', $description);

        // Clean up extra spaces and punctuation
        $description = preg_replace('/\s+/', ' ', $description);
        $description = preg_replace('/\s+,/', ',', $description);
        $description = preg_replace('/,\s*,/', ',', $description);
        $description = preg_replace('/^\s*,/', '', $description);
        $description = preg_replace('/,\s*$/', '', $description);

        // Ensure proper ending punctuation
        $description = trim($description);
        if ($description !== '' && ! preg_match('/[.!?]$/', $description)) {
            $description .= '.';
        }

        return $description;
    }

    private function sanitizeBookingNotice(?string $notice): ?string
    {
        if ($notice === null || $notice === '') {
            return $notice;
        }

        // Remove vendor-specific text patterns
        $patterns = [
            '/\d+\s*hours?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/\d+\s*days?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/vendor\s*\d+(\s*and\s*\d+)?/i',
            '/prior\s*notice\s*for\s*vendor/i',
            '/hours?\s*prior\s*for\s*vendor/i',
            '/days?\s*prior\s*for\s*vendor/i',
        ];

        foreach ($patterns as $pattern) {
            $notice = preg_replace($pattern, '', $notice);
        }

        // Fix typos
        $notice = str_ireplace('prioir', 'prior', $notice);

        // Clean up
        $notice = preg_replace('/\s+/', ' ', $notice);
        $notice = preg_replace('/,\s*,/', ',', $notice);
        $notice = preg_replace('/^\s*,/', '', $notice);
        $notice = preg_replace('/,\s*$/', '', $notice);

        return trim($notice);
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
        $vendors = Vendor::query()->where('active', true)->get();

        $metrics = $vendors->map(function (Vendor $vendor) {
            $bookings = Booking::query()
                ->where('vendor_id', $vendor->id)
                ->whereIn('status', ['Active', 'Completed', 'Canceled'])
                ->get();

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

    // ── Booking Expiry ────────────────────────────────────────────────

    // ── Cancellation Payment ─────────────────────────────────────────

    /**
     * Calculate cancellation fee based on policy:
     *   - > 24 hours from booking time: full refund (no fee)
     *   - ≤ 24 hours from booking time: 20% of booking or AED 100, whichever is lower
     */
    private function calculateCancellationFee(Booking $booking): int
    {
        $price = (int) $booking->price;
        $createdAt = $booking->created_at ?? now();
        $hoursSinceBooking = $createdAt->diffInHours(now());

        // More than 24 hours since booking → no fee
        if ($hoursSinceBooking > 24) {
            return 0;
        }

        // Within 24 hours of booking → min(20% of price, AED 100)
        $percentFee = (int) round($price * 0.2);
        $cappedFee = min($percentFee, 100);

        return max($cappedFee, 0);
    }

    private function handleCancellationPayment(Booking $booking): void
    {
        $authTransaction = \App\Models\AuthTransaction::query()
            ->where('booking_id', $booking->id)
            ->first();

        if (! $authTransaction) {
            return; // No payment to process
        }

        $fee = $this->calculateCancellationFee($booking);
        $enbdpay = app(EnbdpayService::class);

        try {
            if ($authTransaction->status === 'AUTHORIZED') {
                // Just void — can't do partial voids with ENBDpay AUTH
                $enbdpay->voidAuthorization([
                    'transactionUtr' => $authTransaction->transaction_utr,
                    'appUtr' => $authTransaction->app_utr,
                    'orderId' => $authTransaction->order_id,
                ]);
                $authTransaction->update([
                    'status' => 'VOIDED',
                    'voided_at' => now(),
                    'notes' => $fee > 0 ? 'Cancellation fee AED ' . $fee : 'Full void',
                ]);

                if ($fee > 0) {
                    \Log::warning("Booking {$booking->id} cancelled within 24h. Fee AED {$fee} not collectable — payment was only AUTHORIZED.");
                }
            } elseif ($authTransaction->status === 'CAPTURED') {
                $refundAmount = max((float) $authTransaction->captured_amount - $fee, 0);

                $enbdpay->refundTransaction([
                    'transactionUtr' => $authTransaction->transaction_utr,
                    'appUtr' => $authTransaction->app_utr,
                    'amount' => $refundAmount,
                    'orderId' => $authTransaction->order_id,
                ]);

                $authTransaction->update([
                    'status' => 'REFUNDED',
                    'notes' => $fee > 0 ? 'Cancellation fee AED ' . $fee . ' deducted from refund' : 'Full refund',
                ]);

                $booking->update(['payment_status' => 'Refunded']);
            }
        } catch (\Throwable $e) {
            \Log::error("Failed to process cancellation payment for booking {$booking->id}: " . $e->getMessage());
        }
    }

    // ── Revenue Reports ──────────────────────────────────────────────

    public function getRevenueReport(?string $from = null, ?string $to = null): array
    {
        $query = Booking::query()->where('payment_status', 'Paid');

        if ($from) $query->whereDate('created_at', '>=', $from);
        if ($to) $query->whereDate('created_at', '<=', $to);

        $bookings = $query->get();
        $totalRevenue = 0;
        $totalCost = 0;
        $lineItems = [];

        // Batch-load all vendor assignments in one query to avoid N+1
        $vendorServicePairs = $bookings->map(fn ($b) => ['vendor_id' => $b->vendor_id, 'service_id' => $b->service_id])
            ->filter(fn ($p) => $p['vendor_id'] && $p['service_id'])
            ->unique(fn ($p) => $p['vendor_id'] . '|' . $p['service_id']);
        $assignments = \App\Models\VendorServiceAssignment::query()
            ->where(function ($q) use ($vendorServicePairs) {
                foreach ($vendorServicePairs as $pair) {
                    $q->orWhere(fn ($w) => $w->where('vendor_id', $pair['vendor_id'])->where('service_id', $pair['service_id']));
                }
            })
            ->when($vendorServicePairs->isEmpty(), fn ($q) => $q->whereRaw('1=0'))
            ->get()
            ->keyBy(fn ($a) => $a->vendor_id . '|' . $a->service_id);

        foreach ($bookings as $booking) {
            $revenue = (int) $booking->price;
            $cost = 0;

            if ($booking->service_id && $booking->vendor_id) {
                $key = $booking->vendor_id . '|' . $booking->service_id;
                $assignment = $assignments->get($key);
                if ($assignment && $assignment->vendor_price !== null) {
                    $cost = $assignment->vendor_price;
                }
            }

            $totalRevenue += $revenue;
            $totalCost += $cost;
            $lineItems[] = [
                'bookingId' => $booking->id,
                'service' => $booking->service_title,
                'date' => $booking->date,
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $revenue - $cost,
            ];
        }

        return [
            'totalRevenue' => $totalRevenue,
            'totalCost' => $totalCost,
            'totalProfit' => $totalRevenue - $totalCost,
            'count' => count($lineItems),
            'items' => $lineItems,
        ];
    }

    private function calculateBookingExpiry(?string $serviceId, ?string $bookingDate): ?\DateTime
    {
        if (! $serviceId) {
            return now()->addHours(2);
        }

        $now = now();
        $targetDate = $bookingDate ? \Carbon\Carbon::parse($bookingDate) : $now;
        $dayOfWeek = $targetDate->dayOfWeek;

        // Find all active vendors with this service enabled
        $vendorIds = \App\Models\VendorServiceAssignment::query()
            ->where('service_id', $serviceId)
            ->where('enabled', true)
            ->pluck('vendor_id')
            ->all();

        if ($vendorIds === []) {
            return $now->copy()->addHours(2);
        }

        // Get their working hours for this day of week
        $workingHours = \App\Models\VendorWorkingHour::query()
            ->whereIn('vendor_id', $vendorIds)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();

        if ($workingHours->isEmpty()) {
            return $now->copy()->addHours(2);
        }

        // Find the earliest working hour start that is after (or at) now,
        // OR the earliest start today if all starts have passed
        $earliestStart = null;
        foreach ($workingHours as $wh) {
            $start = \Carbon\Carbon::parse($wh->start_time)->setDateFrom($now);
            // If this start has already passed today, try tomorrow
            if ($start->lt($now)) {
                $start->addDay();
            }
            if ($earliestStart === null || $start->lt($earliestStart)) {
                $earliestStart = $start;
            }
        }

        // If all vendor working hours are in the past and no booking date was set,
        // fall back to now + 2 hours
        if (! $earliestStart) {
            return $now->copy()->addHours(2);
        }

        return $earliestStart->addHours(2);
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

        $this->sendCustomerWhatsApp($booking, 'booking_confirmed', [
            $booking->service_title,
            $booking->date,
            $booking->time_slot,
            (string) $booking->price,
        ]);
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

        $this->sendCustomerWhatsApp($booking, 'payment_received', [
            $booking->service_title,
            (string) $booking->price,
        ]);
    }

    private function notifyEligibleVendors(Booking $booking): void
    {
        if (! $booking->service_id) {
            return;
        }

        // Find all active vendors who have this service enabled
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
            // Send email notification
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

            // Send real-time Pusher notification to vendor-specific channel
            $this->pusherService->triggerToChannel(
                "vendor-{$vendor->id}",
                'booking:new',
                ['message' => 'New booking available: ' . $booking->service_title, 'booking' => $bookingData]
            );

            // Send WhatsApp notification
            try {
                app(WhatsAppService::class)->sendTemplate(
                    $vendor->contact ?? $vendor->phone ?? '',
                    'new_booking_vendor',
                    [$booking->service_title, $booking->customer_name ?? 'Customer', $booking->date, $booking->time_slot]
                );
            } catch (\Throwable $e) {
                \Log::warning('Vendor WhatsApp notification skipped: ' . $e->getMessage());
            }
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

            $this->sendVendorWhatsApp($vendor, 'new_booking_vendor', [
                $booking->service_title,
                $booking->customer_name,
                $booking->date,
                $booking->time_slot,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Failed to send vendor new booking email: ' . $e->getMessage());
        }
    }

    private function sendVendorAcceptanceEmail(Booking $booking): void
    {
        if (! $booking->vendor_id) {
            return;
        }

        try {
            $vendor = Vendor::query()->find($booking->vendor_id);
            if (! $vendor || ! $vendor->email) {
                return;
            }

            \Mail::to($vendor->email)->send(new \App\Mail\VendorNewBooking(
                CaseKeys::camelize($booking->toArray()),
                $vendor->name
            ));

            $this->sendVendorWhatsApp($vendor, 'booking_accepted_vendor', [
                $booking->service_title,
                $booking->customer_name,
                $booking->date,
                $booking->time_slot,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Failed to send vendor acceptance email: ' . $e->getMessage());
        }
    }

    private function sendVendorCancellationEmail(Booking $booking): void
    {
        if (! $booking->vendor_id) {
            return;
        }

        try {
            $vendor = Vendor::query()->find($booking->vendor_id);
            if (! $vendor || ! $vendor->email) {
                return;
            }

            \Mail::to($vendor->email)->send(new \App\Mail\VendorBookingCancelled(
                CaseKeys::camelize($booking->toArray()),
                $vendor->name
            ));

            $this->sendVendorWhatsApp($vendor, 'booking_cancelled_vendor', [
                $booking->service_title,
                $booking->customer_name,
                $booking->date,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Failed to send vendor cancellation email: ' . $e->getMessage());
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

        $this->sendCustomerWhatsApp(
            $booking,
            'booking_status_update',
            [$booking->service_title, $booking->status]
        );
    }

    // ── WhatsApp Notifications ──────────────────────────────────────────

    /**
     * Send a WhatsApp notification to the customer for a booking event.
     * Gracefully fails if WhatsApp is not configured.
     */
    private function sendCustomerWhatsApp(Booking $booking, string $templateName, array $parameters = []): void
    {
        if (! $booking->customer_phone) {
            return;
        }

        try {
            app(WhatsAppService::class)->sendTemplate(
                $booking->customer_phone,
                $templateName,
                $parameters
            );
        } catch (\Throwable $e) {
            \Log::warning('WhatsApp customer notification skipped: ' . $e->getMessage());
        }
    }

    /**
     * Send a WhatsApp notification to a vendor.
     */
    private function sendVendorWhatsApp(Vendor $vendor, string $templateName, array $parameters = []): void
    {
        if (! $vendor->contact) {
            return;
        }

        try {
            app(WhatsAppService::class)->sendTemplate(
                $vendor->contact,
                $templateName,
                $parameters
            );
        } catch (\Throwable $e) {
            \Log::warning('WhatsApp vendor notification skipped: ' . $e->getMessage());
        }
    }

    // ── Vendor Working Hours ──────────────────────────────────────────

    public function getVendorWorkingHours(string $vendorId): array
    {
        $vendor = Vendor::query()->find($vendorId)
            ?? throw new HttpException(404, 'Vendor not found');

        return $vendor->workingHours()->orderBy('day_of_week')->orderBy('start_time')->get()
            ->map(fn ($wh) => [
                'id' => $wh->id,
                'vendorId' => $wh->vendor_id,
                'dayOfWeek' => $wh->day_of_week,
                'startTime' => $wh->start_time,
                'endTime' => $wh->end_time,
                'isActive' => $wh->is_active,
            ])
            ->all();
    }

    public function updateVendorWorkingHours(string $vendorId, array $payload): array
    {
        $vendor = Vendor::query()->find($vendorId)
            ?? throw new HttpException(404, 'Vendor not found');

        $hours = $payload['hours'] ?? [];

        // Delete existing hours for this vendor
        $vendor->workingHours()->delete();

        // Insert new hours
        $results = [];
        foreach ($hours as $entry) {
            $dayOfWeek = (int) ($entry['dayOfWeek'] ?? -1);
            $startTime = $entry['startTime'] ?? '';
            $endTime = $entry['endTime'] ?? '';
            $isActive = $entry['isActive'] ?? true;

            if ($dayOfWeek < 0 || $dayOfWeek > 6 || ! $startTime || ! $endTime) {
                continue;
            }

            $wh = $vendor->workingHours()->create([
                'id' => SequentialId::next(\App\Models\VendorWorkingHour::class, 'vwh'),
                'vendor_id' => $vendorId,
                'day_of_week' => $dayOfWeek,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'is_active' => $isActive,
            ]);

            $results[] = [
                'id' => $wh->id,
                'vendorId' => $wh->vendor_id,
                'dayOfWeek' => $wh->day_of_week,
                'startTime' => $wh->start_time,
                'endTime' => $wh->end_time,
                'isActive' => $wh->is_active,
            ];
        }

        return $results;
    }

    // ── Available Time Slots ──────────────────────────────────────────

    public function getAvailableTimeSlots(string $serviceId, ?string $date = null, ?string $region = null): array
    {
        return $this->timeSlotCalculator->getAvailableSlots($serviceId, $date, $region);
    }

    // ── Vendor Catalog CSV ──────────────────────────────────────────

    public function exportVendorCatalog(string $vendorId): string
    {
        Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');
        $services = Service::query()->where('active', true)->where('status', 'active')
            ->orderBy('category')->orderBy('title')->get();
        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, ['Service ID', 'Name', 'Category', 'Subcategory', 'Description', 'MRP (AED)', 'Available? (Yes/No)']);
        foreach ($services as $s) {
            fputcsv($csv, [$s->id, $s->title, $s->category, $s->subcategory, strip_tags($s->description ?? $s->short_description ?? ''), $s->price, '']);
        }
        rewind($csv); $content = stream_get_contents($csv); fclose($csv);
        return $content;
    }

    public function importVendorCatalog(string $vendorId, string $filePath): array
    {
        $vendor = Vendor::query()->find($vendorId) ?? throw new HttpException(404, 'Vendor not found');
        $csv = fopen($filePath, 'r'); fgetcsv($csv);
        $enabled = 0; $errors = [];
        while (($row = fgetcsv($csv)) !== false) {
            $serviceId = $row[0] ?? '';
            if (! $serviceId || ! Service::query()->find($serviceId)) continue;
            $isEnabled = in_array(strtolower(trim($row[6] ?? '')), ['yes', 'y', 'true', '1']);
            \App\Models\VendorServiceAssignment::updateOrCreate(
                ['vendor_id' => $vendorId, 'service_id' => $serviceId],
                ['id' => \App\Support\SequentialId::next(\App\Models\VendorServiceAssignment::class, 'vsa'), 'enabled' => $isEnabled],
            );
            if ($isEnabled) $enabled++;
        }
        fclose($csv);
        return ['success' => true, 'vendor' => $vendor->name, 'enabled' => $enabled, 'errors' => $errors];
    }
}
