<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServiceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'slug' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:draft,active,inactive'],
            'active' => ['nullable', 'boolean'],
            'originalPrice' => ['nullable', 'numeric', 'min:0'],
            'salePrice' => ['nullable', 'numeric', 'min:0'],
            'displayPriority' => ['nullable', 'numeric', 'min:0'],
            'shortDescription' => ['nullable', 'string', 'max:1000'],
            'fullDescription' => ['nullable', 'string', 'max:5000'],
            'preparationInstructions' => ['nullable', 'string', 'max:2000'],
            'whoIsItFor' => ['nullable', 'string', 'max:2000'],
            'availability' => ['nullable', 'string', 'max:500'],
            'seoTitle' => ['nullable', 'string', 'max:255'],
            'seoDescription' => ['nullable', 'string', 'max:500'],
        ];
    }
}
