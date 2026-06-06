<?php

namespace App\Services;

use App\Models\PerformanceHistory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PerformanceService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return PerformanceHistory::query()
            ->with(['employee', 'reviewer'])
            ->when($filters['search'] ?? null, function ($q, string $s) {
                $q->where('period', 'like', "%{$s}%")->orWhereHas('employee', fn ($e) => $e->whereRaw("CONCAT(first_name,' ',last_name) LIKE ?", ["%{$s}%"]));
            })
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->when($filters['period'] ?? null, fn ($q, $v) => $q->where('period', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): PerformanceHistory
    {
        return PerformanceHistory::with(['employee', 'reviewer'])->findOrFail($id);
    }

    public function create(array $data): PerformanceHistory
    {
        return PerformanceHistory::create($data)->load(['employee', 'reviewer']);
    }

    public function update(PerformanceHistory $review, array $data): PerformanceHistory
    {
        $review->update($data);

        return $review->fresh()->load(['employee', 'reviewer']);
    }

    public function delete(PerformanceHistory $review): void
    {
        $review->delete();
    }
}
