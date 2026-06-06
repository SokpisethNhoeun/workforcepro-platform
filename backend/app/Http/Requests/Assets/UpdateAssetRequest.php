<?php

namespace App\Http\Requests\Assets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('assets.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', Rule::in(['laptop', 'phone', 'monitor', 'furniture', 'vehicle', 'software', 'other'])],
            'status' => ['sometimes', Rule::in(['available', 'assigned', 'maintenance', 'retired'])],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['sometimes', 'numeric', 'min:0'],
            'assigned_to' => ['nullable', 'exists:employees,id'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
