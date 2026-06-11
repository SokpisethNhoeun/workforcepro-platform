<?php

namespace App\Http\Requests\Approvals;

use Illuminate\Foundation\Http\FormRequest;

class ApprovalActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('approvals.manage') ?? false;
    }

    public function rules(): array
    {
        $action = $this->route()?->getActionMethod();
        $commentsRule = $action === 'reject' ? 'required' : 'nullable';

        return [
            'comments' => [$commentsRule, 'string', 'max:1000'],
        ];
    }
}
