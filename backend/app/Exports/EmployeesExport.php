<?php

namespace App\Exports;

use App\Models\Employee;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class EmployeesExport implements FromQuery, WithHeadings, WithMapping
{
    public function query()
    {
        return Employee::query()->with(['department', 'position', 'employmentStatus'])->orderBy('employee_code');
    }

    public function headings(): array
    {
        return [
            'Employee Code',
            'First Name',
            'Last Name',
            'Khmer Name',
            'Department',
            'Position',
            'Status',
            'Work Email',
            'Phone',
            'Hired At',
            'Base Salary',
            'Currency',
        ];
    }

    public function map($employee): array
    {
        return [
            $employee->employee_code,
            $employee->first_name,
            $employee->last_name,
            $employee->khmer_name,
            $employee->department?->name,
            $employee->position?->title,
            $employee->status,
            $employee->work_email,
            $employee->phone,
            $employee->hired_at?->toDateString(),
            $employee->base_salary,
            $employee->salary_currency,
        ];
    }
}
