<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ExpenseService
{
    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $query = Expense::query()
            ->with(['employee', 'approver']);

        if ($user && ! $user->hasAnyRole(['Admin', 'HR'])) {
            if ($user->hasRole('Manager')) {
                $deptIds = $user->employee?->managedDepartmentIds() ?? [];
                $employeeId = $user->employee?->id;
                $query->where(function ($q) use ($deptIds, $employeeId) {
                    $q->whereHas('employee', fn ($e) => $e->whereIn('department_id', $deptIds));
                    if ($employeeId) {
                        $q->orWhere('employee_id', $employeeId);
                    }
                });
            } else {
                $query->where('employee_id', $user->employee?->id);
            }
        }

        return $query
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('description', 'like', "%{$s}%"))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category', $v))
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): Expense
    {
        return Expense::with(['employee', 'approver'])->findOrFail($id);
    }

    public function create(array $data): Expense
    {
        return Expense::create($data)->load('employee');
    }

    public function approve(Expense $expense, int $userId): Expense
    {
        $expense->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'responded_at' => now(),
        ]);

        return $expense->fresh()->load(['employee', 'approver']);
    }

    public function reject(Expense $expense, int $userId): Expense
    {
        $expense->update([
            'status' => 'rejected',
            'approved_by' => $userId,
            'responded_at' => now(),
        ]);

        return $expense->fresh()->load(['employee', 'approver']);
    }

    public function delete(Expense $expense): void
    {
        $expense->delete();
    }
}
