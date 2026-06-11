<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = ['employee_id', 'approved_by', 'category', 'description', 'amount', 'currency', 'receipt_path', 'status', 'expense_date', 'responded_at'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
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

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
