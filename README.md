# WorkforcePro Platform

An end-to-end Enterprise HR / workforce-management platform. Employees, attendance, leave, payroll, performance, recruitment, onboarding, documents, assets, expenses, tickets, announcements, calendar — all behind a role-and-permission based access model with audit logging.

---

## 1. Architecture

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  Next.js frontend (3001) │  HTTPS │   Laravel API (18000)    │
│  TypeScript · Tailwind   │  ────► │   REST `/api/v1/*`        │
│  HeroUI / shadcn / Sileo │        │   Sanctum bearer tokens   │
└──────────────────────────┘        └──────────┬───────────────┘
                                               │
                       ┌───────────────────────┼────────────────────────┐
                       ▼                       ▼                        ▼
                ┌──────────────┐       ┌──────────────┐         ┌──────────────┐
                │ PostgreSQL   │       │  Redis (sess │         │ Gmail SMTP   │
                │  (port 15432)│       │  / cache /Q) │         │  (OTP / mail)│
                └──────────────┘       └──────────────┘         └──────────────┘
```

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), TypeScript, React 19, Tailwind v4 |
| UI kit | HeroUI (inputs/buttons/dropdowns/tabs), shadcn/ui (sidebar, layout), DayFlow Calendar, Sileo toasts, lucide-react icons |
| Forms / data | react-hook-form + zod, axios, next-themes |
| Backend | Laravel 13, PHP 8.3+, REST API, FormRequest validation, JsonResource responses |
| Auth | Laravel Sanctum (Personal Access Tokens) + Gmail OTP for verification + Spatie Permission |
| Database | PostgreSQL 17 |
| Async | Redis (session, cache, queues), Gmail SMTP |

---

## 2. Repository layout

```
LARAVEL_FINAL/
├── backend/                    Laravel app
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/v1   thin controllers, one per module
│   │   │   ├── Requests/             FormRequest classes (validation + authorize)
│   │   │   ├── Resources/            JsonResource transformers
│   │   │   └── Middleware/           ApiRequestLogger, etc.
│   │   ├── Models/                   Eloquent models
│   │   └── Services/                 business logic (Controller → Service → Model)
│   ├── routes/api.php                versioned API under /api/v1
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/                  RolePermission, CompanyStructure, Employee, …
│   └── config/                       sanctum, cors, sileo …
│
├── frontend/                   Next.js app
│   ├── src/
│   │   ├── app/                     App-Router pages (one folder per route)
│   │   ├── components/
│   │   │   ├── ui/                  shadcn/ui primitives
│   │   │   ├── form/                FormField, FormSelect, FormCombobox, FormDate …
│   │   │   ├── providers/           AppProviders (Theme, Auth, Toaster)
│   │   │   ├── employees/  attendance/  leave/  payroll/  …  one folder per module
│   │   │   └── nav-main.tsx  nav-user.tsx  app-sidebar.tsx
│   │   └── lib/
│   │       ├── api/                 axios client, useLookup, sanitizePayload
│   │       └── auth/                auth context, cookie helpers
│   ├── public/
│   └── package.json
│
└── CLAUDE.md / AGENTS.md       project conventions (read before contributing)
```

---

## 3. Feature inventory

All modules ship end-to-end (Controller → Service → FormRequest → Resource → Migration → Seeder → frontend page).

| Module | Frontend route | Highlights |
|---|---|---|
| Auth | `/login`, `/register` | Sanctum token, Gmail OTP, password reset, change-password |
| Dashboard | `/` | Live counts from backend |
| Employees | `/employees` | CRUD + Excel import/export + cascading department→position dropdown |
| Departments | `/departments` | CRUD, hierarchical |
| Attendance | `/attendance` | Check-in/out, summary, late/early flags |
| Shifts | `/shifts` | Shift CRUD + assignment |
| Leave | `/leave-requests` | Request, approve/reject, leave types |
| Payroll | `/payroll` | Run, lines, payslip |
| Tasks | `/tasks` | Assignment, status |
| HR Tickets | `/hr-tickets` | Category, priority, status workflow |
| Expenses | `/expenses` | Submission + approval |
| Assets | `/assets` | Inventory, assignment |
| Documents | `/documents` | File metadata + expiry |
| Notifications | `/notifications` | In-app inbox |
| Recruitment | `/recruitment` | Job postings + applications |
| Onboarding | `/onboarding` | Checklists + progress |
| Performance | `/performance` | Reviews, goals |
| Announcements | `/announcements` | Broadcast |
| Calendar | `/calendar` | DayFlow Calendar — leave + attendance + custom events |
| Reports | `/reports` | Headcount, attendance trend, payroll, performance |
| Approvals | `/approvals` | Cross-module approve/reject queue |
| Audit Logs | `/audit-logs` | Mutating endpoints logged via middleware |
| Settings | `/settings` | App settings (RBAC) |
| Profile | `/profile` | Self-service profile |

---

## 4. Backend conventions

- **Routing:** `routes/api.php`, all under `/api/v1`.
- **Authentication:** Sanctum personal access tokens. Login returns `access_token`; subsequent requests send `Authorization: Bearer <token>`.
- **Authorization:** Spatie Permission middleware at the route level (`permission:employees.manage`, …) **and** a second check inside each `FormRequest::authorize()`.
- **Validation:** every write goes through a `FormRequest` (`StoreEmployeeRequest`, `UpdateLeaveRequest`, …). No `validate()` calls in controllers.
- **Responses:** every read uses a `JsonResource` (`EmployeeResource`, …) wrapped in the project-wide `ApiResponse::success(...)` envelope:

  ```json
  { "success": true, "message": "...", "data": { ... }, "meta": { ... } }
  ```

- **Layering:** Controller → Service → Model. Controllers stay thin.
- **Audit:** `ApiRequestLogger` middleware records mutating requests.
- **Seeders:** `RolePermissionSeeder`, `CompanyStructureSeeder`, `EmployeeSeeder`, `LeaveTypeSeeder`, `ShiftSeeder`, `AnnouncementSeeder`, `AssetSeeder`, `SettingSeeder`, `JobPostingSeeder`.

---

## 5. Frontend conventions

- **API client:** `src/lib/api/client.ts`. Axios instance with `withCredentials: false`, base URL from `NEXT_PUBLIC_API_URL`.
  - `api` — axios instance
  - `sanitizePayload(values)` — strips `""`, `null`, `undefined` before POST/PUT so Laravel's `exists` / `date` / `email` rules don't reject empty strings. **Always call this on form payloads.**
  - `apiErrorMessage(err)` — flattens Laravel validation errors to a single string for toasts.
  - `csrf()` — a no-op (the API is stateless, Bearer-token only).
- **Lookups:** `useLookup("employees")` / `useLookup("positions", { department_id })`. Backed by the normal module list endpoints. Parametrised lookups re-fetch when params change, used for cascading dropdowns.
- **Forms:** `react-hook-form` + `zod`. Reusable `<FormField>`, `<FormSelect>`, `<FormCombobox>`, `<FormDate>`, `<FormTextarea>` wrap HeroUI/shadcn inputs and wire up errors automatically.
- **Sidebar:** `nav-main.tsx` is a controlled accordion. Only one section is open at a time, and the active section opens based on `pathname`. Permission-gated items are filtered out of the visible list.
- **Theme:** `next-themes` with `attribute="class"`. The user-menu dropdown cycles light → dark → system. The Sileo `<Toaster>` receives a `theme` prop derived from `resolvedTheme` (flipped to compensate for Sileo's inverted naming) so the toast contrast tracks the app theme.
- **Toasts:** `sileo.success({ title, description })` / `sileo.error({ title, description })`.

---

## 6. Local development

### 6.1 Prerequisites

- PHP 8.x with composer
- Node 20+ with npm or pnpm
- PostgreSQL
- Redis
- Docker Compose (optional)

### 6.2 Compose (recommended)

The provided compose file uses project-scoped container names and alternate host ports:

| Service | Host port |
|---|---|
| frontend | **3001** |
| backend | **18000** |
| PostgreSQL | 15432 |
| Redis | 16379 |

```bash
docker compose up -d
```

### 6.3 Backend setup (manual)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=18000
```

