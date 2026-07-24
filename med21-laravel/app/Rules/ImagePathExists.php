<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ImagePathExists implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return;
        }

        $publicPath = config('medziva.frontend_public_path');
        $fullPath = $publicPath . '/' . ltrim($value, '/');

        if (! file_exists($fullPath)) {
            $fail("The {$attribute} image path does not exist on disk: {$value}");
        }
    }
}
