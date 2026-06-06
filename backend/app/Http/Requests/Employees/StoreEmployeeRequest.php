<?php

namespace App\Http\Requests\Employees;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('employees.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'exists:users,id', 'unique:employees,user_id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => ['nullable', 'exists:positions,id'],
            'employment_status_id' => ['nullable', 'exists:employment_statuses,id'],
            'manager_id' => ['nullable', 'exists:employees,id'],
            'employee_code' => ['required', 'string', 'max:40', 'unique:employees,employee_code'],
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'khmer_name' => ['nullable', 'string', 'max:120'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:40'],
            'personal_email' => ['nullable', 'email', 'max:255'],
            'work_email' => ['nullable', 'email', 'max:255', 'unique:employees,work_email'],
            'address' => ['nullable', 'string'],
            'hired_at' => ['nullable', 'date'],
            'probation_ends_at' => ['nullable', 'date', 'after_or_equal:hired_at'],
            'terminated_at' => ['nullable', 'date', 'after_or_equal:hired_at'],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'salary_currency' => ['nullable', 'string', 'size:3'],
            'tax_identifier' => ['nullable', 'string', 'max:80'],
            'nssf_number' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', Rule::in(['active', 'probation', 'suspended', 'terminated'])],
            'metadata' => ['nullable', 'array'],
            'emergency_contacts' => ['sometimes', 'array'],
            'emergency_contacts.*.name' => ['required_with:emergency_contacts', 'string', 'max:120'],
            'emergency_contacts.*.relationship' => ['required_with:emergency_contacts', 'string', 'max:80'],
            'emergency_contacts.*.phone' => ['required_with:emergency_contacts', 'string', 'max:40'],
            'emergency_contacts.*.email' => ['nullable', 'email'],
            'emergency_contacts.*.address' => ['nullable', 'string'],
            'emergency_contacts.*.is_primary' => ['sometimes', 'boolean'],
        ];
    }
}
