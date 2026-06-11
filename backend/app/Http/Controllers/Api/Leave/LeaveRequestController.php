<?php

namespace App\Http\Controllers\Api\Leave;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveRequestRequest;
use App\Http\Resources\LeaveRequestResource;
use App\Models\LeaveRequest;
use App\Services\LeaveService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function __construct(private readonly LeaveService $leaves) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->leaves->paginate($request->only([
            'search',
            'employee_id',
            'leave_type_id',
            'status',
            'sort',
            'direction',
            'per_page',
        ]));

        return ApiResponse::success(
            LeaveRequestResource::collection($paginated)->response()->getData(true)['data'],
            'Leave requests retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(LeaveRequest $leaveRequest): JsonResponse
    {
        $this->authorize('view', $leaveRequest);

        return ApiResponse::success(new LeaveRequestResource($this->leaves->find($leaveRequest->id)));
    }

    public function store(StoreLeaveRequestRequest $request): JsonResponse
    {
        $leaveRequest = $this->leaves->create($request->validated());

        return ApiResponse::success(new LeaveRequestResource($leaveRequest), 'Leave request submitted.', 201);
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $this->authorize('approve', $leaveRequest);

        $leaveRequest = $this->leaves->approve($leaveRequest, $request->user()->id);

        return ApiResponse::success(new LeaveRequestResource($leaveRequest), 'Leave request approved.');
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $this->authorize('approve', $leaveRequest);

        $request->validate(['rejection_reason' => ['nullable', 'string', 'max:500']]);

        $leaveRequest = $this->leaves->reject(
            $leaveRequest,
            $request->user()->id,
            $request->input('rejection_reason')
        );

        return ApiResponse::success(new LeaveRequestResource($leaveRequest), 'Leave request rejected.');
    }

    public function destroy(LeaveRequest $leaveRequest): JsonResponse
    {
        $this->authorize('delete', $leaveRequest);

        $this->leaves->delete($leaveRequest);

        return ApiResponse::success(null, 'Leave request deleted.');
    }
}
