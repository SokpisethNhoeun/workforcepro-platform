<?php

namespace App\Http\Requests\Recruitment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobPostingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('recruitment.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'description' => ['nullable', 'string'],
            'requirements' => ['nullable', 'string'],
            'employment_type' => ['sometimes', Rule::in(['full_time', 'part_time', 'contract', 'internship'])],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['draft', 'open', 'closed', 'filled'])],
            'closes_at' => ['nullable', 'date'],
        ];
    }
}
