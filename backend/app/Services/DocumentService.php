<?php

namespace App\Services;

use App\Models\EmployeeDocument;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentService
{
    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $query = EmployeeDocument::query()
            ->with(['employee', 'uploader']);

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

    public function create(array $data, UploadedFile $file): EmployeeDocument
    {
        $path = $file->store('documents', 'local');

        $data['file_path'] = $path;
        $data['mime_type'] = $file->getClientMimeType();
        $data['size_bytes'] = $file->getSize();

        return EmployeeDocument::create($data)->load(['employee', 'uploader']);
    }

    public function update(EmployeeDocument $document, array $data): EmployeeDocument
    {
        $document->update($data);

        return $document->fresh()->load(['employee', 'uploader']);
    }

    public function delete(EmployeeDocument $document): void
    {
        if ($document->file_path) {
            Storage::disk('local')->delete($document->file_path);
        }

        $document->delete();
    }

    public function getFilePath(EmployeeDocument $document): ?string
    {
        if (! $document->file_path || ! Storage::disk('local')->exists($document->file_path)) {
            return null;
        }

        return Storage::disk('local')->path($document->file_path);
    }
}
