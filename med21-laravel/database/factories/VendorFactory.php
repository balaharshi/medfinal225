<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class VendorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => 'v-factory-'.fake()->unique()->numberBetween(1000, 9999),
            'name' => fake()->company(),
            'type' => 'Healthcare Provider',
            'email' => fake()->unique()->safeEmail(),
            'contact' => fake()->phoneNumber(),
            'address' => 'Dubai',
            'active' => true,
        ];
    }
}
