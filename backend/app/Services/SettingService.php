<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Collection;

class SettingService
{
    public function all(?string $group = null): Collection
    {
        return Setting::query()
            ->when($group, fn ($q, $g) => $q->where('group', $g))
            ->orderBy('group')
            ->orderBy('key')
            ->get();
    }

    public function findByKey(string $key): ?Setting
    {
        return Setting::where('key', $key)->first();
    }

    public function bulkUpdate(array $settings): Collection
    {
        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }

        return Setting::all();
    }
}
