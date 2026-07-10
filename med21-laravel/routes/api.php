<?php

use App\Http\Controllers\Api\AdminPaymentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\VendorServiceAssignmentController;
use Illuminate\Support\Facades\Route;

$admin = ['api.auth', 'role:super_admin,admin'];
$vendorSelfOrAdmin = ['api.auth', 'vendor.self_or_admin'];

$registerMedzivaRoutes = function () use ($admin, $vendorSelfOrAdmin): void {
    Route::get('/health', HealthController::class);
    Route::get('/db', [CatalogController::class, 'getDatabase'])->middleware($admin);

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('/google', [AuthController::class, 'oauth'])->middleware('throttle:10,1');
        Route::post('/google/admin', [AuthController::class, 'oauthAdmin'])->middleware('throttle:5,1');
        Route::post('/google/vendor', [AuthController::class, 'oauthVendor'])->middleware('throttle:5,1');
        Route::post('/google/callback', [AuthController::class, 'oauth']);
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('api.auth');
        Route::get('/session', [AuthController::class, 'session'])->middleware('api.auth');
        Route::get('/profile', [AuthController::class, 'profile'])->middleware('api.auth');
        Route::put('/profile', [AuthController::class, 'updateProfile'])->middleware('api.auth');
        Route::put('/change-password', [AuthController::class, 'changePassword'])->middleware('api.auth');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    });

    Route::post('/payments/enbd/create', [PaymentController::class, 'createEnbdpayCheckout'])->middleware('api.auth', 'throttle:5,1');
    Route::get('/payments/enbd/status', [PaymentController::class, 'getEnbdpayStatus'])->middleware('throttle:30,1');
    Route::post('/payments/enbd/webhook', [PaymentController::class, 'enbdpayWebhook'])->middleware('throttle:60,1');
    Route::post('/payments/enbd/capture', [PaymentController::class, 'captureTransaction'])->middleware($admin, 'throttle:10,1');
    Route::post('/payments/enbd/refund', [PaymentController::class, 'refundTransaction'])->middleware($admin, 'throttle:10,1');
    Route::post('/payments/enbd/void/auth', [PaymentController::class, 'voidAuthorization'])->middleware($admin, 'throttle:10,1');
    Route::post('/payments/enbd/void/capture', [PaymentController::class, 'voidCapture'])->middleware($admin, 'throttle:10,1');
    Route::post('/payments/enbd/void/refund', [PaymentController::class, 'voidRefund'])->middleware($admin, 'throttle:10,1');

    Route::get('/categories', [CatalogController::class, 'getCategories'])->middleware('throttle:60,1');
    Route::post('/categories', [CatalogController::class, 'createCategory'])->middleware($admin);
    Route::patch('/category/{id}', [CatalogController::class, 'updateCategory'])->middleware($admin);
    Route::delete('/category/{id}', [CatalogController::class, 'deleteCategory'])->middleware($admin);
    Route::post('/categories/{catId}/subcategories', [CatalogController::class, 'createSubcategory'])->middleware($admin);
    Route::delete('/categories/{catId}/subcategories/{subId}', [CatalogController::class, 'deleteSubcategory'])->middleware($admin);

    Route::get('/products', [CatalogController::class, 'getProducts'])->middleware('throttle:60,1');
    Route::post('/products', [CatalogController::class, 'createProduct'])->middleware($admin);
    Route::delete('/products/{id}', [CatalogController::class, 'deleteProduct'])->middleware($admin);

    Route::get('/services/all', [CatalogController::class, 'getAllServices'])->middleware($admin);
    Route::get('/services', [CatalogController::class, 'getServices'])->middleware('throttle:60,1');
    Route::post('/services', [CatalogController::class, 'createService'])->middleware($admin);
    Route::patch('/services/{id}', [CatalogController::class, 'updateService'])->middleware($admin);
    Route::delete('/services/{id}', [CatalogController::class, 'deleteService'])->middleware($admin);
    Route::get('/services/{serviceId}/available-slots', [CatalogController::class, 'getAvailableSlots'])->middleware('throttle:30,1');

    Route::get('/vendors', [CatalogController::class, 'getVendors'])->middleware('throttle:60,1');
    Route::get('/users', [CatalogController::class, 'getUsers'])->middleware($admin);
    Route::delete('/users/{id}', [CatalogController::class, 'deleteUser'])->middleware($admin);
    Route::post('/vendors', [CatalogController::class, 'createVendor'])->middleware($admin);
    Route::patch('/vendor/{id}', [CatalogController::class, 'updateVendor'])->middleware($admin);
    Route::delete('/vendors/{id}', [CatalogController::class, 'deleteVendor'])->middleware($admin);
    Route::get('/vendorBookings/{vendorId}', [CatalogController::class, 'getVendorBookings'])->middleware($vendorSelfOrAdmin);
    Route::post('/vendorBookings/{vendorId}/{id}/accept', [CatalogController::class, 'acceptVendorBooking'])->middleware($vendorSelfOrAdmin, 'throttle:10,1');
    Route::patch('/vendorBookings/{vendorId}/{id}/status', [CatalogController::class, 'updateVendorBookingStatus'])->middleware($vendorSelfOrAdmin, 'throttle:10,1');
    Route::get('/vendorServices/{vendorId}', [CatalogController::class, 'getVendorServices'])->middleware($vendorSelfOrAdmin);
    Route::get('/vendors/{vendorId}/service-assignments', [VendorServiceAssignmentController::class, 'index'])->middleware($admin);
    Route::patch('/vendors/{vendorId}/service-assignments/{serviceId}', [VendorServiceAssignmentController::class, 'update'])->middleware($admin);
    Route::post('/vendors/{vendorId}/service-assignments/bulk', [VendorServiceAssignmentController::class, 'bulk'])->middleware($admin);
    Route::get('/vendors/{vendorId}/export-catalog', [CatalogController::class, 'exportVendorCatalog'])->middleware($admin);
    Route::post('/vendors/{vendorId}/import-catalog', [CatalogController::class, 'importVendorCatalog'])->middleware($admin);
    Route::get('/vendorProfile/{vendorId}', [CatalogController::class, 'getVendorProfile'])->middleware($vendorSelfOrAdmin);
    Route::patch('/vendorProfile/{vendorId}', [CatalogController::class, 'updateVendorProfile'])->middleware($admin);
    Route::get('/vendorProfile/{vendorId}/change-requests', [CatalogController::class, 'getVendorProfileChangeRequests'])->middleware($vendorSelfOrAdmin);
    Route::post('/vendorProfile/{vendorId}/change-requests', [CatalogController::class, 'createVendorProfileChangeRequest'])->middleware($vendorSelfOrAdmin);
    Route::get('/vendor-working-hours/{vendorId}', [CatalogController::class, 'getVendorWorkingHours'])->middleware($vendorSelfOrAdmin);
    Route::put('/vendor-working-hours/{vendorId}', [CatalogController::class, 'updateVendorWorkingHours'])->middleware($vendorSelfOrAdmin);
    Route::get('/vendorProfileChangeRequests', [CatalogController::class, 'getAllVendorProfileChangeRequests'])->middleware($admin);
    Route::patch('/vendorProfileChangeRequests/{id}/review', [CatalogController::class, 'reviewVendorProfileChangeRequest'])->middleware($admin);

    Route::get('/admin/vendor-sla', [CatalogController::class, 'getVendorSlaMetrics'])->middleware($admin);
    Route::get('/admin/reports/revenue', [CatalogController::class, 'getRevenueReport'])->middleware($admin);
    Route::post('/vendorLogin', [AuthController::class, 'vendorLogin'])->middleware('throttle:10,1');

    Route::get('/bookings', [CatalogController::class, 'getBookings'])->middleware($admin);
    Route::get('/booking/{id}', [CatalogController::class, 'getBooking'])->middleware($admin);
    Route::post('/bookings', [CatalogController::class, 'createBooking'])->middleware('api.auth', 'throttle:10,1');
    Route::patch('/booking/{id}', [CatalogController::class, 'updateBooking'])->middleware($admin);
    Route::delete('/booking/{id}', [CatalogController::class, 'cancelBooking'])->middleware($admin);

    Route::get('/my-bookings', [CatalogController::class, 'getMyBookings'])->middleware('api.auth');
    Route::delete('/my-bookings/{id}', [CatalogController::class, 'cancelMyBooking'])->middleware('api.auth', 'throttle:10,1');
    Route::post('/my-bookings/{id}/reschedule', [CatalogController::class, 'rescheduleMyBooking'])->middleware('api.auth', 'throttle:10,1');

    Route::get('/enquiries', [CatalogController::class, 'getEnquiries'])->middleware($admin);
    Route::post('/enquiries', [CatalogController::class, 'createEnquiry'])->middleware('throttle:10,1');
    Route::post('/enquiries/{id}/status', [CatalogController::class, 'updateEnquiryStatus'])->middleware($admin);
    Route::delete('/enquiries/{id}', [CatalogController::class, 'deleteEnquiry'])->middleware($admin);

    Route::post('/promos/validate', [CatalogController::class, 'validatePromo'])->middleware('throttle:20,1');

    Route::post('/newsletter/subscribe', function (Illuminate\Http\Request $request) {
        $request->validate(['email' => 'required|email|max:255']);
        \DB::table('newsletter_subscriptions')->updateOrInsert(
            ['email' => $request->email],
            ['subscribed_at' => now()]
        );
        return response()->json(['message' => 'Subscribed successfully']);
    })->middleware('throttle:5,1');

    Route::get('/whatsapp/webhook', [App\Http\Controllers\Api\WhatsAppController::class, 'verify'])->middleware('throttle:30,1');
    Route::post('/whatsapp/webhook', [App\Http\Controllers\Api\WhatsAppController::class, 'handleIncoming'])->middleware('throttle:30,1');

    Route::get('/settings', [CatalogController::class, 'getSettings'])->middleware($admin);
    Route::post('/settings', [CatalogController::class, 'updateSettings'])->middleware($admin);

    Route::prefix('admin/payments')->middleware($admin)->group(function (): void {
        Route::get('/pending', [AdminPaymentController::class, 'getPendingPayments']);
        Route::post('/capture', [AdminPaymentController::class, 'captureAuth']);
        Route::post('/void', [AdminPaymentController::class, 'voidAuth']);
        Route::post('/update-amount', [AdminPaymentController::class, 'updateAmount']);
    });
};

$registerMedzivaRoutes();
