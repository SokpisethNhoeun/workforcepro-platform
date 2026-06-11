<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\User;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Attendance $attendance): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            $deptIds = $user->employee?->managedDepartmentIds() ?? [];

            return $attendance->employee?->user_id === $user->id
                || in_array($attendance->employee?->department_id, $deptIds, true);
        }

        return $attendance->employee?->user_id === $user->id;
    }

    public function checkIn(User $user): bool
    {
        return true;
    }

    public function checkOut(User $user, Attendance $attendance): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $attendance->employee?->user_id === $user->id;
    }
}
