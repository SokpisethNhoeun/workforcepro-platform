<?php

namespace App\Http\Controllers\Api\Foundation;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()
            ->with('user')
            ->when($request->input('search'), function ($q, string $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                        ->orWhere('path', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->input('action'), fn ($q, $action) => $q->where('action', $action))
            ->when($request->input('method'), fn ($q, $method) => $q->where('method', $method))
            ->when($request->input('user_id'), fn ($q, $uid) => $q->where('user_id', $uid))
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('created_at', '<=', $d));

        $paginated = $query
            ->orderByDesc('created_at')
            ->paginate((int) ($request->input('per_page', 20)));

        return ApiResponse::success(
            $paginated->items(),
            'Audit logs retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        return ApiResponse::success($auditLog->load('user'));
    }
}
