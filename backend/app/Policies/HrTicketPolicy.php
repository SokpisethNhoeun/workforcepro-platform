<?php

namespace App\Policies;

use App\Models\HrTicket;
use App\Models\User;

class HrTicketPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, HrTicket $ticket): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $ticket->employee?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, HrTicket $ticket): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        if ($ticket->assigned_to === $user->id) {
            return true;
        }

        return $ticket->employee?->user_id === $user->id
            && in_array($ticket->status, ['open', 'pending']);
    }

    public function delete(User $user, HrTicket $ticket): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }
}
