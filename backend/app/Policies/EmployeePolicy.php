<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'HR', 'Manager', 'Employee']);
    }

    public function view(User $user, Employee $employee): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            $deptIds = $user->employee?->managedDepartmentIds() ?? [];

            return $employee->user_id === $user->id
                || in_array($employee->department_id, $deptIds, true);
        }

        return $employee->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }
}
