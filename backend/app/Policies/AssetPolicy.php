<?php

namespace App\Policies;

use App\Models\Asset;
use App\Models\User;

class AssetPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Asset $asset): bool
    {
        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $asset->assignee?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function update(User $user, Asset $asset): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }

    public function delete(User $user, Asset $asset): bool
    {
        return $user->hasAnyRole(['Admin', 'HR']);
    }
}
