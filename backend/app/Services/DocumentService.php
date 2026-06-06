<?php

namespace App\Services;

use App\Models\EmployeeDocument;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DocumentService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return EmployeeDocument::query()
            ->with(['employee', 'uploader'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($filters['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): EmployeeDocument
    {
        return EmployeeDocument::with(['employee', 'uploader'])->findOrFail($id);
    }

    public function create(array $data): EmployeeDocument
    {
        return EmployeeDocument::create($data)->load(['employee', 'uploader']);
    }

    public function update(EmployeeDocument $document, array $data): EmployeeDocument
    {
        $document->update($data);

        return $document->fresh()->load(['employee', 'uploader']);
    }

    public function delete(EmployeeDocument $document): void
    {
        $document->delete();
    }
}
