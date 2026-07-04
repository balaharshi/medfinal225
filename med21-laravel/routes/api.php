<?php

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
        Route::post('/apple', [AuthController::class, 'apple'])->middleware('throttle:10,1');
        Route::post('/apple/callback', [AuthController::class, 'apple'])->middleware('throttle:10,1');
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('api.auth');
        Route::get('/session', [AuthController::class, 'session'])->middleware('api.auth');
        Route::get('/profile', [AuthController::class, 'profile'])->middleware('api.auth');
        Route::put('/profile', [AuthController::class, 'updateProfile'])->middleware('api.auth');
        Route::put('/change-password', [AuthController::class, 'changePassword'])->middleware('api.auth');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    });

    Route::post('/payments/enbd/create', [PaymentController::class, 'createEnbdpayCheckout'])->middleware('throttle:5,1');
    Route::get('/payments/enbd/status', [PaymentController::class, 'getEnbdpayStatus'])->middleware('throttle:30,1');
    Route::post('/payments/enbd/webhook', [PaymentController::class, 'enbdpayWebhook']);

    Route::get('/categories', [CatalogController::class, 'getCategories']);
    Route::post('/categories', [CatalogController::class, 'createCategory'])->middleware($admin);
    Route::patch('/category/{id}', [CatalogController::class, 'updateCategory'])->middleware($admin);
    Route::delete('/category/{id}', [CatalogController::class, 'deleteCategory'])->middleware($admin);
    Route::delete('/categories/{id}', [CatalogController::class, 'deleteCategory'])->middleware($admin);
    Route::post('/categories/{catId}/subcategories', [CatalogController::class, 'createSubcategory'])->middleware($admin);
    Route::post('/subcategories/{catId}', [CatalogController::class, 'createSubcategory'])->middleware($admin);
    Route::delete('/categories/{catId}/subcategories/{subId}', [CatalogController::class, 'deleteSubcategory'])->middleware($admin);
    Route::delete('/subcategory/{catId}/{subId}', [CatalogController::class, 'deleteSubcategory'])->middleware($admin);

    Route::get('/products', [CatalogController::class, 'getProducts']);
    Route::post('/products', [CatalogController::class, 'createProduct'])->middleware($admin);
    Route::delete('/products/{id}', [CatalogController::class, 'deleteProduct'])->middleware($admin);

    Route::get('/services/all', [CatalogController::class, 'getAllServices'])->middleware($admin);
    Route::get('/services', [CatalogController::class, 'getServices']);
    Route::post('/services', [CatalogController::class, 'createService'])->middleware($admin);
    Route::patch('/service/{id}', [CatalogController::class, 'updateService'])->middleware($admin);
    Route::patch('/services/{id}', [CatalogController::class, 'updateService'])->middleware($admin);
    Route::delete('/service/{id}', [CatalogController::class, 'deleteService'])->middleware($admin);
    Route::delete('/services/{id}', [CatalogController::class, 'deleteService'])->middleware($admin);

    Route::get('/vendors', [CatalogController::class, 'getVendors']);
    Route::get('/users', [CatalogController::class, 'getUsers'])->middleware($admin);
    Route::post('/vendors', [CatalogController::class, 'createVendor'])->middleware($admin);
    Route::patch('/vendor/{id}', [CatalogController::class, 'updateVendor'])->middleware($admin);
    Route::delete('/vendors/{id}', [CatalogController::class, 'deleteVendor'])->middleware($admin);
    Route::get('/vendorBookings/{vendorId}', [CatalogController::class, 'getVendorBookings'])->middleware($vendorSelfOrAdmin);
    Route::post('/vendorBookings/{vendorId}/{id}/accept', [CatalogController::class, 'acceptVendorBooking'])->middleware($vendorSelfOrAdmin);
    Route::patch('/vendorBookings/{vendorId}/{id}/status', [CatalogController::class, 'updateVendorBookingStatus'])->middleware($vendorSelfOrAdmin);
    Route::get('/vendorServices/{vendorId}', [CatalogController::class, 'getVendorServices'])->middleware($vendorSelfOrAdmin);
    Route::get('/vendors/{vendorId}/service-assignments', [VendorServiceAssignmentController::class, 'index'])->middleware($admin);
    Route::patch('/vendors/{vendorId}/service-assignments/{serviceId}', [VendorServiceAssignmentController::class, 'update'])->middleware($admin);
    Route::post('/vendors/{vendorId}/service-assignments/bulk', [VendorServiceAssignmentController::class, 'bulk'])->middleware($admin);
    Route::get('/vendorProfile/{vendorId}', [CatalogController::class, 'getVendorProfile'])->middleware($vendorSelfOrAdmin);
    Route::patch('/vendorProfile/{vendorId}', [CatalogController::class, 'updateVendorProfile'])->middleware($vendorSelfOrAdmin);
    Route::post('/vendorLogin', [AuthController::class, 'vendorLogin'])->middleware('throttle:10,1');

    Route::get('/bookings', [CatalogController::class, 'getBookings'])->middleware($admin);
    Route::post('/bookings', [CatalogController::class, 'createBooking'])->middleware('api.auth');
    Route::patch('/booking/{id}', [CatalogController::class, 'updateBooking'])->middleware($admin);
    Route::delete('/booking/{id}', [CatalogController::class, 'cancelBooking'])->middleware($admin);
    Route::delete('/bookings/{id}', [CatalogController::class, 'cancelBooking'])->middleware($admin);

    Route::get('/my-bookings', [CatalogController::class, 'getMyBookings'])->middleware('api.auth');
    Route::delete('/my-bookings/{id}', [CatalogController::class, 'cancelMyBooking'])->middleware('api.auth');

    Route::get('/enquiries', [CatalogController::class, 'getEnquiries'])->middleware($admin);
    Route::post('/enquiries', [CatalogController::class, 'createEnquiry']);
    Route::post('/enquiryStatus/{id}', [CatalogController::class, 'updateEnquiryStatus'])->middleware($admin);
    Route::post('/enquiries/{id}/status', [CatalogController::class, 'updateEnquiryStatus'])->middleware($admin);
    Route::delete('/enquiry/{id}', [CatalogController::class, 'deleteEnquiry'])->middleware($admin);
    Route::delete('/enquiries/{id}', [CatalogController::class, 'deleteEnquiry'])->middleware($admin);

    Route::post('/promos/validate', [CatalogController::class, 'validatePromo'])->middleware('throttle:20,1');

    Route::get('/settings', [CatalogController::class, 'getSettings'])->middleware($admin);
    Route::post('/settings', [CatalogController::class, 'updateSettings'])->middleware($admin);
};

$registerMedzivaRoutes();
Route::prefix('v1')->group($registerMedzivaRoutes);
