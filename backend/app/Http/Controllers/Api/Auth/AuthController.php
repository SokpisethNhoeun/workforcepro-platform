<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register($request->validated());

        $data = [
            'user'         => new UserResource($user),
            'access_token' => $user->createToken('workforcepro-api')->plainTextToken,
            'token_type'   => 'Bearer',
        ];

        return ApiResponse::success($data, 'Registration successful. Verification code queued.', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $this->authService->login($request->validated(), $request);

        $data = [
            'user' => new UserResource($user),
            'access_token' => $user->createToken('workforcepro-api')->plainTextToken,
            'token_type' => 'Bearer',
        ];

        return ApiResponse::success($data, 'Login successful.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(new UserResource(
            $request->user()->load('roles', 'employee.department', 'employee.position')
        ));
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request);

        return ApiResponse::success(null, 'Logged out.');
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $this->authService->sendEmailOtp($request->user());

        return ApiResponse::success(null, 'Verification code queued.');
    }

    public function verifyEmail(VerifyOtpRequest $request): JsonResponse
    {
        $this->authService->verifyEmailOtp($request->user(), $request->validated('code'));

        return ApiResponse::success(null, 'Email verified.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'exists:users,email']]);
        $status = $this->authService->sendResetLink($data['email']);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return ApiResponse::success(null, 'Password reset email queued.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset($data, function ($user, string $password) {
            $user->forceFill(['password' => Hash::make($password)])->save();
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return ApiResponse::success(null, 'Password reset successful.');
    }

    public function sendResetOtp(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);
        $this->authService->sendPasswordResetOtp($request->input('email'));

        return ApiResponse::success(null, 'If an account with that email exists, a reset code has been sent.');
    }

    public function resetPasswordWithOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'                 => ['required', 'email'],
            'code'                  => ['required', 'string', 'size:6'],
            'password'              => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $this->authService->resetPasswordWithOtp($data['email'], $data['code'], $data['password']);

        return ApiResponse::success(null, 'Password reset successful.');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $request->user()->forceFill(['password' => Hash::make($request->validated('password'))])->save();

        return ApiResponse::success(null, 'Password changed.');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'locale' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:60'],
        ]);

        $request->user()->update($data);

        return ApiResponse::success(
            new UserResource($request->user()->fresh()->load('roles', 'employee.department', 'employee.position')),
            'Profile updated.'
        );
    }
}
