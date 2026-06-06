<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('attendance.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'check_out' => ['sometimes', 'date'],
            'check_out_method' => ['sometimes', 'string', Rule::in(['manual', 'biometric', 'qr_code', 'mobile'])],
            'check_out_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
