<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'customerName' => ['required', 'string'],
            'serviceTitle' => ['required', 'string'],
        ];
    }
}
