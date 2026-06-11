<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class AttendanceService
{
    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $query = Attendance::query()
            ->with(['employee.department', 'employee.position']);

        if ($user && ! $user->hasAnyRole(['Admin', 'HR'])) {
            if ($user->hasRole('Manager')) {
                $deptIds = $user->employee?->managedDepartmentIds() ?? [];
                $employeeId = $user->employee?->id;
                $query->where(function ($q) use ($deptIds, $employeeId) {
                    $q->whereHas('employee', fn ($e) => $e->whereIn('department_id', $deptIds));
                    if ($employeeId) {
                        $q->orWhere('employee_id', $employeeId);
                    }
                });
            } else {
                $query->where('employee_id', $user->employee?->id);
            }
        }

        $query->when($filters['employee_id'] ?? null, fn ($q, $id) => $q->where('employee_id', $id))
            ->when($filters['date'] ?? null, fn ($q, $date) => $q->whereDate('date', $date))
            ->when($filters['date_from'] ?? null, fn ($q, $date) => $q->whereDate('date', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($q, $date) => $q->whereDate('date', '<=', $date))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, function ($q, string $search) {
                $q->whereHas('employee', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                });
            });

        $sort = in_array($filters['sort'] ?? '', ['date', 'check_in', 'check_out', 'status', 'work_hours'], true)
            ? $filters['sort']
            : 'date';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $direction)->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function find(int $id): Attendance
    {
        return Attendance::with(['employee.department', 'employee.position'])->findOrFail($id);
    }

    public function checkIn(array $data): Attendance
    {
        $date = $data['date'] ?? now()->toDateString();
        $checkIn = $data['check_in'] ?? now();

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $data['employee_id'],
                'date' => $date,
            ],
            [
                'check_in' => $checkIn,
                'check_in_method' => $data['check_in_method'] ?? 'manual',
                'check_in_note' => $data['check_in_note'] ?? null,
                'status' => $this->determineStatus($checkIn),
            ]
        );

        return $attendance->load(['employee.department', 'employee.position']);
    }

    public function checkOut(Attendance $attendance, array $data): Attendance
    {
        $checkOut = $data['check_out'] ?? now();

        $workHours = $attendance->check_in
            ? round(Carbon::parse($attendance->check_in)->diffInMinutes(Carbon::parse($checkOut)) / 60, 2)
            : 0;

        $regularHours = config('payroll.regular_hours_per_day', 8);
        $overtimeHours = max(0, $workHours - $regularHours);

        $attendance->update([
            'check_out' => $checkOut,
            'check_out_method' => $data['check_out_method'] ?? 'manual',
            'check_out_note' => $data['check_out_note'] ?? null,
            'work_hours' => $workHours,
            'overtime_hours' => $overtimeHours,
        ]);

        return $attendance->load(['employee.department', 'employee.position']);
    }

    public function todaySummary(): array
    {
        $today = now()->toDateString();

        return [
            'total_checked_in' => Attendance::whereDate('date', $today)->count(),
            'total_checked_out' => Attendance::whereDate('date', $today)->whereNotNull('check_out')->count(),
            'total_late' => Attendance::whereDate('date', $today)->where('status', 'late')->count(),
            'total_on_time' => Attendance::whereDate('date', $today)->where('status', 'present')->count(),
        ];
    }

    private function determineStatus(mixed $checkIn): string
    {
        $checkInTime = Carbon::parse($checkIn);
        $startOfWork = $checkInTime->copy()->setTime(8, 0);

        return $checkInTime->greaterThan($startOfWork) ? 'late' : 'present';
    }
}
