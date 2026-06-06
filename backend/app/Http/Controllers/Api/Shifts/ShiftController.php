<?php

namespace App\Http\Controllers\Api\Shifts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shifts\StoreShiftRequest;
use App\Http\Requests\Shifts\UpdateShiftRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Shift;
use App\Services\ShiftService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function __construct(private readonly ShiftService $shifts) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->shifts->paginate($request->only(['search', 'is_active', 'per_page']));

        return ApiResponse::success(
            ShiftResource::collection($paginated)->response()->getData(true)['data'],
            'Shifts retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(Shift $shift): JsonResponse
    {
        return ApiResponse::success(new ShiftResource($shift));
    }

    public function store(StoreShiftRequest $request): JsonResponse
    {
        $shift = $this->shifts->create($request->validated());

        return ApiResponse::success(new ShiftResource($shift), 'Shift created.', 201);
    }

    public function update(UpdateShiftRequest $request, Shift $shift): JsonResponse
    {
        $shift = $this->shifts->update($shift, $request->validated());

        return ApiResponse::success(new ShiftResource($shift), 'Shift updated.');
    }

    public function destroy(Shift $shift): JsonResponse
    {
        $this->shifts->delete($shift);

        return ApiResponse::success(null, 'Shift deleted.');
    }
}
