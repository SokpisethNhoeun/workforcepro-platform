<?php

namespace App\Http\Requests\Recruitment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('recruitment.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(['received', 'screening', 'interview', 'offered', 'hired', 'rejected'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
