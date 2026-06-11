<?php

namespace App\Policies;

use App\Enums\ApprovalStatus;
use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Expense $expense): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            $deptIds = $user->employee?->managedDepartmentIds() ?? [];

            return $expense->employee?->user_id === $user->id
                || in_array($expense->employee?->department_id, $deptIds, true);
        }

        return $expense->employee?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function approve(User $user, Expense $expense): bool
    {
        if ($expense->status !== ApprovalStatus::Pending) {
            return false;
        }

        if ($expense->employee?->user_id === $user->id) {
            return false;
        }

        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            $deptIds = $user->employee?->managedDepartmentIds() ?? [];

            return in_array($expense->employee?->department_id, $deptIds, true);
        }

        return false;
    }

    public function delete(User $user, Expense $expense): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $expense->employee?->user_id === $user->id
            && $expense->status === ApprovalStatus::Pending;
    }
}
