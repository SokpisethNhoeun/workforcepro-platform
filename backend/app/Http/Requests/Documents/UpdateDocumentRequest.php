<?php

namespace App\Http\Requests\Documents;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('documents.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', 'max:50'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
