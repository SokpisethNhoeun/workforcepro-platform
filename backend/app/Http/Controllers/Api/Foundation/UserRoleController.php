<?php

namespace App\Http\Controllers\Api\Foundation;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserRoleController extends Controller
{
    public function update(Request $request, User $user): JsonResponse
    {
        if (! $request->user()?->hasRole('Admin')) {
            throw new AuthorizationException('Only admins can assign user roles.');
        }

        $data = $request->validate([
            'roles' => ['required', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $user->syncRoles($data['roles']);

        if (array_key_exists('permissions', $data)) {
            $user->syncPermissions($data['permissions']);
        }

        return ApiResponse::success($user->load('roles'), 'User permissions updated.');
    }
}
