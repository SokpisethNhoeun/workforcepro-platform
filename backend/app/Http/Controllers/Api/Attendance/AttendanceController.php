<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\CheckInRequest;
use App\Http\Requests\Attendance\CheckOutRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Services\AttendanceService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->attendance->paginate($request->only([
            'search',
            'employee_id',
            'date',
            'date_from',
            'date_to',
            'status',
            'sort',
            'direction',
            'per_page',
        ]));

        return ApiResponse::success(
            AttendanceResource::collection($paginated)->response()->getData(true)['data'],
            'Attendance records retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(Attendance $attendance): JsonResponse
    {
        return ApiResponse::success(new AttendanceResource($this->attendance->find($attendance->id)));
    }

    public function checkIn(CheckInRequest $request): JsonResponse
    {
        $attendance = $this->attendance->checkIn($request->validated());

        return ApiResponse::success(new AttendanceResource($attendance), 'Checked in.', 201);
    }

    public function checkOut(CheckOutRequest $request, Attendance $attendance): JsonResponse
    {
        $attendance = $this->attendance->checkOut($attendance, $request->validated());

        return ApiResponse::success(new AttendanceResource($attendance), 'Checked out.');
    }

    public function summary(): JsonResponse
    {
        return ApiResponse::success($this->attendance->todaySummary(), 'Today\'s summary.');
    }
}
