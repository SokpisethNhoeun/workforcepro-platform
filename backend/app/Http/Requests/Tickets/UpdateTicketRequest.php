<?php

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('tickets.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'assigned_to' => ['nullable', 'exists:users,id'],
            'category' => ['sometimes', Rule::in(['general', 'payroll', 'benefits', 'policy', 'complaint', 'other'])],
            'subject' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['sometimes', Rule::in(['open', 'in_progress', 'resolved', 'closed'])],
        ];
    }
}
