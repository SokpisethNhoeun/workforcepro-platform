# WorkforcePro Frontend

Next.js frontend for the WorkforcePro HR platform.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- HeroUI, shadcn/ui, lucide-react
- react-hook-form and zod
- Axios bearer-token API client

## Local Setup

From the repository root, Docker Compose is the recommended path:

```bash
docker compose up -d
```

The frontend is exposed at `http://localhost:3001`.

Manual setup:

```bash
cd frontend
npm install
API_BASE_URL=http://localhost:18000 npm run dev -- --port 3001
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Environment

```bash
API_BASE_URL=http://localhost:18000
NEXT_PUBLIC_APP_NAME=WorkforcePro
```

Use `API_BASE_URL` only on the Next.js server side. The browser calls the
same-origin `/api/v1/*` route handler, which forwards requests to Laravel.

## API Notes

The API client is `src/lib/api/client.ts`. It stores the Sanctum personal access token in browser local storage and sends it as `Authorization: Bearer <token>` to the Next.js route handler. The small `wfp_auth` cookie is only a frontend route-guard hint for Next middleware; it is not an API session cookie.
