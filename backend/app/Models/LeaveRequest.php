<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'approved_by',
        'start_date',
        'end_date',
        'total_days',
        'status',
        'reason',
        'rejection_reason',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'total_days' => 'decimal:1',
            'status' => ApprovalStatus::class,
            'responded_at' => 'datetime',
        ];
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', ApprovalStatus::Pending->value);
    }

    public function scopeForApprover(Builder $query, User $user): Builder
    {
        if (! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            return $query->whereRaw('1 = 0');
        }

        $query->whereHas('employee', function (Builder $employeeQuery) use ($user) {
            $employeeQuery
                ->whereNull('user_id')
                ->orWhere('user_id', '!=', $user->id);
        });

        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return $query;
        }

        $departmentIds = $user->employee?->managedDepartmentIds() ?? [];

        if ($departmentIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas('employee', function (Builder $employeeQuery) use ($departmentIds) {
            $employeeQuery->whereIn('department_id', $departmentIds);
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
