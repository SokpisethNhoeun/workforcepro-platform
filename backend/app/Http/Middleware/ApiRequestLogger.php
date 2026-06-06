<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiRequestLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->user() && $request->is('api/*') && ! $request->isMethod('GET')) {
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'api_request',
                'method' => $request->method(),
                'path' => $request->path(),
                'status_code' => $response->getStatusCode(),
                'ip_address' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
                'new_values' => $request->except(['password', 'password_confirmation', 'current_password', 'token', 'code']),
            ]);
        }

        return $response;
    }
}
