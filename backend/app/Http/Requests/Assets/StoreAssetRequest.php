<?php

namespace App\Http\Requests\Assets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('assets.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'asset_code' => ['required', 'string', 'max:50', 'unique:assets,asset_code'],
            'category' => ['required', Rule::in(['laptop', 'phone', 'monitor', 'furniture', 'vehicle', 'software', 'other'])],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'assigned_to' => ['nullable', 'exists:employees,id'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
