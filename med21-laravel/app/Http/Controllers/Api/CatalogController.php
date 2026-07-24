<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\BookingRequest;
use App\Http\Requests\CategoryRequest;
use App\Http\Requests\EnquiryRequest;
use App\Http\Requests\ProductRequest;
use App\Http\Requests\ServiceRequest;
use App\Http\Requests\SubcategoryRequest;
use App\Http\Requests\VendorRequest;
use App\Services\BookingService;
use App\Services\CatalogManagementService;
use App\Services\EnquiryService;
use App\Services\PusherService;
use App\Services\SettingsService;
use App\Services\VendorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function __construct(
        private readonly CatalogManagementService $catalogManagementService,
        private readonly BookingService $bookingService,
        private readonly VendorService $vendorService,
        private readonly EnquiryService $enquiryService,
        private readonly SettingsService $settingsService,
        private readonly PusherService $pusherService,
    ) {
    }

    public function getDatabase(): JsonResponse { return response()->json($this->catalogManagementService->getDatabase()); }
    public function getCategories(): JsonResponse { return response()->json(Cache::remember('api.categories', 1800, fn () => $this->catalogManagementService->getCategories())); }
    public function createCategory(CategoryRequest $request): JsonResponse { Cache::forget('api.categories'); return response()->json($this->catalogManagementService->createCategory($request->validated()), 201); }
    public function updateCategory(CategoryRequest $request, string $id): JsonResponse { Cache::forget('api.categories'); return response()->json($this->catalogManagementService->updateCategory($id, $request->validated())); }
    public function deleteCategory(string $id): JsonResponse { Cache::forget('api.categories'); return response()->json($this->catalogManagementService->deleteCategory($id)); }
    public function createSubcategory(SubcategoryRequest $request, string $catId): JsonResponse { Cache::forget('api.categories'); return response()->json($this->catalogManagementService->createSubcategory($catId, $request->validated()), 201); }
    public function deleteSubcategory(string $catId, string $subId): JsonResponse { Cache::forget('api.categories'); return response()->json($this->catalogManagementService->deleteSubcategory($catId, $subId)); }
    public function getProducts(): JsonResponse { return response()->json(Cache::remember('api.products', 600, fn () => $this->catalogManagementService->getProducts())); }
    public function createProduct(ProductRequest $request): JsonResponse { Cache::forget('api.products'); return response()->json($this->catalogManagementService->createProduct($request->all()), 201); }
    public function deleteProduct(string $id): JsonResponse { Cache::forget('api.products'); return response()->json($this->catalogManagementService->deleteProduct($id)); }
    public function getServices(): JsonResponse { return response()->json(Cache::remember('api.services', 300, fn () => $this->catalogManagementService->getServices())); }
    public function getAllServices(): JsonResponse { return response()->json($this->catalogManagementService->getServices(true)); }
    public function createService(ServiceRequest $request): JsonResponse { Cache::forget('api.services'); return response()->json($this->catalogManagementService->createService($request->all()), 201); }
    public function updateService(ServiceRequest $request, string $id): JsonResponse { Cache::forget('api.services'); Cache::forget('api.categories'); return response()->json($this->catalogManagementService->updateService($id, $request->all())); }
    public function deleteService(string $id): JsonResponse { Cache::forget('api.services'); Cache::forget('api.categories'); return response()->json($this->catalogManagementService->deleteService($id)); }
    public function getVendors(): JsonResponse { return response()->json($this->vendorService->getVendors()); }
    public function getUsers(): JsonResponse { return response()->json($this->catalogManagementService->getUsers()); }
    public function deleteUser(Request $request, string $id): JsonResponse { return response()->json($this->catalogManagementService->deleteUser($id, $request->user()->role)); }
    public function createVendor(VendorRequest $request): JsonResponse { return response()->json($this->vendorService->createVendor($request->validated()), 201); }
    public function updateVendor(VendorRequest $request, string $id): JsonResponse { return response()->json($this->vendorService->updateVendor($id, $request->all())); }
    public function deleteVendor(string $id): JsonResponse { return response()->json($this->vendorService->deleteVendor($id)); }
    public function getVendorBookings(string $vendorId): JsonResponse { return response()->json($this->bookingService->getVendorBookings($vendorId)); }
    public function getVendorServices(string $vendorId): JsonResponse { return response()->json($this->vendorService->getVendorServices($vendorId)); }
    public function getVendorProfile(string $vendorId): JsonResponse { return response()->json($this->vendorService->getVendorProfile($vendorId)); }

    public function updateVendorProfile(Request $request, string $vendorId): JsonResponse
    {
        return response()->json(['success' => true, ...$this->vendorService->updateVendor($vendorId, $request->only(['name', 'type', 'contact', 'address']))]);
    }

    public function getBookings(): JsonResponse { return response()->json($this->bookingService->getBookings()); }
    public function getBooking(string $id): JsonResponse { return response()->json($this->bookingService->getBooking($id)); }

    public function createBooking(BookingRequest $request): JsonResponse
    {
        $booking = $this->bookingService->createBooking($request->all(), $request->user()?->id);
        $this->pusherService->triggerEvent('appointment:update', ['action' => 'created', 'message' => 'New appointment booked for '.$booking['serviceTitle'], 'booking' => $booking]);

        return response()->json($booking, 201);
    }

    public function createBookingsBatch(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1|max:50',
            'items.*.customerName' => 'required|string|max:255',
            'items.*.customerEmail' => 'required|email|max:255',
            'items.*.serviceTitle' => 'required|string|max:255',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.date' => 'required|date|after_or_equal:today',
        ]);

        $result = $this->bookingService->createBookingsBatch(
            $request->input('items'),
            $request->input('paymentGroupId'),
            $request->user()?->id,
        );

        foreach ($result['bookings'] as $booking) {
            $this->pusherService->triggerEvent('appointment:update', [
                'action' => 'created',
                'message' => 'New appointment booked for '.$booking['serviceTitle'],
                'booking' => $booking,
            ]);
        }

        return response()->json($result, 201);
    }

    public function updateBooking(Request $request, string $id): JsonResponse
    {
        $booking = $this->bookingService->updateBooking($id, $request->all());
        $this->pusherService->triggerEvent('appointment:update', ['action' => 'updated', 'message' => 'Appointment '.$booking['id'].' was updated', 'booking' => $booking]);

        return response()->json($booking);
    }

    public function cancelBooking(string $id): JsonResponse
    {
        $result = $this->bookingService->cancelBooking($id);
        $this->pusherService->triggerEvent('appointment:update', ['action' => 'cancelled', 'message' => "Appointment {$id} was cancelled", 'booking' => $result['updated']]);

        return response()->json($result);
    }

    public function acceptVendorBooking(string $vendorId, string $id): JsonResponse
    {
        $booking = $this->bookingService->acceptVendorBooking($id, $vendorId);
        $this->pusherService->triggerEvent('order:update', ['message' => 'Booking '.$booking['id'].' was accepted', 'booking' => $booking]);

        return response()->json(['success' => true, 'booking' => $booking]);
    }

    public function getMyBookings(Request $request): JsonResponse
    {
        $email = $request->user()->email;
        return response()->json($this->bookingService->getCustomerBookings($email));
    }

    public function cancelMyBooking(Request $request, string $id): JsonResponse
    {
        $email = $request->user()->email;
        $refundToWallet = $request->boolean('refundToWallet', false);
        $booking = $this->bookingService->cancelCustomerBooking($id, $email, $refundToWallet, $request->user()->id);
        $this->pusherService->triggerEvent('appointment:update', ['action' => 'cancelled', 'message' => "Booking {$id} was cancelled by customer", 'booking' => $booking]);

        return response()->json(['success' => true, 'booking' => $booking]);
    }

    public function rescheduleMyBooking(Request $request, string $id): JsonResponse
    {
        $email = $request->user()->email;
        $booking = $this->bookingService->rescheduleCustomerBooking(
            $id,
            $email,
            $request->input('date'),
            $request->input('timeSlot'),
        );
        $this->pusherService->triggerEvent('appointment:update', ['action' => 'rescheduled', 'message' => "Booking {$id} was rescheduled by customer", 'booking' => $booking]);

        return response()->json(['success' => true, 'booking' => $booking]);
    }

    public function updateVendorBookingStatus(Request $request, string $vendorId, string $id): JsonResponse
    {
        $status = $request->input('status');
        $booking = $this->bookingService->updateVendorBookingStatus($id, $vendorId, $status);
        $this->pusherService->triggerEvent('appointment:update', ['action' => 'status_updated', 'message' => "Booking {$id} status updated to {$status}", 'booking' => $booking]);

        return response()->json(['success' => true, 'booking' => $booking]);
    }

    public function getEnquiries(): JsonResponse { return response()->json($this->enquiryService->getEnquiries()); }

    public function createEnquiry(EnquiryRequest $request): JsonResponse
    {
        $enquiry = $this->enquiryService->createEnquiry($request->all());
        $this->pusherService->triggerNotification('New enquiry submitted for '.$enquiry['serviceTitle'], ['enquiry' => $enquiry]);

        return response()->json($enquiry, 201);
    }

    public function updateEnquiryStatus(Request $request, string $id): JsonResponse { return response()->json($this->enquiryService->updateEnquiryStatus($id, $request->input('status'))); }
    public function deleteEnquiry(string $id): JsonResponse { return response()->json($this->enquiryService->deleteEnquiry($id)); }
    public function validatePromo(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'orderAmount' => 'required|integer|min:0',
        ]);

        return response()->json($this->bookingService->validatePromoCode($request->input('code'), $request->integer('orderAmount')));
    }

    public function getSettings(): JsonResponse { return response()->json($this->settingsService->getSettings()); }
    public function updateSettings(Request $request): JsonResponse { return response()->json($this->settingsService->updateSettings($request->all())); }

    public function getVendorProfileChangeRequests(string $vendorId): JsonResponse
    {
        return response()->json($this->vendorService->getVendorProfileChangeRequests($vendorId));
    }

    public function getAllVendorProfileChangeRequests(): JsonResponse
    {
        return response()->json($this->vendorService->getAllVendorProfileChangeRequests());
    }

    public function createVendorProfileChangeRequest(Request $request, string $vendorId): JsonResponse
    {
        $request->validate([
            'fieldName' => 'required|string|in:name,type,contact,address,email',
            'requestedValue' => 'required|string|max:500',
            'reason' => 'nullable|string|max:1000',
        ]);

        return response()->json($this->vendorService->createVendorProfileChangeRequest($vendorId, $request->all()), 201);
    }

    public function reviewVendorProfileChangeRequest(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'remarks' => 'nullable|string|max:1000',
        ]);

        return response()->json($this->vendorService->reviewVendorProfileChangeRequest($id, $request->input('status'), $request->input('remarks')));
    }

    public function getVendorSlaMetrics(): JsonResponse
    {
        return response()->json($this->vendorService->getVendorSlaMetrics());
    }

    public function getVendorWorkingHours(Request $request, string $vendorId): JsonResponse
    {
        return response()->json($this->vendorService->getVendorWorkingHours($vendorId));
    }

    public function updateVendorWorkingHours(Request $request, string $vendorId): JsonResponse
    {
        return response()->json($this->vendorService->updateVendorWorkingHours($vendorId, $request->all()));
    }

    public function getAvailableSlots(Request $request, string $serviceId): JsonResponse
    {
        $date = $request->query('date');
        $region = $request->query('region');
        return response()->json($this->bookingService->getAvailableTimeSlots($serviceId, $date, $region));
    }

    public function getRevenueReport(Request $request): JsonResponse
    {
        return response()->json($this->settingsService->getRevenueReport(
            $request->query('from'),
            $request->query('to'),
        ));
    }

    public function exportVendorCatalog(string $vendorId): \Illuminate\Http\Response
    {
        $csv = $this->vendorService->exportVendorCatalog($vendorId);
        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="medziva-service-catalog.csv"',
        ]);
    }

    public function importVendorCatalog(Request $request, string $vendorId): JsonResponse
    {
        $file = $request->file('catalog');
        if (! $file || ! $file->isValid()) {
            return response()->json(['error' => 'CSV file is required'], 422);
        }
        $result = $this->vendorService->importVendorCatalog($vendorId, $file->path());
        return response()->json($result);
    }
}
