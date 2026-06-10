<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Facades\Route as RouteFacade;

class SwaggerController extends Controller
{
    private const SUPPORTED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    private const PUBLIC_ROUTES = [
        'get /health',
        'post /auth/register',
        'post /auth/login',
        'post /auth/forgot-password',
        'post /auth/reset-password',
    ];

    public function __invoke(): JsonResponse
    {
        return response()->json(
            $this->openApi(),
            200,
            [],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
        );
    }

    private function openApi(): array
    {
        return [
            'openapi' => '3.0.3',
            'info' => [
                'title' => 'WorkforcePro Backend API',
                'version' => '1.0.0',
                'description' => 'Laravel API documentation for WorkforcePro. Use the login endpoint to get a Bearer token, then click Authorize in Swagger UI.',
            ],
            'servers' => [
                [
                    'url' => '/api/v1',
                    'description' => 'Current backend server',
                ],
            ],
            'tags' => $this->tags(),
            'paths' => $this->paths(),
            'components' => $this->components(),
        ];
    }

    private function paths(): array
    {
        $paths = [];

        foreach (RouteFacade::getRoutes() as $route) {
            $uri = $route->uri();

            if (! str_starts_with($uri, 'api/v1')) {
                continue;
            }

            $relativePath = trim(substr($uri, strlen('api/v1')), '/');
            $openApiPath = '/'.($relativePath === '' ? '' : $relativePath);
            $methods = array_values(array_intersect($route->methods(), self::SUPPORTED_METHODS));

            foreach ($methods as $method) {
                $paths[$openApiPath][strtolower($method)] = $this->operation($route, $method, $openApiPath);
            }
        }

        ksort($paths);

        foreach ($paths as &$operations) {
            ksort($operations);
        }

        return $paths;
    }

    private function operation(LaravelRoute $route, string $method, string $path): array
    {
        $operation = [
            'tags' => [$this->tagForPath($path)],
            'summary' => $this->summary($method, $path),
            'operationId' => $this->operationId($method, $path),
            'parameters' => $this->pathParameters($path),
            'responses' => $this->responses($method, $path),
        ];

        $requestBody = $this->requestBody($method, $path);

        if ($requestBody !== null) {
            $operation['requestBody'] = $requestBody;
        }

        if ($this->requiresAuth($route, $method, $path)) {
            $operation['security'] = [
                ['bearerAuth' => []],
            ];
        }

        return array_filter($operation, static fn ($value) => $value !== []);
    }

    private function requiresAuth(LaravelRoute $route, string $method, string $path): bool
    {
        if (in_array(strtolower($method).' '.$path, self::PUBLIC_ROUTES, true)) {
            return false;
        }

        foreach ($route->gatherMiddleware() as $middleware) {
            if (is_string($middleware) && str_starts_with($middleware, 'auth:sanctum')) {
                return true;
            }
        }

        return false;
    }

    private function pathParameters(string $path): array
    {
        preg_match_all('/\{([^}]+)\}/', $path, $matches);

        return array_map(static fn (string $name): array => [
            'name' => $name,
            'in' => 'path',
            'required' => true,
            'schema' => [
                'type' => in_array($name, ['key', 'type'], true) ? 'string' : 'integer',
            ],
        ], $matches[1]);
    }

