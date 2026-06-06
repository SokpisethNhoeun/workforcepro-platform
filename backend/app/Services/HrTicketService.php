<?php

namespace App\Services;

use App\Models\HrTicket;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class HrTicketService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return HrTicket::query()
            ->with(['employee', 'assignee'])
            ->when($filters['search'] ?? null, function ($q, string $s) {
                $q->where(fn ($sub) => $sub->where('subject', 'like', "%{$s}%")->orWhereHas('employee', fn ($e) => $e->whereRaw("CONCAT(first_name,' ',last_name) LIKE ?", ["%{$s}%"])));
            })
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category', $v))
            ->when($filters['priority'] ?? null, fn ($q, $v) => $q->where('priority', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): HrTicket
    {
        return HrTicket::with(['employee', 'assignee'])->findOrFail($id);
    }

    public function create(array $data): HrTicket
    {
        return HrTicket::create($data)->load(['employee', 'assignee']);
    }

    public function update(HrTicket $ticket, array $data): HrTicket
    {
        if (isset($data['status']) && in_array($data['status'], ['resolved', 'closed']) && ! $ticket->resolved_at) {
            $data['resolved_at'] = now();
        }

        $ticket->update($data);

        return $ticket->fresh()->load(['employee', 'assignee']);
    }

    public function delete(HrTicket $ticket): void
    {
        $ticket->delete();
    }
}
