<?php

namespace Tests\Feature;

use App\Constants\AppConstants;
use App\Models\Booking;
use App\Models\Vendor;
use App\Models\User;
use App\Models\Service;
use App\Models\VendorWorkingHour;
use App\Models\VendorServiceAssignment;
use App\Services\BookingService;
use App\Services\VendorServiceAssignmentService;
use App\Services\PusherService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    private BookingService $bookingService;

    protected function setUp(): void
    {
        parent::setUp();

        $assignmentService = $this->app->make(VendorServiceAssignmentService::class);
        $pusherService = $this->app->make(PusherService::class);
        $this->bookingService = new BookingService($assignmentService, $pusherService);
    }

    public function test_create_booking(): void
    {
        $booking = $this->bookingService->createBooking([
            'customerName' => 'Test User',
            'customerEmail' => 'test@example.com',
            'customerPhone' => '+971501234567',
            'serviceTitle' => 'Nurse Visit',
            'price' => 200,
            'date' => now()->addDays(1)->toDateString(),
            'timeSlot' => '08:00 AM - 10:00 AM',
        ]);

        $this->assertArrayHasKey('id', $booking);
        $this->assertEquals('Test User', $booking['customerName']);
        $this->assertEquals('Pending', $booking['status']);
        $this->assertEquals('Unpaid', $booking['paymentStatus']);
    }

    public function test_cancel_booking(): void
    {
        $booking = $this->bookingService->createBooking([
            'customerName' => 'Test User',
            'customerEmail' => 'test@example.com',
            'serviceTitle' => 'Doctor Visit',
            'price' => 300,
            'date' => now()->addDays(2)->toDateString(),
            'timeSlot' => '10:00 AM - 12:00 PM',
        ]);

        $result = $this->bookingService->cancelBooking($booking['id']);

        $this->assertTrue($result['success']);
        $this->assertEquals('Canceled', $result['updated']['status']);
    }

    public function test_duplicate_booking_blocked(): void
    {
        $payload = [
            'customerName' => 'Duplicate User',
            'customerEmail' => 'dup@example.com',
            'serviceTitle' => 'Physio Session',
            'price' => 150,
            'date' => now()->addDays(3)->toDateString(),
            'timeSlot' => '02:00 PM - 04:00 PM',
        ];

        $first = $this->bookingService->createBooking($payload);
        $this->assertNotNull($first['id']);

        try {
            $this->bookingService->createBooking($payload);
            $this->fail('Expected HttpException(409) was not thrown');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertEquals(409, $e->getStatusCode());
            $this->assertStringContainsString('already exists', $e->getMessage());
        }
    }

    public function test_validate_promo_code(): void
    {
        \App\Models\PromoCode::query()->create([
            'id' => 'promo-test-1',
            'code' => 'TEST10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'max_discount' => 50,
            'min_order' => 100,
            'active' => true,
            'times_used' => 0,
            'max_uses' => 100,
        ]);

        $result = $this->bookingService->validatePromoCode('TEST10', 500);

        $this->assertTrue($result['valid']);
        $this->assertEquals(50, $result['discountAmount']);
    }

    public function test_get_available_time_slots(): void
    {
        $serviceId = 'srv-test-1';

        $slots = $this->bookingService->getAvailableTimeSlots($serviceId, null, null);
        $this->assertCount(8, $slots);

        $this->bookingService->createBooking([
            'customerName' => 'Slot Taker',
            'customerEmail' => 'slot@example.com',
            'serviceTitle' => 'Test Service',
            'price' => 100,
            'date' => now()->addDays(5)->toDateString(),
            'timeSlot' => '08:00 AM - 10:00 AM',
            'serviceId' => $serviceId,
        ]);

        $availableSlots = $this->bookingService->getAvailableTimeSlots(
            $serviceId,
            now()->addDays(5)->toDateString(),
            null,
        );

        $labels = array_column($availableSlots, 'label');
        $this->assertNotContains('08:00 AM - 10:00 AM', $labels);
    }

    public function test_customer_bookings_endpoint(): void
    {
        $user = User::query()->create([
            'id' => 'u-test-1',
            'full_name' => 'Customer',
            'email' => 'customer@test.com',
            'password_hash' => bcrypt('password'),
            'role' => 'customer',
        ]);

        $this->bookingService->createBooking([
            'customerName' => 'Customer',
            'customerEmail' => 'customer@test.com',
            'serviceTitle' => 'Nursing',
            'price' => 250,
            'date' => now()->addDays(1)->toDateString(),
            'timeSlot' => '06:00 AM - 08:00 AM',
        ]);

        $bookings = $this->bookingService->getCustomerBookings('customer@test.com');
        $this->assertCount(1, $bookings);
        $this->assertEquals('Nursing', $bookings[0]['serviceTitle']);
    }

    public function test_bookings_endpoint_requires_auth(): void
    {
        $response = $this->postJson('/bookings', []);
        $response->assertStatus(401);
    }

    public function test_services_endpoint_public(): void
    {
        $response = $this->getJson('/services');
        $response->assertOk();
    }

    public function test_v1_api_version_works(): void
    {
        $response = $this->getJson('/v1/health');
        $response->assertOk();
        $response->assertJson(['status' => 'ok', 'service' => 'medziva-backend']);
    }
}
