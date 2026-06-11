Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 WorkforcePro Production-Readiness Action Plan

 Context

 WorkforcePro is a Laravel + Next.js HR platform with 22+ modules. The production readiness review scored Security 4/10, Architecture
 6/10, Scalability 5/10, and DevOps 4/10. This plan addresses all findings systematically, from critical security blockers to long-term
 enhancements. The user also clarified that login should support Google OAuth, forgot password should send a link to Gmail, and account
 settings should enable 2FA via Google Authenticator.

 Current deployment: backend on ngrok (sulk-valid-avenging.ngrok-free.dev), frontend on Vercel (workforcepro-platform.vercel.app). Auth
 uses Sanctum bearer tokens stored in localStorage (XSS risk). No rate limiting, no policies, no 2FA, no Google OAuth.

 ---
 Phase 1: Critical Security Fixes

 Dependency: None — this is the foundation.
 Size: M (~15 files)

 1A. Token Expiration

 - backend/config/sanctum.php — set 'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 1440) (24h default)
 - backend/.env / .env.example — add SANCTUM_TOKEN_EXPIRATION=1440

 1B. Rate Limiting

 - backend/app/Providers/AppServiceProvider.php — register rate limiters in boot():
   - auth: 5 requests/minute per email+IP (login, register, forgot-password, OTP)
   - api: 60 requests/minute per user
 - backend/routes/api.php — apply throttle:auth to public auth routes (lines 37-42), throttle:api to the auth:sanctum group (line 53)
 - backend/bootstrap/app.php — add ThrottleRequestsException render returning 429 with retry-after

 1C. Sensitive Data in EmployeeResource

 - backend/app/Http/Resources/EmployeeResource.php — wrap sensitive fields (base_salary, salary_currency, tax_identifier, nssf_number,
 contracts, performance_histories) in $this->when() checking if user is Admin/HR or viewing own record
 - New: backend/app/Http/Resources/EmployeeListResource.php — lightweight resource for index endpoints (no salary, no tax ID, no
 contracts)
 - backend/app/Http/Controllers/Api/Employees/EmployeeController.php — use EmployeeListResource::collection() in index(), keep
 EmployeeResource for show()

 1D. Encrypt Sensitive DB Fields

 - backend/app/Models/Employee.php — add 'tax_identifier' => 'encrypted', 'nssf_number' => 'encrypted' to $casts
 - New migration: encrypt existing plain-text values for tax_identifier and nssf_number

 1E. File Upload Security

 - backend/app/Http/Requests/Documents/StoreDocumentRequest.php — change file_path string rule to 'file' => ['required', 'file',
 'max:10240', 'mimes:pdf,doc,docx,jpg,jpeg,png,xlsx,csv']
 - backend/app/Services/DocumentService.php — store actual uploaded file via Storage::disk('local')->putFile('documents', $file), set
 file_path, mime_type, size_bytes from upload
 - backend/app/Http/Controllers/Api/Documents/DocumentController.php — add download() method with authorization check, return signed
 file response

 1F. Session & Env Security

 - backend/.env — set SESSION_ENCRYPT=true, change DB_PASSWORD from workforcepro to a strong password
 - backend/.env.example — remove real credentials, use placeholder values
 - backend/config/cors.php — restrict allowed_origins to env-driven domains, remove wildcard patterns

 1G. Frontend Token Storage (Move to HttpOnly Cookie)

 - frontend/src/lib/api/client.ts — remove localStorage token storage; send requests without Bearer header (proxy handles it)
 - New: frontend/src/app/api/auth/login/route.ts — proxy that calls backend login, receives token, sets it as HttpOnly Secure
 SameSite=Strict cookie (wfp_token), returns user data
 - New: frontend/src/app/api/auth/register/route.ts — same pattern for registration
 - New: frontend/src/app/api/auth/logout/route.ts — clears the HttpOnly cookie
 - frontend/src/services/backend-api.service.ts (or frontend/src/app/api/v1/[...path]/route.ts) — read wfp_token from cookies and attach
  as Authorization: Bearer when forwarding to backend
 - frontend/src/lib/auth/auth-context.tsx — remove setAuthToken() calls; login/register call the new auth proxy routes instead of
 /api/v1/auth/login directly
 - frontend/src/lib/auth/cookie.ts — keep hint cookie for middleware UX, but real token is HttpOnly

 ---
 Phase 2: Auth Enhancements (Google OAuth + 2FA)

 Dependency: Phase 1 (token storage pattern settled)
 Size: L (~18 files)

 2A. Google OAuth (Backend)

 - composer require laravel/socialite
 - backend/config/services.php — add Google OAuth config (client_id, client_secret, redirect from env)
 - New migration: add_google_id_to_users_table — adds google_id (nullable unique), avatar_url (nullable)
 - backend/app/Models/User.php — add google_id, avatar_url to fillable
 - backend/app/Services/AuthService.php — add getGoogleRedirectUrl() and handleGoogleCallback(string $code) methods (find-or-create user
  by google_id/email, link employee if email matches, assign Employee role, create token)
 - backend/app/Http/Controllers/Api/Auth/AuthController.php — add googleRedirect() and googleCallback() endpoints
 - backend/routes/api.php — add public routes: GET auth/google and POST auth/google/callback
 - backend/.env — add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

 2B. Google OAuth (Frontend)

 - frontend/src/app/login/page.tsx — add "Sign in with Google" button
 - frontend/src/lib/auth/auth-context.tsx — add loginWithGoogle(code) method
 - New: frontend/src/app/api/auth/google/callback/route.ts — proxy that exchanges code with backend, sets HttpOnly token cookie

 2C. Two-Factor Authentication (TOTP — Google Authenticator)

 - composer require pragmarx/google2fa-laravel + bacon/bacon-qr-code
 - New migration: add_two_factor_to_users_table — two_factor_secret (encrypted text), two_factor_recovery_codes (encrypted text),
 two_factor_confirmed_at (timestamp)
 - backend/app/Models/User.php — add 2FA columns to fillable + encrypted casts
 - backend/app/Services/AuthService.php — add methods: enableTwoFactor(), confirmTwoFactor(), disableTwoFactor(), verifyTwoFactorCode().
  Login flow: if 2FA enabled, return {two_factor_required: true, challenge_token: ...} instead of full token
 - backend/app/Http/Controllers/Api/Auth/AuthController.php — add endpoints: enableTwoFactor, confirmTwoFactor, disableTwoFactor,
 twoFactorChallenge
 - backend/routes/api.php — add protected 2FA routes + public challenge route
 - New: frontend/src/components/auth/two-factor-challenge.tsx — TOTP input during login
 - New: frontend/src/components/profile/two-factor-setup.tsx — QR code + confirmation in account settings
 - frontend/src/app/login/page.tsx — handle two_factor_required response, show TOTP input
 - frontend/src/app/(protected)/settings/page.tsx or profile page — add 2FA enable/disable section

 2D. Password Reset via Gmail Link

 - Already partially implemented (backend has forgotPassword() using Password::sendResetLink()). Verify the email template sends a
 proper link to FRONTEND_URL/reset-password?token=...&email=...
 - frontend/src/app/reset-password/page.tsx — support both OTP-based and link-based reset (read token + email from URL params)

 ---
 Phase 3: Authorization Depth (Policies + Ownership)

 Dependency: Phase 1C (field-level access in resources)
 Size: L (~20 files)

 3A. Laravel Policies (10 new files)

 Create policies following this pattern (check role hierarchy + ownership):
 - backend/app/Policies/EmployeePolicy.php — Admin/HR: all; Manager: own department; Employee: self only
 - backend/app/Policies/LeaveRequestPolicy.php — Admin/HR: all; Manager: department; Employee: own
 - backend/app/Policies/ExpensePolicy.php — same pattern
 - backend/app/Policies/AttendancePolicy.php — same pattern
 - backend/app/Policies/DocumentPolicy.php — Admin/HR: all; Employee: own documents
 - backend/app/Policies/PayrollRunPolicy.php — Admin/HR only
 - backend/app/Policies/HrTicketPolicy.php — Admin/HR: all; Employee: own tickets
 - backend/app/Policies/TaskPolicy.php — Admin/Manager: manage; Employee: assigned tasks
 - backend/app/Policies/AssetPolicy.php — Admin/HR: manage; Employee: view assigned
 - backend/app/Policies/NotificationPolicy.php — users can only manage own notifications

 3B. Apply Policies in Controllers

 Every controller show(), update(), destroy() must call $this->authorize('action', $model). Key files:
 - backend/app/Http/Controllers/Api/Employees/EmployeeController.php
 - backend/app/Http/Controllers/Api/Leave/LeaveRequestController.php
 - backend/app/Http/Controllers/Api/Expenses/ExpenseController.php
 - backend/app/Http/Controllers/Api/Documents/DocumentController.php
 - backend/app/Http/Controllers/Api/Notifications/NotificationController.php
 - All other resource controllers

 3C. Scope Queries by Ownership

 Modify service paginate() / index() methods to accept User $user and filter by role:
 - Employee role: only own records (employee_id = user->employee->id)
 - Manager role: own department's records
 - Admin/HR: all records

 Services to modify: LeaveService, ExpenseService, AttendanceService, DocumentService, TaskService, HrTicketService, NotificationService

 ---
 Phase 4: Approval Workflow Redesign

 Dependency: Phase 3 (policies + ownership)
 Size: XL (~10 files)

 4A. State Machine + Validation

 - New: backend/app/Enums/ApprovalStatus.php — PHP enum: Pending, InReview, Approved, Rejected, Cancelled
 - backend/app/Models/LeaveRequest.php — cast status to enum, add scopes (scopePending, scopeForApprover)
 - backend/app/Models/Expense.php — same

 4B. Approval Service

 - New: backend/app/Services/ApprovalService.php — centralized logic:
   - canApprove(User, Model): bool — checks: not self-approval, user is Manager/HR/Admin, item is still pending, user is in correct
 department chain
   - approve(Model, User, ?comments) — validates, updates status, records approved_by + responded_at
   - reject(Model, User, reason) — validates, updates status, records rejection reason
   - getPendingForApprover(User) — returns only items this user is authorized to approve

 4C. Refactor Controller

 - backend/app/Http/Controllers/Api/Approvals/ApprovalController.php — replace inline logic with ApprovalService calls, add
 self-approval check, add "already processed" check, add rejection reason requirement
 - New: backend/app/Http/Requests/Approvals/ApprovalActionRequest.php — validate comments (optional on approve, required on reject)

 4D. Approval Audit Log

 - New migration: create_approval_logs_table — approvable_type, approvable_id, user_id, action, comments, timestamps
 - New: backend/app/Models/ApprovalLog.php
 - ApprovalService writes to this table on every approve/reject

 ---
 Phase 5: Architecture Cleanup

 Dependency: Phase 3
 Size: M (~15 files)

 5A. Extract Logic from Controllers to Services

 - backend/app/Http/Controllers/Api/Payroll/PayrollController.php — move creation/processing logic to PayrollService
 - Create missing FormRequest classes for controllers that use inline $request->validate():
   - backend/app/Http/Requests/Payroll/StorePayrollRunRequest.php
   - backend/app/Http/Requests/Payroll/ProcessPayrollRunRequest.php
   - backend/app/Http/Requests/Calendar/StoreCalendarEventRequest.php
   - backend/app/Http/Requests/Calendar/UpdateCalendarEventRequest.php
   - Others as needed (audit which controllers do inline validation)

 5B. Missing JsonResources

 - New: backend/app/Http/Resources/PayrollRunResource.php
 - New: backend/app/Http/Resources/PayslipResource.php
 - New: backend/app/Http/Resources/ApprovalItemResource.php
 - Apply in respective controllers

 5C. Exception Handling

 - backend/bootstrap/app.php — add renders for:
   - AuthorizationException → 403
   - ModelNotFoundException → 404 "Resource not found"
   - ThrottleRequestsException → 429 with Retry-After header
   - AuthenticationException → 401

 5D. Pagination Cap

 - backend/app/Providers/AppServiceProvider.php — add global: $perPage = min($request->input('per_page', 15), 100) pattern, or add to a
 base service method that all services use

 ---
 Phase 6: Database Hardening

 Dependency: Phase 4 (batch migration changes)
 Size: M (~3 migrations, ~8 models)

 6A. Soft Deletes on Critical Tables

 - New migration: add deleted_at to leave_requests, expenses, payroll_runs, payslips, employee_documents, employee_contracts, assets,
 hr_tickets
 - Add SoftDeletes trait to corresponding models

 6B. Performance Indexes

 - New migration: add indexes on:
   - expenses(employee_id, status), expenses(expense_date)
   - tasks(assigned_to, status)
   - hr_tickets(employee_id, status)
   - payslips(employee_id)
   - employee_documents(employee_id)
   - employee_contracts(employee_id, status)
   - assets(assigned_to)
   - job_applications(job_posting_id, status)

 6C. Check Constraints (PostgreSQL)

 - New migration: add check constraints for status enums:
   - leave_requests.status IN ('pending', 'approved', 'rejected', 'cancelled')
   - expenses.status IN ('pending', 'approved', 'rejected')
   - payroll_runs.status IN ('draft', 'processing', 'completed', 'cancelled')
   - payslips.status IN ('draft', 'finalized', 'paid')

 ---
 Phase 7: Testing

 Dependency: Phases 1-6 (test what exists)
 Size: XL (~25 files)

 7A. Test Infrastructure

 - backend/tests/TestCase.php — add role-based helper methods: actingAsAdmin(), actingAsHr(), actingAsManager(), actingAsEmployee()
 - New: backend/tests/Traits/CreatesTestUsers.php — factory helpers
 - New: backend/database/factories/EmployeeFactory.php
 - New: backend/database/factories/LeaveRequestFactory.php
 - New: backend/database/factories/ExpenseFactory.php
 - New: backend/database/factories/DepartmentFactory.php
 - backend/phpunit.xml — configure PostgreSQL test database (not SQLite, since app uses PG-specific features like ilike)

 7B. Feature Tests (Priority Order)

 1. tests/Feature/Auth/LoginTest.php — login, failed login, rate limiting, token expiration, 2FA challenge
 2. tests/Feature/Auth/GoogleOAuthTest.php — mock Socialite, test callback
 3. tests/Feature/Auth/TwoFactorTest.php — enable, confirm, challenge, disable
 4. tests/Feature/Employee/EmployeeCrudTest.php — CRUD + ownership scoping per role
 5. tests/Feature/Employee/EmployeePolicyTest.php — verify each role's access
 6. tests/Feature/Leave/LeaveRequestTest.php — create, approve, reject, self-approval prevention
 7. tests/Feature/Expense/ExpenseTest.php — same pattern
 8. tests/Feature/Approval/ApprovalWorkflowTest.php — full workflow with guards
 9. tests/Feature/Payroll/PayrollTest.php — run creation, processing
 10. tests/Feature/Document/DocumentUploadTest.php — file validation, download auth
 11. tests/Feature/RateLimitingTest.php — verify throttle middleware
 12. tests/Feature/SensitiveDataTest.php — verify EmployeeResource hides fields by role

 7C. Unit Tests

 - tests/Unit/Services/ApprovalServiceTest.php
 - tests/Unit/Services/PayrollServiceTest.php
 - tests/Unit/Resources/EmployeeResourceTest.php

 ---
 Phase 8: DevOps & Production

 Dependency: Phase 7 (tests exist before CI runs them)
 Size: L (~8 files)

 8A. Production Docker

 - New: backend/docker/Dockerfile.prod — PHP-FPM + Nginx multi-stage build, composer install --no-dev, optimized autoloader
 - New: backend/docker/nginx.conf — Nginx config for PHP-FPM
 - New: docker-compose.prod.yml — production overrides: no volume mounts, proper health checks, no php artisan serve

 8B. CI/CD Pipelines

 - New: .github/workflows/backend-ci.yml — PHP 8.4 + extensions, composer install, migrations, phpunit, Laravel Pint
 - New: .github/workflows/frontend-ci.yml — Node 22, npm ci, typecheck, lint, build
 - New: backend/.env.testing — test environment config

 8C. Monitoring & Health

 - backend/app/Http/Controllers/Api/Foundation/SystemHealthController.php — expand to check DB, Redis, queue, disk space
 - backend/config/logging.php — configure stderr channel for Docker, daily rotation for non-Docker

 8D. Environment Hardening

 - backend/.env.example — document ALL required env vars with safe placeholders (no real credentials)
 - .env.example (root) — same for docker-compose vars
 - .gitignore — verify .env files are ignored (they are)

 ---
 Phase 9: Extended Roles & Permissions

 Dependency: Phase 3 (policies exist)
 Size: M (~5 files)

 9A. Granular Permissions

 - backend/database/seeders/RolePermissionSeeder.php — add new permissions:
   - employees.view_salary (separate from employees.view)
   - employees.view_department (Manager: own department only)
   - payroll.view_own (Employee: own payslips)
   - leave.create, expenses.create (separate from .view)
   - attendance.check_in (separate from attendance.manage)

 9B. New Roles

 Add to seeder:
 - Payroll Officer: payroll.*, employees.view, employees.view_salary
 - Recruiter: recruitment.*, employees.view
 - Department Head: employees.view_department, leave.manage (department), performance.manage (department), approvals.manage
 - Auditor: audit.view, reports.view, read-only access to all modules

 9C. Manager Hierarchy Support

 - backend/app/Models/Employee.php — add subordinates() relationship, managedDepartmentIds() method
 - All policies use manager hierarchy for department-scoped access

 ---
 Phase 10: Long-Term Enhancements

 Dependency: All previous phases
 Size: XL (ongoing)

 - SSO/SAML for enterprise clients
 - WebAuthn/FIDO2 as additional MFA option
 - ABAC (Attribute-Based Access Control) when RBAC becomes insufficient
 - API versioning strategy (split routes into routes/api/v1.php, routes/api/v2.php)
 - Bounded contexts / DDD-lite module organization
 - Data retention policies and legal hold
 - Notification delivery channels with retries
 - Payroll locking and immutability enforcement
 - Blue/green deployments, metrics, alerts, DR plan

 ---
 Phase Dependency Graph

 Phase 1 (Critical Security) ─┬─> Phase 2 (Auth: OAuth + 2FA)
                               ├─> Phase 3 (Policies + Ownership) ─┬─> Phase 4 (Approvals)
                               │                                    └─> Phase 5 (Architecture)
                               └─> Phase 6 (Database)
                                          │
           All of 1-6 ───────────────────>Phase 7 (Testing)
                                               │
                                          Phase 8 (DevOps)
               All of 1-6 ───────────────────>Phase 7 (Testing)
                                                   │
                                              Phase 8 (DevOps)
                                                   │
                                   Phase 3 ──> Phase 9 (Extended Roles)
                                                   │
                                              Phase 10 (Long-term)

     ---
     Verification Strategy

     After each phase, verify:
     1. Phase 1: Attempt login >5 times rapidly (expect 429). Check EmployeeResource output per role. Upload invalid file type (expect
     rejection). Verify token expires after 24h.
     2. Phase 2: Complete Google OAuth login flow. Enable 2FA, log out, log in with TOTP code. Reset password via email link.
     3. Phase 3: As Employee, try to view another employee's details (expect 403). As Manager, verify department scoping.
     4. Phase 4: Try self-approval (expect rejection). Approve as Manager, verify audit log entry.
     5. Phase 5: Check all API responses follow {success, message, data} envelope. Verify 404/403/429 responses are clean.
     6. Phase 6: Run php artisan migrate on fresh DB, verify all constraints. Test soft delete + restore.
     7. Phase 7: php artisan test — all green.
     8. Phase 8: docker compose -f docker-compose.prod.yml up — backend serves via Nginx+FPM. CI pipeline runs on push.

     ---
     Env Vars Needed (New)

     # Phase 1
     SANCTUM_TOKEN_EXPIRATION=1440
     RATE_LIMIT_API=60
     RATE_LIMIT_AUTH=5

     # Phase 2
     GOOGLE_CLIENT_ID=
     GOOGLE_CLIENT_SECRET=
     GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/auth/google/callback

● Plan approved. Let me set up task tracking and start with Phase 1: Critical Security Fixes.
## Rules
- Do not put all code in one file
- Always create clean folder structure
- Always validate on backend with Form Request classes
- Always protect routes by role
- Always use reusable components
- Before coding a big feature, make a plan first
  Compose setup to use project-scoped container names and alternate host ports: frontend 3001,
  backend 18000, Postgres 15432, Redis 16379