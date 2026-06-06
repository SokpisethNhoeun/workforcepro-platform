<?php

namespace App\Http\Controllers\Api\Approvals;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\LeaveRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = [];

        $leaves = LeaveRequest::query()
            ->with(['employee', 'leaveType'])
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        foreach ($leaves as $leave) {
            $items[] = [
                'id' => $leave->id,
                'type' => 'leave_request',
                'title' => ($leave->employee?->full_name ?? 'Employee').' — '.($leave->leaveType?->name ?? 'Leave'),
                'description' => $leave->reason,
                'status' => $leave->status,
                'created_at' => $leave->created_at?->toIso8601String(),
                'meta' => [
                    'start_date' => $leave->start_date?->toDateString(),
                    'end_date' => $leave->end_date?->toDateString(),
                    'total_days' => $leave->total_days,
                ],
            ];
        }

        $expenses = Expense::query()
            ->with('employee')
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        foreach ($expenses as $expense) {
            $items[] = [
                'id' => $expense->id,
                'type' => 'expense',
                'title' => ($expense->employee?->full_name ?? 'Employee').' — '.$expense->category,
                'description' => $expense->description,
                'status' => $expense->status,
                'created_at' => $expense->created_at?->toIso8601String(),
                'meta' => [
                    'amount' => $expense->amount,
                    'currency' => $expense->currency,
                ],
            ];
        }

        usort($items, fn ($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));

        return ApiResponse::success($items, 'Pending approvals retrieved.', 200, [
            'pending_leaves' => $leaves->count(),
            'pending_expenses' => $expenses->count(),
            'total' => count($items),
        ]);
    }

    public function approve(Request $request, string $type, int $id): JsonResponse
    {
        return match ($type) {
            'leave_request' => $this->approveLeave($request, $id),
            'expense' => $this->approveExpense($request, $id),
            default => ApiResponse::error('Invalid approval type.', 422),
        };
    }

    public function reject(Request $request, string $type, int $id): JsonResponse
    {
        return match ($type) {
            'leave_request' => $this->rejectLeave($request, $id),
            'expense' => $this->rejectExpense($request, $id),
            default => ApiResponse::error('Invalid approval type.', 422),
        };
    }

    private function approveLeave(Request $request, int $id): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);
        $leave->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
        ]);

        return ApiResponse::success($leave->fresh()->load(['employee', 'leaveType']), 'Leave request approved.');
    }

    private function rejectLeave(Request $request, int $id): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);
        $leave->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
        ]);

        return ApiResponse::success($leave->fresh()->load(['employee', 'leaveType']), 'Leave request rejected.');
    }

    private function approveExpense(Request $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $expense->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'responded_at' => now(),
        ]);

        return ApiResponse::success($expense->fresh()->load(['employee', 'approver']), 'Expense approved.');
    }

    private function rejectExpense(Request $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $expense->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'responded_at' => now(),
        ]);

        return ApiResponse::success($expense->fresh()->load(['employee', 'approver']), 'Expense rejected.');
    }
}
