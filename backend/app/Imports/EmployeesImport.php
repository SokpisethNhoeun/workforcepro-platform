<?php

namespace App\Imports;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Position;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class EmployeesImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row): Employee
    {
        $department = isset($row['department_code'])
            ? Department::where('code', $row['department_code'])->first()
            : null;
        $position = isset($row['position_code'])
            ? Position::where('code', $row['position_code'])->first()
            : null;
        $status = isset($row['employment_status_code'])
            ? EmploymentStatus::where('code', $row['employment_status_code'])->first()
            : null;

        return new Employee([
            'employee_code' => $row['employee_code'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'khmer_name' => $row['khmer_name'] ?? null,
            'department_id' => $department?->id,
            'position_id' => $position?->id,
            'employment_status_id' => $status?->id,
            'work_email' => $row['work_email'] ?? null,
            'phone' => $row['phone'] ?? null,
            'hired_at' => $row['hired_at'] ?? null,
            'base_salary' => $row['base_salary'] ?? 0,
            'salary_currency' => $row['salary_currency'] ?? 'USD',
            'status' => $row['status'] ?? 'active',
        ]);
    }

    public function rules(): array
    {
        return [
            '*.employee_code' => ['required', 'distinct', 'unique:employees,employee_code'],
            '*.first_name' => ['required'],
            '*.last_name' => ['required'],
            '*.work_email' => ['nullable', 'email', 'distinct', 'unique:employees,work_email'],
        ];
    }
}
