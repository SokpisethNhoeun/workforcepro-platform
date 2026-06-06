<?php

namespace App\Http\Requests\Shifts;

use Illuminate\Foundation\Http\FormRequest;

class StoreShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('shifts.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'break_minutes' => ['sometimes', 'integer', 'min:0'],
            'days_of_week' => ['sometimes', 'array'],
            'days_of_week.*' => ['string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
