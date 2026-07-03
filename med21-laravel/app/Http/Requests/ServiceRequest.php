<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServiceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string'],
            'price' => ['required', 'numeric'],
            'slug' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,active,inactive'],
            'active' => ['nullable', 'boolean'],
            'originalPrice' => ['nullable', 'numeric'],
            'salePrice' => ['nullable', 'numeric'],
            'displayPriority' => ['nullable', 'numeric'],
            'shortDescription' => ['nullable', 'string'],
            'fullDescription' => ['nullable', 'string'],
            'preparationInstructions' => ['nullable', 'string'],
            'whoIsItFor' => ['nullable', 'string'],
            'availability' => ['nullable', 'string'],
            'seoTitle' => ['nullable', 'string'],
            'seoDescription' => ['nullable', 'string'],
        ];
    }
}
