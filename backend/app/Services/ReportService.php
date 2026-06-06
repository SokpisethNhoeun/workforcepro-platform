<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\LeaveRequest;
use App\Models\PayrollRun;
use App\Models\PerformanceHistory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function summary(): array
    {
        return [
            'employees' => [
                'total' => Employee::count(),
                'active' => Employee::where('status', 'active')->count(),
                'on_probation' => Employee::whereNotNull('probation_ends_at')->where('probation_ends_at', '>', now())->count(),
            ],
            'attendance' => [
                'today_present' => Attendance::whereDate('date', today())->count(),
                'today_late' => Attendance::whereDate('date', today())->where('status', 'late')->count(),
            ],
            'leave' => [
                'pending' => LeaveRequest::where('status', 'pending')->count(),
                'approved_this_month' => LeaveRequest::where('status', 'approved')->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
            ],
            'expenses' => [
                'pending_amount' => (float) Expense::where('status', 'pending')->sum('amount'),
                'approved_this_month' => (float) Expense::where('status', 'approved')->whereMonth('responded_at', now()->month)->whereYear('responded_at', now()->year)->sum('amount'),
            ],
            'payroll' => [
                'last_run' => PayrollRun::orderByDesc('run_date')->first()?->period,
            ],
        ];
    }

    public function departmentHeadcount(): Collection
    {
        return DB::table('employees')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->where('employees.status', 'active')
            ->whereNull('employees.deleted_at')
            ->select('departments.name as department', DB::raw('COUNT(*) as count'))
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->get();
    }

    public function attendanceTrend(int $days = 30): Collection
    {
        return Attendance::query()
            ->where('date', '>=', now()->subDays($days))
            ->select('date', DB::raw('COUNT(*) as total'), DB::raw("SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late_count"))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    public function payrollSummary(): array
    {
        $runs = PayrollRun::orderByDesc('run_date')->limit(12)->get();

        return [
            'runs' => $runs,
            'total_this_year' => (float) PayrollRun::whereYear('run_date', now()->year)->sum('total_amount'),
        ];
    }

    public function performanceSummary(): array
    {
        return [
            'average_score' => (float) PerformanceHistory::avg('score'),
            'total_reviews' => PerformanceHistory::count(),
            'by_period' => PerformanceHistory::select('period', DB::raw('AVG(score) as avg_score'), DB::raw('COUNT(*) as count'))
                ->groupBy('period')
                ->orderByDesc('period')
                ->limit(6)
                ->get(),
        ];
    }
}
