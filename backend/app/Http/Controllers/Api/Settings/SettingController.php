<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateSettingsRequest;
use App\Http\Resources\SettingResource;
use App\Services\SettingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(private readonly SettingService $settings) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::success(
            SettingResource::collection($this->settings->all($request->input('group'))),
            'Settings retrieved.'
        );
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $settings = $this->settings->bulkUpdate($request->validated()['settings']);

        return ApiResponse::success(SettingResource::collection($settings), 'Settings updated.');
    }

    public function show(string $key): JsonResponse
    {
        $setting = $this->settings->findByKey($key);

        if (! $setting) {
            return ApiResponse::error('Setting not found.', 404);
        }

        return ApiResponse::success(new SettingResource($setting));
    }
}
