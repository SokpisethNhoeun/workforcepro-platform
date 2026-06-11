# WorkforcePro Backend

Laravel API for the WorkforcePro HR platform.

## Stack

- Laravel 13
- PHP 8.3+
- PostgreSQL
- Redis for cache, queues, and sessions
- Laravel Sanctum personal access tokens
- Spatie Permission for RBAC

## Local Setup

From the repository root, Docker Compose is the recommended path:

```bash
cp .env.example .env
docker compose up -d
```

The backend is exposed at `http://localhost:18000`.

Manual setup:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=18000
```

Important environment values:

```env
APP_URL=http://localhost:18000
FRONTEND_URL=http://localhost:3001
DB_CONNECTION=pgsql
SANCTUM_STATEFUL_DOMAINS=
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
SEED_USER_PASSWORD=change-this-seed-password
```

`SANCTUM_STATEFUL_DOMAINS` should stay empty because this API uses bearer tokens, not Sanctum cookie sessions.

## Useful Commands

```bash
php artisan route:list --path=api/v1
php artisan migrate:fresh --seed
php artisan test
vendor/bin/pint
```

## Seeded Login Accounts

Run `php artisan migrate:fresh --seed` to recreate the database with these role accounts.
All seeded users use the password from `SEED_USER_PASSWORD` in `backend/.env`.

| Role | Email |
| --- | --- |
| Admin | `ahboy5518@gmail.com` |
| HR | `ahboy5519@gmail.com` |
| Manager | `ahboy1819@gmail.com` |
| Employee | `sokpisethnhom09631@gmail.com` |

## Swagger UI

Swagger UI is available from the backend:

- `http://localhost:18000/docs`
- `http://localhost:18000/swagger`
- `http://localhost:18000/api/documentation`

The OpenAPI JSON is served at `http://localhost:18000/openapi.json`.

## API Shape

Routes live in `routes/api.php` under `/api/v1`. Protected routes use `auth:sanctum` and permission middleware. Writes should use FormRequest validation, service-layer business logic, and `ApiResponse` envelopes.

## Auth, OTP, and Password Flow

Register:

1. `POST /api/v1/auth/register`
2. Body: `name`, `email`, optional `phone`, `password`, `password_confirmation`
3. The API creates the user with the `Employee` role and queues a 6-digit email OTP.
4. Login to get a bearer token, then verify the OTP with `POST /api/v1/auth/email/verify`.

Email verification OTP:

1. `POST /api/v1/auth/email/resend` with bearer token to send a new code.
2. `POST /api/v1/auth/email/verify` with bearer token and body `{ "code": "123456" }`.
3. OTP codes expire after 10 minutes.

Login:

1. `POST /api/v1/auth/login`
2. Body: `email`, `password`, optional `remember`
3. Copy `data.access_token` from the response.
4. Use `Authorization: Bearer <token>` for protected endpoints.

Forgot password:

1. `POST /api/v1/auth/forgot-password` with body `{ "email": "user@example.com" }`.
2. The API queues a Laravel password reset email.
3. Submit the emailed token to `POST /api/v1/auth/reset-password` with `token`, `email`, `password`, and `password_confirmation`.

Email delivery depends on the configured mailer and queue worker. In local development, keep the queue worker running when `QUEUE_CONNECTION` is not `sync`.
