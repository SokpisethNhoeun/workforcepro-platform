<?php

namespace App\Policies;

use App\Models\PayrollRun;
use App\Models\User;

class PayrollRunPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function view(User $user, PayrollRun $payrollRun): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function update(User $user, PayrollRun $payrollRun): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function process(User $user, PayrollRun $payrollRun): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function delete(User $user, PayrollRun $payrollRun): bool
    {
        return $user->hasRole('Admin');
    }
}