    private function requestBody(string $method, string $path): ?array
    {
        $schemaMap = [
            'post /auth/register' => 'RegisterRequest',
            'post /auth/login' => 'LoginRequest',
            'post /auth/forgot-password' => 'ForgotPasswordRequest',
            'post /auth/reset-password' => 'ResetPasswordRequest',
            'post /auth/email/verify' => 'VerifyOtpRequest',
            'post /auth/change-password' => 'ChangePasswordRequest',
            'put /profile' => 'ProfileUpdateRequest',
            'put /users/{user}/roles' => 'AssignRolesRequest',
        ];

        $emptyBodyRoutes = [
            'post /auth/logout',
            'post /auth/email/resend',
            'post /attendance/check-in',
            'post /notifications/mark-all-read',
            'post /payroll/{payrollRun}/process',
        ];

        $key = strtolower($method).' '.$path;

        if (in_array($key, $emptyBodyRoutes, true)) {
            return null;
        }

        if ($key === 'post /employees/import') {
            return [
                'required' => true,
                'content' => [
                    'multipart/form-data' => [
                        'schema' => [
                            'type' => 'object',
                            'required' => ['file'],
                            'properties' => [
                                'file' => [
                                    'type' => 'string',
                                    'format' => 'binary',
                                ],
                            ],
                        ],
                    ],
                ],
            ];
        }

        if (isset($schemaMap[$key])) {
            return $this->jsonRequestBody($schemaMap[$key]);
        }

        if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            return $this->jsonRequestBody('GenericObject', false);
        }

