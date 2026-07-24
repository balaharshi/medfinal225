<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use App\Services\CatalogManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogManagementTest extends TestCase
{
    use RefreshDatabase;

    private CatalogManagementService $catalogService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->catalogService = $this->app->make(CatalogManagementService::class);
    }

    public function test_create_category(): void
    {
        $category = $this->catalogService->createCategory([
            'title' => 'Test Category',
            'description' => 'A test category',
            'type' => 'service',
        ]);

        $this->assertArrayHasKey('id', $category);
        $this->assertEquals('Test Category', $category['title']);
        $this->assertEquals('test-category', $category['slug']);
    }

    public function test_get_categories(): void
    {
        $this->catalogService->createCategory(['title' => 'Cat A', 'type' => 'service']);
        $this->catalogService->createCategory(['title' => 'Cat B', 'type' => 'service']);

        $categories = $this->catalogService->getCategories();
        $this->assertCount(2, $categories);
    }

    public function test_delete_category(): void
    {
        $cat = $this->catalogService->createCategory(['title' => 'To Delete', 'type' => 'service']);
        $result = $this->catalogService->deleteCategory($cat['id']);

        $this->assertTrue($result['success']);
        $this->assertCount(0, $this->catalogService->getCategories());
    }

    public function test_create_product(): void
    {
        $product = $this->catalogService->createProduct([
            'name' => 'Wheel Chair',
            'price' => 150,
            'category' => 'devices-for-rent',
        ]);

        $this->assertArrayHasKey('id', $product);
        $this->assertEquals('Wheel Chair', $product['name']);
        $this->assertEquals(150, $product['price']);
    }

    public function test_get_products(): void
    {
        $this->catalogService->createProduct(['name' => 'P1', 'price' => 100, 'category' => 'devices-for-rent']);
        $this->catalogService->createProduct(['name' => 'P2', 'price' => 200, 'category' => 'devices-for-rent']);

        $products = $this->catalogService->getProducts();
        $this->assertCount(2, $products);
    }

    public function test_create_service(): void
    {
        $service = $this->catalogService->createService([
            'title' => 'Nurse Visit',
            'category' => 'home-healthcare',
            'subcategory' => 'nursing-care-at-home',
            'price' => 250,
        ]);

        $this->assertArrayHasKey('id', $service);
        $this->assertEquals('Nurse Visit', $service['title']);
        $this->assertEquals(250, $service['price']);
    }

    public function test_get_services(): void
    {
        $this->catalogService->createService([
            'title' => 'Service A',
            'category' => 'home-healthcare',
            'price' => 100,
        ]);
        $this->catalogService->createService([
            'title' => 'Service B',
            'category' => 'home-healthcare',
            'price' => 200,
        ]);

        $services = $this->catalogService->getServices(true);
        $this->assertCount(2, $services);
    }

    public function test_create_subcategory(): void
    {
        $cat = $this->catalogService->createCategory(['title' => 'Parent', 'type' => 'service']);
        $sub = $this->catalogService->createSubcategory($cat['id'], ['title' => 'Child']);

        $this->assertArrayHasKey('id', $sub);
        $this->assertEquals('Child', $sub['title']);
    }
}
