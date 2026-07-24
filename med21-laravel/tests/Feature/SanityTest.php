<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SanityTest extends TestCase
{
    private function skipWithoutDatabase(): void
    {
        try {
            DB::connection()->getPdo();

            if (! Schema::hasTable('services') || ! Schema::hasTable('users')) {
                $this->markTestSkipped('Required database tables are missing (run migrations to enable these tests).');
            }
        } catch (\Throwable $e) {
            $this->markTestSkipped('No database connection available: '.$e->getMessage());
        }
    }

    public function test_bookings_requires_authentication(): void
    {
        $response = $this->postJson('/bookings', []);

        $response->assertStatus(401);
        $response->assertJsonStructure(['message']);
    }

    public function test_services_is_public_and_returns_json(): void
    {
        $this->skipWithoutDatabase();

        $response = $this->getJson('/services');

        $response->assertOk();
        $response->assertJsonStructure([]);
    }

    public function test_login_is_throttled_after_exceeding_limit(): void
    {
        $this->skipWithoutDatabase();

        $limit = 10;
        $last = null;

        for ($i = 0; $i < $limit + 2; $i++) {
            $last = $this->postJson('/auth/login', [
                'email' => 'nobody@example.com',
                'password' => 'wrong-password',
            ]);
        }

        $last->assertStatus(429);
    }
}
