<?php

namespace App\Http\Controllers\Api\Employees;

use App\Http\Controllers\Controller;
use App\Http\Requests\Departments\StoreDepartmentRequest;
use App\Http\Requests\Departments\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Services\DepartmentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    public function __construct(private readonly DepartmentService $departments) {}

    public function index(): JsonResponse
    {
        return ApiResponse::success(DepartmentResource::collection($this->departments->all()));
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new DepartmentResource($this->departments->create($request->validated())),
            'Department created.',
            201
        );
    }

    public function show(Department $department): JsonResponse
    {
        return ApiResponse::success(new DepartmentResource($this->departments->find($department->id)));
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        return ApiResponse::success(
            new DepartmentResource($this->departments->update($department, $request->validated())),
            'Department updated.'
        );
    }

    public function destroy(Department $department): JsonResponse
    {
        $this->departments->delete($department);

        return ApiResponse::success(null, 'Department deleted.');
    }
}
