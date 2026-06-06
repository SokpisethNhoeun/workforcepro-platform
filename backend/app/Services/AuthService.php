<?php

namespace App\Services;

use App\Models\EmailOtp;
use App\Models\FailedLoginLog;
use App\Models\User;
use App\Notifications\EmailOtpNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AuthService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
            ]);

            if (method_exists($user, 'assignRole') && Role::where('name', 'Employee')->exists()) {
                $user->assignRole('Employee');
            }

            $this->sendEmailOtp($user);

            return $user->load('roles', 'employee');
        });
    }

    public function login(array $credentials, Request $request): User
    {
        $remember = (bool) ($credentials['remember'] ?? false);

        if (! Auth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
            'is_active' => true,
        ], $remember)) {
            FailedLoginLog::create([
                'email' => $credentials['email'] ?? null,
                'ip_address' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
                'reason' => 'invalid_credentials',
                'attempted_at' => now(),
            ]);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect or the account is inactive.'],
            ]);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        /** @var User $user */
        $user = Auth::user();
        $user->forceFill(['last_login_at' => now()])->save();

        return $user->load('roles', 'employee.department', 'employee.position');
    }

    public function logout(Request $request): void
    {
        $token = $request->user()?->currentAccessToken();

        if ($token) {
            $token->delete();

            return;
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }

    public function sendEmailOtp(User $user): void
    {
        $code = (string) random_int(100000, 999999);

        $user->emailOtps()->whereNull('used_at')->update(['used_at' => now()]);
        $user->emailOtps()->create([
            'purpose' => 'email_verification',
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        $user->notify(new EmailOtpNotification($code));
    }

    public function verifyEmailOtp(User $user, string $code): void
    {
        $otp = EmailOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'email_verification')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otp || ! Hash::check($code, $otp->code_hash)) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid or expired.'],
            ]);
        }

        DB::transaction(function () use ($user, $otp) {
            $otp->update(['used_at' => now()]);
            $user->forceFill(['email_verified_at' => now()])->save();
        });
    }

    public function sendResetLink(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }
}
