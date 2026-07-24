<?php

namespace Tests\Feature;

use App\Models\Vendor;
use App\Services\VendorService;
use App\Services\VendorServiceAssignmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorTest extends TestCase
{
    use RefreshDatabase;

    private VendorService $vendorService;

    protected function setUp(): void
    {
        parent::setUp();
        $assignmentService = $this->app->make(VendorServiceAssignmentService::class);
        $this->vendorService = new VendorService($assignmentService);
    }

    public function test_create_vendor(): void
    {
        $vendor = $this->vendorService->createVendor([
            'name' => 'Test Pharmacy',
            'type' => 'Pharmacy',
            'email' => 'pharmacy@test.com',
            'contact' => '+971501234567',
        ]);

        $this->assertArrayHasKey('id', $vendor);
        $this->assertEquals('Test Pharmacy', $vendor['name']);
    }

    public function test_get_vendors(): void
    {
        $this->vendorService->createVendor(['name' => 'Vendor A', 'type' => 'Pharmacy']);
        $this->vendorService->createVendor(['name' => 'Vendor B', 'type' => 'Lab']);

        $vendors = $this->vendorService->getVendors();
        $this->assertCount(2, $vendors);
    }

    public function test_update_vendor(): void
    {
        $vendor = $this->vendorService->createVendor(['name' => 'Old Name', 'type' => 'Pharmacy']);
        $updated = $this->vendorService->updateVendor($vendor['id'], ['name' => 'New Name']);

        $this->assertEquals('New Name', $updated['name']);
    }

    public function test_delete_vendor(): void
    {
        $vendor = $this->vendorService->createVendor(['name' => 'To Delete', 'type' => 'Pharmacy']);
        $result = $this->vendorService->deleteVendor($vendor['id']);

        $this->assertTrue($result['success']);
        $this->assertCount(0, $this->vendorService->getVendors());
    }

    public function test_vendor_profile_change_request(): void
    {
        $vendor = $this->vendorService->createVendor(['name' => 'Change Me', 'type' => 'Pharmacy']);

        $request = $this->vendorService->createVendorProfileChangeRequest($vendor['id'], [
            'fieldName' => 'name',
            'requestedValue' => 'New Name',
            'reason' => 'Rebranding',
        ]);

        $this->assertArrayHasKey('id', $request);
        $this->assertEquals('pending', $request['status']);

        $result = $this->vendorService->reviewVendorProfileChangeRequest($request['id'], 'approved');
        $this->assertEquals('approved', $result['status']);

        $updatedVendor = $this->vendorService->getVendorProfile($vendor['id']);
        $this->assertEquals('New Name', $updatedVendor['name']);
    }
}
