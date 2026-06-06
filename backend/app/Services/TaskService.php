<?php

namespace App\Services;

use App\Models\Task;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TaskService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return Task::query()
            ->with(['assignee', 'assigner'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['priority'] ?? null, fn ($q, $v) => $q->where('priority', $v))
            ->when($filters['assigned_to'] ?? null, fn ($q, $v) => $q->where('assigned_to', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): Task
    {
        return Task::with(['assignee', 'assigner'])->findOrFail($id);
    }

    public function create(array $data): Task
    {
        return Task::create($data)->load(['assignee', 'assigner']);
    }

    public function update(Task $task, array $data): Task
    {
        if (isset($data['status']) && $data['status'] === 'completed' && $task->status !== 'completed') {
            $data['completed_at'] = now();
        }

        $task->update($data);

        return $task->fresh()->load(['assignee', 'assigner']);
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }
}
