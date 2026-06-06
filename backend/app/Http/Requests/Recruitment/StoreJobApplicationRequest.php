<?php

namespace App\Http\Requests\Recruitment;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('recruitment.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'job_posting_id' => ['required', 'exists:job_postings,id'],
            'applicant_name' => ['required', 'string', 'max:255'],
            'applicant_email' => ['required', 'email', 'max:255'],
            'applicant_phone' => ['nullable', 'string', 'max:20'],
            'cover_letter' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
