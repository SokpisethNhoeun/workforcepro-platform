<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('onboarding.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'completed'])],
        ];
    }
}
