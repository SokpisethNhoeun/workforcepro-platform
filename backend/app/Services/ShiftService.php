<?php

namespace App\Services;

use App\Models\Shift;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ShiftService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return Shift::query()
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)))
            ->orderBy('name')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): Shift
    {
        return Shift::findOrFail($id);
    }

    public function create(array $data): Shift
    {
        return Shift::create($data);
    }

    public function update(Shift $shift, array $data): Shift
    {
        $shift->update($data);

        return $shift->fresh();
    }

    public function delete(Shift $shift): void
    {
        $shift->delete();
    }
}
