<?php

namespace App\Http\Controllers\Api\Foundation;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class SystemHealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'backend' => 'ok',
            'database' => $this->check(fn () => DB::select('select 1')),
            'redis' => $this->check(fn () => Cache::store('redis')->put('health_check', now()->toIso8601String(), 30)),
            'queue' => Queue::getDefaultDriver(),
            'smtp' => config('mail.default') === 'smtp' && filled(config('mail.mailers.smtp.host')) ? 'configured' : 'not_configured',
        ];

        return ApiResponse::success($checks, 'System health checked.');
    }

    private function check(callable $callback): string
    {
        try {
            $callback();

            return 'ok';
        } catch (\Throwable) {
            return 'failed';
        }
    }
}
