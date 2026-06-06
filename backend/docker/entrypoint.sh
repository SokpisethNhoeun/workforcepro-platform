#!/usr/bin/env sh
set -eu

if [ ! -f .env ]; then
  cp .env.example .env
fi

if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
  php artisan key:generate --force --ansi
fi

php artisan storage:link --force >/dev/null 2>&1 || true
php artisan migrate --force --ansi

exec "$@"
