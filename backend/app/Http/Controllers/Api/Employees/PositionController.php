<?php

namespace App\Http\Controllers\Api\Employees;

use App\Http\Controllers\Controller;
use App\Models\Position;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $positions = Position::with('department')
            ->when($request->integer('department_id'), fn ($query, $id) => $query->where('department_id', $id))
            ->orderBy('title')
            ->get();

        return ApiResponse::success($positions);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'department_id' => ['nullable', 'exists:departments,id'],
            'title' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:40', 'unique:positions,code'],
            'description' => ['nullable', 'string'],
            'min_salary' => ['nullable', 'numeric', 'min:0'],
            'max_salary' => ['nullable', 'numeric', 'gte:min_salary'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return ApiResponse::success(Position::create($data), 'Position created.', 201);
    }

    public function show(Position $position): JsonResponse
    {
        return ApiResponse::success($position->load('department'));
    }

    public function update(Request $request, Position $position): JsonResponse
    {
        $data = $request->validate([
            'department_id' => ['nullable', 'exists:departments,id'],
            'title' => ['sometimes', 'required', 'string', 'max:120'],
            'code' => ['sometimes', 'required', 'string', 'max:40', 'unique:positions,code,'.$position->id],
            'description' => ['nullable', 'string'],
            'min_salary' => ['nullable', 'numeric', 'min:0'],
            'max_salary' => ['nullable', 'numeric', 'gte:min_salary'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $position->update($data);

        return ApiResponse::success($position->fresh('department'), 'Position updated.');
    }

    public function destroy(Position $position): JsonResponse
    {
        $position->delete();

        return ApiResponse::success(null, 'Position deleted.');
    }
}
