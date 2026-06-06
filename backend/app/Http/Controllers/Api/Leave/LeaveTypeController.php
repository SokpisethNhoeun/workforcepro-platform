<?php

namespace App\Http\Controllers\Api\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return ApiResponse::success(
            LeaveType::withCount('leaveRequests')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:leave_types,name'],
            'code' => ['required', 'string', 'max:40', 'unique:leave_types,code'],
            'days_per_year' => ['required', 'integer', 'min:0'],
            'is_paid' => ['sometimes', 'boolean'],
            'requires_approval' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        return ApiResponse::success(LeaveType::create($data), 'Leave type created.', 201);
    }

    public function update(Request $request, LeaveType $leaveType): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120', 'unique:leave_types,name,'.$leaveType->id],
            'code' => ['sometimes', 'required', 'string', 'max:40', 'unique:leave_types,code,'.$leaveType->id],
            'days_per_year' => ['sometimes', 'integer', 'min:0'],
            'is_paid' => ['sometimes', 'boolean'],
            'requires_approval' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $leaveType->update($data);

        return ApiResponse::success($leaveType->fresh(), 'Leave type updated.');
    }

    public function destroy(LeaveType $leaveType): JsonResponse
    {
        $leaveType->delete();

        return ApiResponse::success(null, 'Leave type deleted.');
    }
}
