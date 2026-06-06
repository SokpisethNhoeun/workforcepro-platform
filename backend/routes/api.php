<?php

use App\Http\Controllers\Api\Announcements\AnnouncementController;
use App\Http\Controllers\Api\Approvals\ApprovalController;
use App\Http\Controllers\Api\Assets\AssetController;
use App\Http\Controllers\Api\Attendance\AttendanceController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Calendar\CalendarEventController;
use App\Http\Controllers\Api\Documents\DocumentController;
use App\Http\Controllers\Api\Employees\DepartmentController;
use App\Http\Controllers\Api\Employees\EmployeeController;
use App\Http\Controllers\Api\Employees\PositionController;
use App\Http\Controllers\Api\Expenses\ExpenseController;
use App\Http\Controllers\Api\Foundation\AuditLogController;
use App\Http\Controllers\Api\Foundation\RoleController;
use App\Http\Controllers\Api\Foundation\SystemHealthController;
use App\Http\Controllers\Api\Foundation\UserRoleController;
use App\Http\Controllers\Api\Leave\LeaveRequestController;
use App\Http\Controllers\Api\Leave\LeaveTypeController;
use App\Http\Controllers\Api\Notifications\NotificationController;
use App\Http\Controllers\Api\Onboarding\OnboardingController;
use App\Http\Controllers\Api\Payroll\PayrollController;
use App\Http\Controllers\Api\Performance\PerformanceController;
use App\Http\Controllers\Api\Recruitment\JobApplicationController;
use App\Http\Controllers\Api\Recruitment\JobPostingController;
use App\Http\Controllers\Api\Reports\ReportController;
use App\Http\Controllers\Api\Settings\SettingController;
use App\Http\Controllers\Api\Shifts\ShiftController;
use App\Http\Controllers\Api\Tasks\TaskController;
use App\Http\Controllers\Api\Tickets\HrTicketController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('health', SystemHealthController::class);

    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('email/resend', [AuthController::class, 'resendVerification']);
            Route::post('email/verify', [AuthController::class, 'verifyEmail']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('roles/permissions', [RoleController::class, 'permissions'])->middleware('permission:roles.view');
        Route::apiResource('roles', RoleController::class)->except(['show'])->middleware('permission:roles.manage');
        Route::put('users/{user}/roles', [UserRoleController::class, 'update'])->middleware('permission:roles.assign');

        Route::get('departments', [DepartmentController::class, 'index'])->middleware('permission:departments.view');
        Route::post('departments', [DepartmentController::class, 'store'])->middleware('permission:departments.manage');
        Route::get('departments/{department}', [DepartmentController::class, 'show'])->middleware('permission:departments.view');
        Route::put('departments/{department}', [DepartmentController::class, 'update'])->middleware('permission:departments.manage');
        Route::patch('departments/{department}', [DepartmentController::class, 'update'])->middleware('permission:departments.manage');
        Route::delete('departments/{department}', [DepartmentController::class, 'destroy'])->middleware('permission:departments.manage');

        Route::get('positions', [PositionController::class, 'index'])->middleware('permission:departments.view');
        Route::post('positions', [PositionController::class, 'store'])->middleware('permission:departments.manage');
        Route::get('positions/{position}', [PositionController::class, 'show'])->middleware('permission:departments.view');
        Route::put('positions/{position}', [PositionController::class, 'update'])->middleware('permission:departments.manage');
        Route::patch('positions/{position}', [PositionController::class, 'update'])->middleware('permission:departments.manage');
        Route::delete('positions/{position}', [PositionController::class, 'destroy'])->middleware('permission:departments.manage');

        Route::get('employees', [EmployeeController::class, 'index'])->middleware('permission:employees.view');
        Route::post('employees', [EmployeeController::class, 'store'])->middleware('permission:employees.create');
        Route::post('employees/import', [EmployeeController::class, 'import'])->middleware('permission:employees.import');
        Route::get('employees/export', [EmployeeController::class, 'export'])->middleware('permission:employees.export');
        Route::get('employees/{employee}', [EmployeeController::class, 'show'])->middleware('permission:employees.view');
        Route::put('employees/{employee}', [EmployeeController::class, 'update'])->middleware('permission:employees.update');
        Route::patch('employees/{employee}', [EmployeeController::class, 'update'])->middleware('permission:employees.update');
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->middleware('permission:employees.delete');

        Route::get('attendance', [AttendanceController::class, 'index'])->middleware('permission:attendance.view');
        Route::get('attendance/summary', [AttendanceController::class, 'summary'])->middleware('permission:attendance.view');
        Route::post('attendance/check-in', [AttendanceController::class, 'checkIn'])->middleware('permission:attendance.manage');
        Route::put('attendance/{attendance}/check-out', [AttendanceController::class, 'checkOut'])->middleware('permission:attendance.manage');
        Route::get('attendance/{attendance}', [AttendanceController::class, 'show'])->middleware('permission:attendance.view');

        Route::get('leave-types', [LeaveTypeController::class, 'index'])->middleware('permission:leave.view');
        Route::post('leave-types', [LeaveTypeController::class, 'store'])->middleware('permission:leave.manage');
        Route::put('leave-types/{leaveType}', [LeaveTypeController::class, 'update'])->middleware('permission:leave.manage');
        Route::delete('leave-types/{leaveType}', [LeaveTypeController::class, 'destroy'])->middleware('permission:leave.manage');

        Route::get('leave-requests', [LeaveRequestController::class, 'index'])->middleware('permission:leave.view');
        Route::post('leave-requests', [LeaveRequestController::class, 'store'])->middleware('permission:leave.view');
        Route::get('leave-requests/{leaveRequest}', [LeaveRequestController::class, 'show'])->middleware('permission:leave.view');
        Route::put('leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])->middleware('permission:leave.manage');
        Route::put('leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])->middleware('permission:leave.manage');
        Route::delete('leave-requests/{leaveRequest}', [LeaveRequestController::class, 'destroy'])->middleware('permission:leave.manage');

        Route::get('announcements', [AnnouncementController::class, 'index'])->middleware('permission:announcements.view');
        Route::post('announcements', [AnnouncementController::class, 'store'])->middleware('permission:announcements.manage');
        Route::get('announcements/{announcement}', [AnnouncementController::class, 'show'])->middleware('permission:announcements.view');
        Route::put('announcements/{announcement}', [AnnouncementController::class, 'update'])->middleware('permission:announcements.manage');
        Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy'])->middleware('permission:announcements.manage');

        Route::get('calendar/events', [CalendarEventController::class, 'index'])->middleware('permission:calendar.view');
        Route::post('calendar/events', [CalendarEventController::class, 'store'])->middleware('permission:calendar.manage');
        Route::get('calendar/events/{event}', [CalendarEventController::class, 'show'])->middleware('permission:calendar.view');
        Route::put('calendar/events/{event}', [CalendarEventController::class, 'update'])->middleware('permission:calendar.manage');
        Route::patch('calendar/events/{event}', [CalendarEventController::class, 'update'])->middleware('permission:calendar.manage');
        Route::delete('calendar/events/{event}', [CalendarEventController::class, 'destroy'])->middleware('permission:calendar.manage');

        Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit.view');
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show'])->middleware('permission:audit.view');

        Route::put('profile', [AuthController::class, 'updateProfile']);

        // Shifts
        Route::get('shifts', [ShiftController::class, 'index'])->middleware('permission:shifts.view');
        Route::post('shifts', [ShiftController::class, 'store'])->middleware('permission:shifts.manage');
        Route::get('shifts/{shift}', [ShiftController::class, 'show'])->middleware('permission:shifts.view');
        Route::put('shifts/{shift}', [ShiftController::class, 'update'])->middleware('permission:shifts.manage');
        Route::delete('shifts/{shift}', [ShiftController::class, 'destroy'])->middleware('permission:shifts.manage');

        // Tasks
        Route::get('tasks', [TaskController::class, 'index'])->middleware('permission:tasks.view');
        Route::post('tasks', [TaskController::class, 'store'])->middleware('permission:tasks.manage');
        Route::get('tasks/{task}', [TaskController::class, 'show'])->middleware('permission:tasks.view');
        Route::put('tasks/{task}', [TaskController::class, 'update'])->middleware('permission:tasks.manage');
        Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->middleware('permission:tasks.manage');

        // HR Tickets
        Route::get('hr-tickets', [HrTicketController::class, 'index'])->middleware('permission:tickets.view');
        Route::post('hr-tickets', [HrTicketController::class, 'store'])->middleware('permission:tickets.view');
        Route::get('hr-tickets/{hrTicket}', [HrTicketController::class, 'show'])->middleware('permission:tickets.view');
        Route::put('hr-tickets/{hrTicket}', [HrTicketController::class, 'update'])->middleware('permission:tickets.manage');
        Route::delete('hr-tickets/{hrTicket}', [HrTicketController::class, 'destroy'])->middleware('permission:tickets.manage');

        // Payroll
        Route::get('payroll', [PayrollController::class, 'index'])->middleware('permission:payroll.view');
        Route::post('payroll', [PayrollController::class, 'store'])->middleware('permission:payroll.manage');
        Route::get('payroll/{payrollRun}', [PayrollController::class, 'show'])->middleware('permission:payroll.view');
        Route::put('payroll/{payrollRun}', [PayrollController::class, 'update'])->middleware('permission:payroll.manage');
        Route::post('payroll/{payrollRun}/process', [PayrollController::class, 'process'])->middleware('permission:payroll.manage');
        Route::delete('payroll/{payrollRun}', [PayrollController::class, 'destroy'])->middleware('permission:payroll.manage');

        // Expenses
        Route::get('expenses', [ExpenseController::class, 'index'])->middleware('permission:expenses.view');
        Route::post('expenses', [ExpenseController::class, 'store'])->middleware('permission:expenses.view');
        Route::get('expenses/{expense}', [ExpenseController::class, 'show'])->middleware('permission:expenses.view');
        Route::put('expenses/{expense}/approve', [ExpenseController::class, 'approve'])->middleware('permission:expenses.manage');
        Route::put('expenses/{expense}/reject', [ExpenseController::class, 'reject'])->middleware('permission:expenses.manage');
        Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->middleware('permission:expenses.manage');

        // Assets
        Route::get('assets', [AssetController::class, 'index'])->middleware('permission:assets.view');
        Route::post('assets', [AssetController::class, 'store'])->middleware('permission:assets.manage');
        Route::get('assets/{asset}', [AssetController::class, 'show'])->middleware('permission:assets.view');
        Route::put('assets/{asset}', [AssetController::class, 'update'])->middleware('permission:assets.manage');
        Route::delete('assets/{asset}', [AssetController::class, 'destroy'])->middleware('permission:assets.manage');

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index'])->middleware('permission:notifications.view');
        Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->middleware('permission:notifications.view');
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->middleware('permission:notifications.view');
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])->middleware('permission:notifications.manage');

        // Settings
        Route::get('settings', [SettingController::class, 'index'])->middleware('permission:settings.manage');
        Route::put('settings', [SettingController::class, 'update'])->middleware('permission:settings.manage');
        Route::get('settings/{key}', [SettingController::class, 'show'])->middleware('permission:settings.manage');

        // Recruitment
        Route::get('job-postings', [JobPostingController::class, 'index'])->middleware('permission:recruitment.view');
        Route::post('job-postings', [JobPostingController::class, 'store'])->middleware('permission:recruitment.manage');
        Route::get('job-postings/{jobPosting}', [JobPostingController::class, 'show'])->middleware('permission:recruitment.view');
        Route::put('job-postings/{jobPosting}', [JobPostingController::class, 'update'])->middleware('permission:recruitment.manage');
        Route::delete('job-postings/{jobPosting}', [JobPostingController::class, 'destroy'])->middleware('permission:recruitment.manage');

        Route::get('job-applications', [JobApplicationController::class, 'index'])->middleware('permission:recruitment.view');
        Route::post('job-applications', [JobApplicationController::class, 'store'])->middleware('permission:recruitment.manage');
        Route::get('job-applications/{jobApplication}', [JobApplicationController::class, 'show'])->middleware('permission:recruitment.view');
        Route::put('job-applications/{jobApplication}', [JobApplicationController::class, 'update'])->middleware('permission:recruitment.manage');
        Route::delete('job-applications/{jobApplication}', [JobApplicationController::class, 'destroy'])->middleware('permission:recruitment.manage');

        // Onboarding
        Route::get('onboarding', [OnboardingController::class, 'index'])->middleware('permission:onboarding.view');
        Route::post('onboarding', [OnboardingController::class, 'store'])->middleware('permission:onboarding.manage');
        Route::get('onboarding/{onboarding}', [OnboardingController::class, 'show'])->middleware('permission:onboarding.view');
        Route::put('onboarding/{onboarding}', [OnboardingController::class, 'update'])->middleware('permission:onboarding.manage');
        Route::put('onboarding-tasks/{task}/toggle', [OnboardingController::class, 'toggleTask'])->middleware('permission:onboarding.manage');
        Route::delete('onboarding/{onboarding}', [OnboardingController::class, 'destroy'])->middleware('permission:onboarding.manage');

        // Performance
        Route::get('performance', [PerformanceController::class, 'index'])->middleware('permission:performance.view');
        Route::post('performance', [PerformanceController::class, 'store'])->middleware('permission:performance.manage');
        Route::get('performance/{performance}', [PerformanceController::class, 'show'])->middleware('permission:performance.view');
        Route::put('performance/{performance}', [PerformanceController::class, 'update'])->middleware('permission:performance.manage');
        Route::delete('performance/{performance}', [PerformanceController::class, 'destroy'])->middleware('permission:performance.manage');

        // Documents
        Route::get('documents', [DocumentController::class, 'index'])->middleware('permission:documents.view');
        Route::post('documents', [DocumentController::class, 'store'])->middleware('permission:documents.manage');
        Route::get('documents/{document}', [DocumentController::class, 'show'])->middleware('permission:documents.view');
        Route::put('documents/{document}', [DocumentController::class, 'update'])->middleware('permission:documents.manage');
        Route::delete('documents/{document}', [DocumentController::class, 'destroy'])->middleware('permission:documents.manage');

        // Approvals
        Route::get('approvals', [ApprovalController::class, 'index'])->middleware('permission:approvals.view');
        Route::put('approvals/{type}/{id}/approve', [ApprovalController::class, 'approve'])->middleware('permission:approvals.manage');
        Route::put('approvals/{type}/{id}/reject', [ApprovalController::class, 'reject'])->middleware('permission:approvals.manage');

        // Reports
        Route::get('reports/summary', [ReportController::class, 'summary'])->middleware('permission:reports.view');
        Route::get('reports/department-headcount', [ReportController::class, 'departmentHeadcount'])->middleware('permission:reports.view');
        Route::get('reports/attendance-trend', [ReportController::class, 'attendanceTrend'])->middleware('permission:reports.view');
        Route::get('reports/payroll-summary', [ReportController::class, 'payrollSummary'])->middleware('permission:reports.view');
        Route::get('reports/performance-summary', [ReportController::class, 'performanceSummary'])->middleware('permission:reports.view');
    });
});
