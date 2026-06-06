<?php

namespace App\Repositories\Eloquent;

use App\Models\Employee;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = Employee::query()
            ->with(['user.roles', 'department', 'position', 'employmentStatus', 'manager'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('employee_code', 'ilike', "%{$search}%")
                        ->orWhere('first_name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%")
                        ->orWhere('work_email', 'ilike', "%{$search}%");
                });
            })
            ->when($filters['department_id'] ?? null, fn ($query, $id) => $query->where('department_id', $id))
            ->when($filters['position_id'] ?? null, fn ($query, $id) => $query->where('position_id', $id))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status));

        $sort = in_array($filters['sort'] ?? '', ['employee_code', 'first_name', 'last_name', 'hired_at', 'status'], true)
            ? $filters['sort']
            : 'employee_code';
        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sort, $direction)->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): Employee
    {
        return Employee::with([
            'user.roles',
            'department',
            'position',
            'employmentStatus',
            'manager',
            'emergencyContacts',
            'contracts',
            'documents',
            'performanceHistories',
        ])->findOrFail($id);
    }

    public function create(array $data): Employee
    {
        return Employee::create($data);
    }

    public function update(Employee $employee, array $data): Employee
    {
        $employee->update($data);

        return $employee;
    }

    public function delete(Employee $employee): void
    {
        $employee->delete();
    }
}
