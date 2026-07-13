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

        $vendorCost = 0;
        $vendorId = $payload['vendorId'] ?? null;
        if ($vendorId && isset($payload['serviceId'])) {
            $assignment = \App\Models\VendorServiceAssignment::query()
                ->where('vendor_id', $vendorId)
                ->where('service_id', $payload['serviceId'])
                ->first();
            $vendorCost = $assignment?->vendor_price ?? 0;
        }

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
            'price' => (int) ($payload['price'] ?? 150),
            'cost' => $vendorCost,
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
            'expires_at' => now()->addHours(2),
            'notes' => $payload['notes'] ?? '',
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
        $booking->forceFill(['status' => AppConstants::BOOKING_STATUSES['CANCELLED']])->save();

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
