<?php

namespace App\Services;

use App\Models\Expense;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ExpenseService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return Expense::query()
            ->with(['employee', 'approver'])
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
