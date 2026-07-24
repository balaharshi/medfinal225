<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnquiryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'customerName' => ['required', 'string', 'max:255'],
            'customerEmail' => ['nullable', 'email', 'max:255'],
            'customerPhone' => ['nullable', 'string', 'max:50'],
            'serviceTitle' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'contactMethod' => ['nullable', 'string', 'in:phone,email,whatsapp,Phone,Email,WhatsApp'],
            'date' => ['nullable', 'date'],
        ];
    }
}
