<?php

namespace App\Services;

use App\Models\Asset;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AssetService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return Asset::query()
            ->with('assignee')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($sub) => $sub->where('name', 'like', "%{$s}%")->orWhere('asset_code', 'like', "%{$s}%")))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category', $v))
            ->orderBy('name')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): Asset
    {
        return Asset::with('assignee')->findOrFail($id);
    }

    public function create(array $data): Asset
    {
        $data['status'] = isset($data['assigned_to']) ? 'assigned' : 'available';

        return Asset::create($data)->load('assignee');
    }

    public function update(Asset $asset, array $data): Asset
    {
        $asset->update($data);

        return $asset->fresh()->load('assignee');
    }

    public function delete(Asset $asset): void
    {
        $asset->delete();
    }
}
