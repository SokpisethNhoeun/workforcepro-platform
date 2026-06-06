<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\StorePerformanceRequest;
use App\Http\Requests\Performance\UpdatePerformanceRequest;
use App\Http\Resources\PerformanceResource;
use App\Models\PerformanceHistory;
use App\Services\PerformanceService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function __construct(private readonly PerformanceService $performance) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->performance->paginate($request->only(['search', 'employee_id', 'period', 'per_page']));

        return ApiResponse::success(
            PerformanceResource::collection($paginated)->response()->getData(true)['data'],
            'Performance reviews retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(PerformanceHistory $performance): JsonResponse
    {
        return ApiResponse::success(new PerformanceResource($this->performance->find($performance->id)));
    }

    public function store(StorePerformanceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['reviewer_id'] = $request->user()->id;

        return ApiResponse::success(new PerformanceResource($this->performance->create($data)), 'Review created.', 201);
    }

    public function update(UpdatePerformanceRequest $request, PerformanceHistory $performance): JsonResponse
    {
        return ApiResponse::success(
            new PerformanceResource($this->performance->update($performance, $request->validated())),
            'Review updated.'
        );
    }

    public function destroy(PerformanceHistory $performance): JsonResponse
    {
        $this->performance->delete($performance);

        return ApiResponse::success(null, 'Review deleted.');
    }
}
