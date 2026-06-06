# WorkforcePro Platform

## Project Structure
- **Frontend**: Next.js (TypeScript) at `frontend/`
- **Backend**: Laravel at `backend/`
- **Database**: MySQL/MariaDB
- **Auth**: Laravel Sanctum + Gmail OTP + Spatie Permission

## Tech Stack
- Frontend: Next.js, Tailwind CSS, HeroUI, shadcn/ui, DayFlow Calendar, Sileo toast, Axios
- Backend: Laravel, REST API (`/api/v1/`), Services, Requests, Resources, Middleware, Migrations, Seeders

## Features Implementation Status

### Fully Implemented (end-to-end with Service, Requests, Resource)
- [x] Auth (login, register, OTP, password reset, change password)
- [x] Employees (CRUD + import/export)
- [x] Attendance (check-in/out + summary)
- [x] Leave (requests + approve/reject + types)
- [x] Payroll
- [x] Dashboard (connected to backend API)
- [x] Shifts
- [x] Tasks
- [x] HR Tickets
- [x] Expenses
- [x] Assets
- [x] Notifications
- [x] Settings
- [x] Recruitment (Job Postings + Applications)
- [x] Onboarding
- [x] Performance
- [x] Documents
- [x] Departments
- [x] Reports (summary, department-headcount, attendance-trend, payroll-summary, performance-summary)
- [x] Approvals (with approve/reject from approvals page)
- [x] Seeders for all modules
- [x] Calendar (DayFlow Calendar with leave + attendance events)
- [x] Audit Logs
- [x] Roles & Permissions (Spatie Permission)

### Architecture
- All modules follow the pattern: Controller -> Service -> Model
- All write operations use FormRequest classes for validation + authorization
- All API responses use JsonResource classes for consistent output
- Authorization: Spatie Permission middleware at route level + FormRequest authorize()
- Seeders: RolePermission, CompanyStructure, Employee, LeaveType, Shift, Announcement, Asset, Setting, JobPosting

## Rules
- Do not put all code in one file
- Always create clean folder structure
- Always validate on backend with Form Request classes
- Always protect routes by role
- Always use reusable components
- Before coding a big feature, make a plan first
  Compose setup to use project-scoped container names and alternate host ports: frontend 3001,
  backend 18000, Postgres 15432, Redis 16379