<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('attendance.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'date' => ['sometimes', 'date'],
            'check_in' => ['sometimes', 'date'],
            'check_in_method' => ['sometimes', 'string', Rule::in(['manual', 'biometric', 'qr_code', 'mobile'])],
            'check_in_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
