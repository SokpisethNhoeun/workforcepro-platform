<?php

namespace App\Http\Controllers\Api\Approvals;

use App\Http\Controllers\Controller;
use App\Http\Requests\Approvals\ApprovalActionRequest;
use App\Models\Expense;
use App\Models\LeaveRequest;
use App\Services\ApprovalService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function __construct(private readonly ApprovalService $approvals) {}

    public function index(Request $request): JsonResponse
    {
        $pendingItems = $this->approvals->getPendingForApprover($request->user());
        $items = $pendingItems->map(fn (Model $item) => $this->formatApprovalItem($item))->values();
        $pendingLeaves = $pendingItems->filter(fn (Model $item) => $item instanceof LeaveRequest)->count();
        $pendingExpenses = $pendingItems->filter(fn (Model $item) => $item instanceof Expense)->count();

        return ApiResponse::success($items, 'Pending approvals retrieved.', 200, [
            'pending_leaves' => $pendingLeaves,
            'pending_expenses' => $pendingExpenses,
            'total' => $items->count(),
        ]);
    }

    public function approve(ApprovalActionRequest $request, string $type, int $id): JsonResponse
    {
        $approvable = $this->findApprovable($type, $id);

        if (! $approvable) {
            return ApiResponse::error('Invalid approval type.', 422);
        }

        $approved = $this->approvals->approve(
            $approvable,
            $request->user(),
            $request->validated()['comments'] ?? null
        );

        return ApiResponse::success($approved, $this->successMessage($type, 'approved'));
    }

    public function reject(ApprovalActionRequest $request, string $type, int $id): JsonResponse
    {
        $approvable = $this->findApprovable($type, $id);

        if (! $approvable) {
            return ApiResponse::error('Invalid approval type.', 422);
        }

        $rejected = $this->approvals->reject(
            $approvable,
            $request->user(),
            $request->validated()['comments']
        );

        return ApiResponse::success($rejected, $this->successMessage($type, 'rejected'));
    }

    private function findApprovable(string $type, int $id): LeaveRequest|Expense|null
    {
        return match ($type) {
            'leave_request' => LeaveRequest::findOrFail($id),
            'expense' => Expense::findOrFail($id),
            default => null,
        };
    }

    private function formatApprovalItem(Model $item): array
    {
        return match (true) {
            $item instanceof LeaveRequest => $this->formatLeaveRequest($item),
            $item instanceof Expense => $this->formatExpense($item),
            default => [],
        };
    }

    private function formatLeaveRequest(LeaveRequest $leave): array
    {
        return [
            'id' => $leave->id,
            'type' => 'leave_request',
            'title' => ($leave->employee?->full_name ?? 'Employee').' — '.($leave->leaveType?->name ?? 'Leave'),
            'description' => $leave->reason,
            'status' => $leave->status->value,
            'created_at' => $leave->created_at?->toIso8601String(),
            'meta' => [
                'start_date' => $leave->start_date?->toDateString(),
                'end_date' => $leave->end_date?->toDateString(),
                'total_days' => $leave->total_days,
            ],
        ];
    }

    private function formatExpense(Expense $expense): array
    {
        return [
            'id' => $expense->id,
            'type' => 'expense',
            'title' => ($expense->employee?->full_name ?? 'Employee').' — '.$expense->category,
            'description' => $expense->description,
            'status' => $expense->status->value,
            'created_at' => $expense->created_at?->toIso8601String(),
            'meta' => [
                'amount' => $expense->amount,
                'currency' => $expense->currency,
            ],
        ];
    }

    private function successMessage(string $type, string $action): string
    {
        return match ($type) {
            'leave_request' => "Leave request {$action}.",
            'expense' => "Expense {$action}.",
            default => "Approval {$action}.",
        };
    }
}
