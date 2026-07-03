<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnquiryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'customerName' => ['required', 'string'],
            'message' => ['required', 'string'],
        ];
    }
}
