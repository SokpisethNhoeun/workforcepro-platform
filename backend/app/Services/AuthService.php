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
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use PragmaRX\Google2FA\Google2FA;
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

    public function sendPasswordResetOtp(string $email): void
    {
        $user = User::where('email', $email)->first();
        if (! $user) {
            return; // silently fail — don't leak whether email exists
        }

        $code = (string) random_int(100000, 999999);

        $user->emailOtps()->where('purpose', 'password_reset')->whereNull('used_at')->update(['used_at' => now()]);
        $user->emailOtps()->create([
            'purpose'    => 'password_reset',
            'code_hash'  => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        $user->notify(new EmailOtpNotification($code));
    }

    public function resetPasswordWithOtp(string $email, string $code, string $password): void
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this email address.'],
            ]);
        }

        $otp = EmailOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'password_reset')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otp || ! Hash::check($code, $otp->code_hash)) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid or expired.'],
            ]);
        }

        DB::transaction(function () use ($user, $otp, $password) {
            $otp->update(['used_at' => now()]);
            $user->forceFill(['password' => Hash::make($password)])->save();
        });
    }

    // ──────────────────────────────────────────────
    // Google OAuth
    // ──────────────────────────────────────────────

    public function getGoogleRedirectUrl(): string
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();
    }

    public function handleGoogleCallback(): User
    {
        $googleUser = Socialite::driver('google')
            ->stateless()
            ->user();

        return DB::transaction(function () use ($googleUser) {
            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                ]);
            } else {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                ]);

                if (method_exists($user, 'assignRole') && Role::where('name', 'Employee')->exists()) {
                    $user->assignRole('Employee');
                }
            }

            $user->forceFill(['last_login_at' => now()])->save();

            return $user->load('roles', 'employee.department', 'employee.position');
        });
    }

    // ──────────────────────────────────────────────
    // Two-Factor Authentication (TOTP)
    // ──────────────────────────────────────────────

    public function enableTwoFactor(User $user): array
    {
        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => $this->generateRecoveryCodes(),
        ])->save();

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ];
    }

    public function confirmTwoFactor(User $user, string $code): void
    {
        if (! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'code' => ['Two-factor authentication has not been enabled.'],
            ]);
        }

        if (! $this->verifyTwoFactorCode($user, $code)) {
            throw ValidationException::withMessages([
                'code' => ['The provided two-factor code is invalid.'],
            ]);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
    }

    public function disableTwoFactor(User $user, string $password): void
    {
        if (! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }

    public function verifyTwoFactorCode(User $user, string $code): bool
    {
        $google2fa = new Google2FA();

        return $google2fa->verifyKey($user->two_factor_secret, $code);
    }

    public function verifyRecoveryCode(User $user, string $code): bool
    {
        $codes = $user->two_factor_recovery_codes ?? [];
        $index = array_search($code, $codes, true);

        if ($index === false) {
            return false;
        }

        unset($codes[$index]);
        $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();

        return true;
    }

    public function getRecoveryCodes(User $user): array
    {
        return $user->two_factor_recovery_codes ?? [];
    }

    public function regenerateRecoveryCodes(User $user): array
    {
        $codes = $this->generateRecoveryCodes();
        $user->forceFill(['two_factor_recovery_codes' => $codes])->save();

        return $codes;
    }

    private function generateRecoveryCodes(): array
    {
        return array_map(fn () => Str::random(10) . '-' . Str::random(10), range(1, 8));
    }
}
