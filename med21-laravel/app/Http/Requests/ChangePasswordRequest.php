<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'currentPassword' => ['required', 'string', 'max:128'],
            'newPassword' => ['required', 'string', 'min:8', 'max:128'],
        ];
    }
}