Key `.env` entries:

```env
APP_URL=http://localhost:18000
FRONTEND_URL=http://localhost:3001

# Bearer-token API: keep this EMPTY so requests are stateless and CSRF is not enforced.
SANCTUM_STATEFUL_DOMAINS=

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001

# Sessions (still used internally by Redis cache; not used for API auth)
SESSION_DRIVER=redis
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=lax
```

### 6.4 Frontend setup (manual)

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:18000 npm run dev -- --port 3001
```

Open <http://localhost:3001>. Default seeded admin: `admin@workforcepro.test` / see `EmployeeSeeder` for the password.

---

## 7. Authentication flow

1. User submits credentials to `POST /api/v1/auth/login` (CSRF-exempt).
2. Backend verifies → optionally triggers Gmail OTP for unverified emails.
3. On success backend returns `{ access_token, user, roles, permissions }`.
4. Frontend stores token in `localStorage` under `workforcepro.auth_token` and attaches it to every axios request as `Authorization: Bearer <token>`.
5. `useAuth()` exposes `user`, `roles`, `hasPermission(name)` for route guards and conditional UI.
6. `POST /api/v1/auth/logout` revokes the token and the frontend clears local state.

`SANCTUM_STATEFUL_DOMAINS` is intentionally **empty**: the API is purely token-based, no session cookies, no CSRF round-trip.

---

## 8. Adding a new module — checklist

1. **Migration** in `backend/database/migrations`.
2. **Model** in `backend/app/Models`.
3. **Service** in `backend/app/Services` (all write logic lives here).
4. **FormRequests** (`StoreXyzRequest`, `UpdateXyzRequest`) with `authorize()` + `rules()`.
5. **Resource** in `backend/app/Http/Resources` returning a consistent shape.
6. **Controller** in `backend/app/Http/Controllers/Api/v1` — only orchestration, no validation, no queries.
7. **Routes** in `routes/api.php` under the relevant resource group with `permission:` middleware.
8. **Permission strings** added to `RolePermissionSeeder` and assigned to roles.
9. **Seeder** with realistic demo data, registered in `DatabaseSeeder`.
10. **Frontend page** under `src/app/<module>/page.tsx` rendering `src/components/<module>/<module>-management.tsx`.
11. **Frontend form** with `react-hook-form` + `zod`, submitting via `sanitizePayload(values)` to avoid empty-string rejection.
12. **Sidebar entry** in `src/components/app-sidebar.tsx` with the correct `permission` string so it auto-hides for users without access.

---

## 9. Conventions / rules

- Never put everything in one file. Controllers stay thin, services hold logic.
- Always validate on the backend through a `FormRequest`.
- Always protect routes by role / permission.
- Reuse components — don't copy form scaffolding between modules; extend the helpers in `src/components/form`.
- Before coding a big feature, write a plan.
- Trust the documented compose ports: frontend 3001, backend 18000, PostgreSQL 15432, Redis 16379.

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 419 CSRF token mismatch on every API call | Frontend origin is listed in `SANCTUM_STATEFUL_DOMAINS` → Sanctum forces session+CSRF, but the app is Bearer-token based | Set `SANCTUM_STATEFUL_DOMAINS=` (empty), restart backend, clear `XSRF-TOKEN` / `laravel_session` cookies in the browser |
| "The X field must be a valid date / X is invalid" when a form submits | Frontend sent `""` for an optional field, and Laravel's `date` / `exists` / `email` rule rejects empty strings | Wrap the payload in `sanitizePayload(values)` before `api.post` / `api.put` |
| Sidebar dropdown stays open after navigation | Using uncontrolled `<Collapsible defaultOpen>` | `nav-main.tsx` is now a controlled accordion driven by `usePathname()` |
| Toast description text invisible | Sileo's default theme colors are inverted; `<Toaster>` had no `theme` prop | `ThemedToaster` in `app-providers.tsx` flips the prop, and `globals.css` sets explicit description / title colors per `data-theme` |
| Position dropdown shows positions from other departments | Static `useLookup("positions")` | Use `useLookup("positions", { department_id })`; the position field resets when the department changes |

---

## 11. Scripts

Frontend:

```bash
npm run dev           # next dev (Turbopack)
npm run build         # next build
npm run lint
npm run typecheck
```

Backend:

```bash
php artisan serve --port=18000
php artisan migrate
php artisan db:seed
php artisan test
php artisan route:list --path=api/v1
```
