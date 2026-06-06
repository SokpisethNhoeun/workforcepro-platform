<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePerformanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('performance.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'score' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'summary' => ['nullable', 'string'],
            'strengths' => ['nullable', 'string'],
            'improvements' => ['nullable', 'string'],
        ];
    }
}