        return null;
    }

    private function jsonRequestBody(string $schema, bool $required = true): array
    {
        return [
            'required' => $required,
            'content' => [
                'application/json' => [
                    'schema' => [
                        '$ref' => '#/components/schemas/'.$schema,
                    ],
                ],
            ],
        ];
    }

    private function responses(string $method, string $path): array
    {
        $key = strtolower($method).' '.$path;

        $success = match ($key) {
            'post /auth/login' => [
                'description' => 'Login successful.',
                'content' => [
                    'application/json' => [
                        'schema' => [
                            '$ref' => '#/components/schemas/LoginResponse',
                        ],
                    ],
                ],
            ],
            'post /auth/register',
            'get /auth/me',
            'put /profile' => [
                'description' => 'User data returned.',
                'content' => [
                    'application/json' => [
                        'schema' => [
                            '$ref' => '#/components/schemas/UserResponse',
                        ],
                    ],
                ],
            ],
            default => [
                'description' => 'Successful API response.',
                'content' => [
                    'application/json' => [
                        'schema' => [
                            '$ref' => '#/components/schemas/ApiResponse',
                        ],
                    ],
                ],
            ],
        };

        $responses = [
            '200' => $success,
            '401' => [
                'description' => 'Unauthenticated.',
            ],
            '403' => [
                'description' => 'Forbidden.',
            ],
            '422' => [
                'description' => 'Validation error.',
                'content' => [
                    'application/json' => [
                        'schema' => [
                            '$ref' => '#/components/schemas/ValidationError',
                        ],
                    ],
                ],
            ],
        ];

        if ($key === 'post /auth/register') {
            $responses['201'] = $success;
            unset($responses['200']);
        }

        return $responses;
    }

    private function summary(string $method, string $path): string
    {
        $summaryMap = [
            'get /health' => 'Check API health',
            'post /auth/register' => 'Register an employee account and send email OTP',
            'post /auth/login' => 'Login with email and password',
            'post /auth/forgot-password' => 'Send a password reset email',
            'post /auth/reset-password' => 'Reset password with reset token',
            'get /auth/me' => 'Get current authenticated user',
            'post /auth/logout' => 'Logout current user',
            'post /auth/email/resend' => 'Resend email verification OTP',
            'post /auth/email/verify' => 'Verify email with OTP',
            'post /auth/change-password' => 'Change password',
            'put /profile' => 'Update current user profile',
        ];

        $key = strtolower($method).' '.$path;

        if (isset($summaryMap[$key])) {
            return $summaryMap[$key];
        }

        $verb = match ($method) {
            'GET' => 'List or view',
            'POST' => 'Create',
            'PUT', 'PATCH' => 'Update',
            'DELETE' => 'Delete',
            default => ucfirst(strtolower($method)),
        };

        $resource = trim(preg_replace('/\{[^}]+\}/', '', $path), '/');
        $resource = preg_replace('/[\/-]+/', ' ', $resource ?: 'resource');

        return $verb.' '.ucwords($resource);
    }

    private function operationId(string $method, string $path): string
    {
        $value = strtolower($method).' '.$path;
        $value = preg_replace('/[^a-zA-Z0-9]+/', ' ', $value);
        $value = str_replace(' ', '', ucwords(trim($value)));

        return lcfirst($value ?: 'operation');
    }

    private function tagForPath(string $path): string
    {
        $firstSegment = explode('/', trim($path, '/'))[0] ?? 'system';

        return match ($firstSegment) {
            'health' => 'System',
            'auth', 'profile' => 'Auth',
            'roles', 'users' => 'Roles',
            'departments', 'positions', 'employees' => 'Employees',
            'attendance' => 'Attendance',
            'leave-types', 'leave-requests' => 'Leave',
            'announcements' => 'Announcements',
            'calendar' => 'Calendar',
            'audit-logs' => 'Audit',
            'shifts' => 'Shifts',
            'tasks' => 'Tasks',
            'hr-tickets' => 'Tickets',
            'payroll' => 'Payroll',
            'expenses' => 'Expenses',
            'assets' => 'Assets',
            'notifications' => 'Notifications',
            'settings' => 'Settings',
            'job-postings', 'job-applications' => 'Recruitment',
            'onboarding', 'onboarding-tasks' => 'Onboarding',
            'performance' => 'Performance',
            'documents' => 'Documents',
            'approvals' => 'Approvals',
            'reports' => 'Reports',
            default => ucwords(str_replace('-', ' ', $firstSegment)),
        };
    }

    private function tags(): array
    {
        return array_map(static fn (string $name): array => ['name' => $name], [
            'System',
            'Auth',
            'Roles',
            'Employees',
            'Attendance',
            'Leave',
            'Announcements',
            'Calendar',
            'Audit',
            'Shifts',
            'Tasks',
            'Tickets',
            'Payroll',
            'Expenses',
            'Assets',
            'Notifications',
            'Settings',
            'Recruitment',
            'Onboarding',
            'Performance',
            'Documents',
            'Approvals',
            'Reports',
        ]);
    }

    private function components(): array
    {
        return [
            'securitySchemes' => [
                'bearerAuth' => [
                    'type' => 'http',
                    'scheme' => 'bearer',
                    'bearerFormat' => 'Sanctum token',
                ],
            ],
            'schemas' => [
                'ApiResponse' => [
                    'type' => 'object',
                    'properties' => [
                        'success' => ['type' => 'boolean', 'example' => true],
                        'message' => ['type' => 'string', 'example' => 'Success.'],
                        'data' => [
                            'nullable' => true,
                            'oneOf' => [
                                ['type' => 'object'],
                                ['type' => 'array', 'items' => []],
                                ['type' => 'string'],
                                ['type' => 'integer'],
                                ['type' => 'boolean'],
                            ],
                        ],
                    ],
                ],
                'ValidationError' => [
                    'type' => 'object',
                    'properties' => [
                        'message' => ['type' => 'string', 'example' => 'The given data was invalid.'],
                        'errors' => [
                            'type' => 'object',
                            'additionalProperties' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                            ],
                        ],
                    ],
                ],
                'User' => [
                    'type' => 'object',
                    'properties' => [
                        'id' => ['type' => 'integer', 'example' => 1],
                        'name' => ['type' => 'string', 'example' => 'Workforce Admin'],
                        'email' => ['type' => 'string', 'format' => 'email', 'example' => 'ahboy5518@gmail.com'],
                        'phone' => ['type' => 'string', 'nullable' => true, 'example' => '+855 12 000 000'],
                        'is_active' => ['type' => 'boolean', 'example' => true],
                        'roles' => [
                            'type' => 'array',
                            'items' => ['type' => 'string'],
                            'example' => ['Admin'],
                        ],
                    ],
                ],
                'UserResponse' => [
                    'allOf' => [
                        ['$ref' => '#/components/schemas/ApiResponse'],
                        [
                            'type' => 'object',
                            'properties' => [
                                'data' => [
                                    '$ref' => '#/components/schemas/User',
                                ],
                            ],
                        ],
                    ],
                ],
                'LoginResponse' => [
                    'allOf' => [
                        ['$ref' => '#/components/schemas/ApiResponse'],
                        [
                            'type' => 'object',
                            'properties' => [
                                'data' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'user' => ['$ref' => '#/components/schemas/User'],
                                        'access_token' => ['type' => 'string', 'example' => '1|sanctum-token-value'],
                                        'token_type' => ['type' => 'string', 'example' => 'Bearer'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'RegisterRequest' => [
                    'type' => 'object',
                    'required' => ['name', 'email', 'password', 'password_confirmation'],
                    'properties' => [
                        'name' => ['type' => 'string', 'example' => 'New Employee'],
                        'email' => ['type' => 'string', 'format' => 'email', 'example' => 'employee@example.com'],
                        'phone' => ['type' => 'string', 'nullable' => true, 'example' => '+855 12 345 678'],
                        'password' => ['type' => 'string', 'format' => 'password', 'example' => 'Sethadmin@12'],
                        'password_confirmation' => ['type' => 'string', 'format' => 'password', 'example' => 'Sethadmin@12'],
                    ],
                ],
                'LoginRequest' => [
                    'type' => 'object',
                    'required' => ['email', 'password'],
                    'properties' => [
                        'email' => ['type' => 'string', 'format' => 'email', 'example' => 'ahboy5518@gmail.com'],
                        'password' => ['type' => 'string', 'format' => 'password', 'example' => 'Sethadmin@12'],
                        'remember' => ['type' => 'boolean', 'example' => false],
                    ],
                ],
                'ForgotPasswordRequest' => [
                    'type' => 'object',
                    'required' => ['email'],
                    'properties' => [
                        'email' => ['type' => 'string', 'format' => 'email', 'example' => 'ahboy5518@gmail.com'],
                    ],
                ],
                'ResetPasswordRequest' => [
                    'type' => 'object',
                    'required' => ['token', 'email', 'password', 'password_confirmation'],
                    'properties' => [
                        'token' => ['type' => 'string', 'example' => 'reset-token-from-email'],
                        'email' => ['type' => 'string', 'format' => 'email', 'example' => 'ahboy5518@gmail.com'],
                        'password' => ['type' => 'string', 'format' => 'password', 'example' => 'Sethadmin@12'],
                        'password_confirmation' => ['type' => 'string', 'format' => 'password', 'example' => 'Sethadmin@12'],
                    ],
                ],
                'VerifyOtpRequest' => [
                    'type' => 'object',
                    'required' => ['code'],
                    'properties' => [
                        'code' => ['type' => 'string', 'example' => '123456'],
                    ],
                ],
                'ChangePasswordRequest' => [
                    'type' => 'object',
                    'required' => ['current_password', 'password', 'password_confirmation'],
                    'properties' => [
                        'current_password' => ['type' => 'string', 'format' => 'password', 'example' => 'Sethadmin@12'],
                        'password' => ['type' => 'string', 'format' => 'password', 'example' => 'Newpass@12'],
                        'password_confirmation' => ['type' => 'string', 'format' => 'password', 'example' => 'Newpass@12'],
                    ],
                ],
                'ProfileUpdateRequest' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => ['type' => 'string', 'example' => 'Workforce Admin'],
                        'phone' => ['type' => 'string', 'nullable' => true, 'example' => '+855 12 000 000'],
                        'locale' => ['type' => 'string', 'nullable' => true, 'example' => 'en'],
                        'timezone' => ['type' => 'string', 'nullable' => true, 'example' => 'Asia/Phnom_Penh'],
                    ],
                ],
                'AssignRolesRequest' => [
                    'type' => 'object',
                    'required' => ['roles'],
                    'properties' => [
                        'roles' => [
                            'type' => 'array',
                            'items' => ['type' => 'string'],
                            'example' => ['Employee'],
                        ],
                    ],
                ],
                'GenericObject' => [
                    'type' => 'object',
                    'additionalProperties' => true,
                ],
            ],
        ];
    }
}
