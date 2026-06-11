<?php

namespace App\Policies;

use App\Enums\ApprovalStatus;
use App\Models\LeaveRequest;
use App\Models\User;

class LeaveRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            $deptIds = $user->employee?->managedDepartmentIds() ?? [];

            return $leaveRequest->employee?->user_id === $user->id
                || in_array($leaveRequest->employee?->department_id, $deptIds, true);
        }

        return $leaveRequest->employee?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function approve(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($leaveRequest->status !== ApprovalStatus::Pending) {
            return false;
        }

        if ($leaveRequest->employee?->user_id === $user->id) {
            return false;
        }

        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            $deptIds = $user->employee?->managedDepartmentIds() ?? [];

            return in_array($leaveRequest->employee?->department_id, $deptIds, true);
        }

        return false;
    }

    public function delete(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $leaveRequest->employee?->user_id === $user->id
            && $leaveRequest->status === ApprovalStatus::Pending;
    }
}
