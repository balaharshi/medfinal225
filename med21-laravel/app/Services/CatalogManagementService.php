<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use App\Models\Subcategory;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CatalogManagementService
{
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

    public function getDatabase(): array
    {
        return [
            'categories' => $this->getCategories(),
            'products' => $this->getProducts(),
            'services' => $this->getServices(true),
            'vendors' => app(VendorService::class)->getVendors(),
            'settings' => app(SettingsService::class)->getSettings(),
            'bookings' => app(BookingService::class)->getBookings(),
            'enquiries' => app(EnquiryService::class)->getEnquiries(),
        ];
    }

    public function createCategory(array $payload): array
    {
        $category = Category::query()->create([
            'id' => SequentialId::next(Category::class, 'cat'),
            'title' => $payload['title'],
            'slug' => Str::slug($payload['title']),
            'image' => $payload['image'] ?? $this->defaultImage(),
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
            'image' => array_key_exists('image', $payload) ? ($payload['image'] !== '' ? $payload['image'] : null) : null,
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
            'image' => $payload['image'] ?? $this->defaultImage(),
            'category' => $payload['category'] ?? 'devices-for-rent',
            'subcategory' => $payload['subcategory'] ?? '',
            'brand' => $payload['brand'] ?? 'MedZiva Store',
            'rating' => (float) ($payload['rating'] ?? 5),
            'in_stock' => $payload['inStock'] ?? true,
            'description' => $payload['description'] ?? '',
            'attributes' => is_array($payload['attributes'] ?? null) ? $payload['attributes'] : [],
            'vendor_prices' => is_array($payload['vendorPrices'] ?? null) ? $payload['vendorPrices'] : [],
            'rental_duration' => $payload['rentalDuration'] ?? null,
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
        $query = Service::query()->with('assignments.vendor')->orderBy('display_priority')->orderByDesc('updated_at');
        if (! $includeHidden) {
            $query->where('active', true)->where('status', 'active');
        }

        return CaseKeys::camelize($query->get()->map(function (Service $service): array {
            $data = $service->toArray();
            $dbPrices = $service->getAttribute('vendor_prices') ?? [];
            $assignments = $service->getRelation('assignments') ?? collect();
            $assignmentPrices = $assignments
                ->filter(fn ($a) => $a->enabled && $a->vendor)
                ->map(fn ($a) => [
                    'vendorName' => $a->vendor->name,
                    'price' => (int) ($a->vendor_price ?: $data['price'] ?? 0),
                ])
                ->values()
                ->all();
            $data['vendor_prices'] = $dbPrices
                ? array_map(fn ($vp) => [
                    'vendorName' => $vp['vendorName'] ?? $vp['vendor_name'] ?? $vp['name'] ?? '',
                    'price' => (int) ($vp['price'] ?? $data['price'] ?? 0),
                ], $dbPrices)
                : $assignmentPrices;
            unset($data['assignments']);

            return $data;
        })->all());
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

    private function defaultImage(): string
    {
        return config('app.url') . '/images/default-service.jpg';
    }

    public function getUsers(): array
    {
        return CaseKeys::camelize(\App\Models\User::query()->orderByDesc('created_at')->get());
    }

    public function deleteUser(string $id, string $role): array
    {
        $user = \App\Models\User::query()->find($id) ?? throw new HttpException(404, 'User not found');
        if ($role !== 'admin') {
            throw new HttpException(403, 'Only admins can delete users');
        }
        $deleted = CaseKeys::camelize($user);
        $user->delete();

        return ['success' => true, 'deleted' => [$deleted]];
    }

    public function normalizeServicePayload(array $payload, bool $partial = false): array
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
        $set('image', $payload['image'] ?? ($partial ? null : $this->defaultImage()));
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

        $name = str_ireplace('physiotheraphy', 'Physiotherapy', $name);
        $name = str_ireplace('physiotherapy', 'Physiotherapy', $name);

        $name = preg_replace('/(\w)-(\w)/', '$1 - $2', $name);
        $name = preg_replace('/(\w)-\s/', '$1 - ', $name);
        $name = preg_replace('/\s-(\w)/', ' - $1', $name);

        $name = ucfirst(trim($name));

        $name = preg_replace('/\s*-\s*/', ' - ', $name);

        $name = preg_replace('/\s+/', ' ', trim($name));

        return $name;
    }

    private function sanitizeDescription(?string $description): ?string
    {
        if ($description === null || $description === '') {
            return $description;
        }

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

        $description = str_ireplace('prioir', 'prior', $description);
        $description = str_ireplace('recieve', 'receive', $description);
        $description = str_ireplace('seperate', 'separate', $description);

        $description = preg_replace('/\s+/', ' ', $description);
        $description = preg_replace('/\s+,/', ',', $description);
        $description = preg_replace('/,\s*,/', ',', $description);
        $description = preg_replace('/^\s*,/', '', $description);
        $description = preg_replace('/,\s*$/', '', $description);

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

        $notice = str_ireplace('prioir', 'prior', $notice);

        $notice = preg_replace('/\s+/', ' ', $notice);
        $notice = preg_replace('/,\s*,/', ',', $notice);
        $notice = preg_replace('/^\s*,/', '', $notice);
        $notice = preg_replace('/,\s*$/', '', $notice);

        return trim($notice);
    }
}
