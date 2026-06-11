<?php

namespace App\Policies;

use App\Models\EmployeeDocument;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, EmployeeDocument $document): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            $deptIds = $user->employee?->managedDepartmentIds() ?? [];

            return $document->employee?->user_id === $user->id
                || in_array($document->employee?->department_id, $deptIds, true);
        }

        return $document->employee?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function update(User $user, EmployeeDocument $document): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function delete(User $user, EmployeeDocument $document): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }
}
