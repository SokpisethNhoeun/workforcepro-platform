<?php

namespace App\Services;

use App\Models\LeaveRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class LeaveService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = LeaveRequest::query()
            ->with(['employee.department', 'leaveType', 'approver'])
            ->when($filters['employee_id'] ?? null, fn ($q, $id) => $q->where('employee_id', $id))
            ->when($filters['leave_type_id'] ?? null, fn ($q, $id) => $q->where('leave_type_id', $id))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, function ($q, string $search) {
                $q->whereHas('employee', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                });
            });

        $sort = in_array($filters['sort'] ?? '', ['start_date', 'end_date', 'total_days', 'status', 'created_at'], true)
            ? $filters['sort']
            : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $direction)->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): LeaveRequest
    {
        return LeaveRequest::with(['employee.department', 'leaveType', 'approver'])->findOrFail($id);
    }

    public function create(array $data): LeaveRequest
    {
        $startDate = Carbon::parse($data['start_date']);
        $endDate = Carbon::parse($data['end_date']);

        $totalDays = $this->calculateBusinessDays($startDate, $endDate);

        $leaveRequest = LeaveRequest::create([
            ...$data,
            'total_days' => $totalDays,
            'status' => 'pending',
        ]);

        return $leaveRequest->load(['employee.department', 'leaveType']);
    }

    public function approve(LeaveRequest $leaveRequest, int $approverId): LeaveRequest
    {
        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => $approverId,
            'responded_at' => now(),
        ]);

        return $leaveRequest->load(['employee.department', 'leaveType', 'approver']);
    }

    public function reject(LeaveRequest $leaveRequest, int $approverId, ?string $reason): LeaveRequest
    {
        $leaveRequest->update([
            'status' => 'rejected',
            'approved_by' => $approverId,
            'rejection_reason' => $reason,
            'responded_at' => now(),
        ]);

        return $leaveRequest->load(['employee.department', 'leaveType', 'approver']);
    }

    public function delete(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->delete();
    }

    private function calculateBusinessDays(Carbon $start, Carbon $end): float
    {
        $days = 0;
        $current = $start->copy();

        while ($current->lte($end)) {
            if (! $current->isWeekend()) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }
}
