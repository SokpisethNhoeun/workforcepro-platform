#!/usr/bin/env sh
set -eu

mkdir -p storage/framework bootstrap/cache

{
  flock -w 120 9

  if [ ! -f .env ]; then
    cp .env.example .env
  fi

  if ! grep -q '^APP_KEY=' .env 2>/dev/null; then
    printf '\nAPP_KEY=\n' >> .env
  fi

  if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    unset APP_KEY
    php artisan key:generate --force --ansi
  fi

  APP_KEY_VALUE="$(grep '^APP_KEY=' .env | tail -n 1 | cut -d= -f2-)"
  if [ -n "$APP_KEY_VALUE" ]; then
    export APP_KEY="$APP_KEY_VALUE"
  fi

  php artisan storage:link --force >/dev/null 2>&1 || true
  php artisan migrate --force --ansi
} 9>storage/framework/docker-entrypoint.lock

exec "$@"
