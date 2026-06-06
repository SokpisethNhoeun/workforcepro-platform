<?php

namespace App\Services;

use App\Models\OnboardingChecklist;
use App\Models\OnboardingTask;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OnboardingService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return OnboardingChecklist::query()
            ->with(['employee', 'tasks'])
            ->when($filters['search'] ?? null, function ($q, string $s) {
                $q->where('title', 'like', "%{$s}%")->orWhereHas('employee', fn ($e) => $e->whereRaw("CONCAT(first_name,' ',last_name) LIKE ?", ["%{$s}%"]));
            })
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): OnboardingChecklist
    {
        return OnboardingChecklist::with(['employee', 'tasks'])->findOrFail($id);
    }

    public function create(array $data): OnboardingChecklist
    {
        $checklist = OnboardingChecklist::create([
            'employee_id' => $data['employee_id'],
            'title' => $data['title'],
            'due_date' => $data['due_date'] ?? null,
        ]);

        if (! empty($data['tasks'])) {
            foreach ($data['tasks'] as $i => $task) {
                $checklist->tasks()->create([
                    'title' => $task['title'],
                    'description' => $task['description'] ?? null,
                    'sort_order' => $i,
                ]);
            }
        }

        return $checklist->load(['employee', 'tasks']);
    }

    public function update(OnboardingChecklist $checklist, array $data): OnboardingChecklist
    {
        if (isset($data['status']) && $data['status'] === 'completed' && ! $checklist->completed_at) {
            $data['completed_at'] = now();
        }

        $checklist->update($data);

        return $checklist->fresh()->load(['employee', 'tasks']);
    }

    public function toggleTask(OnboardingTask $task): OnboardingTask
    {
        $task->update([
            'is_completed' => ! $task->is_completed,
            'completed_at' => ! $task->is_completed ? now() : null,
        ]);

        return $task->fresh();
    }

    public function delete(OnboardingChecklist $checklist): void
    {
        $checklist->delete();
    }
}
