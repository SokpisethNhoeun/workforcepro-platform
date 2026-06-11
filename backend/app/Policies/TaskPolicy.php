<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($task->assigned_by === $user->id) {
            return true;
        }

        return $task->assignee?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'HR', 'Manager']);
    }

    public function update(User $user, Task $task): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($task->assigned_by === $user->id) {
            return true;
        }

        return $task->assignee?->user_id === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $task->assigned_by === $user->id;
    }
}
