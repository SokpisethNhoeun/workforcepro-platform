<?php

namespace App\Services;

use App\Enums\ApprovalStatus;
use App\Models\ApprovalLog;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ApprovalService
{
    public function canApprove(User $user, Model $approvable): bool
    {
        if (! $this->isSupported($approvable) || ! $this->isPending($approvable)) {
            return false;
        }

        if ($this->isSelfApproval($user, $approvable)) {
            return false;
        }

        if (! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            return false;
        }

        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $this->isInManagedDepartment($user, $approvable);
    }

    public function approve(Model $approvable, User $approver, ?string $comments = null): Model
    {
        return DB::transaction(function () use ($approvable, $approver, $comments) {
            $approvable = $this->lockFresh($approvable);
            $this->ensureCanApprove($approver, $approvable);

            $updates = [
                'status' => ApprovalStatus::Approved,
                'approved_by' => $approver->id,
                'responded_at' => now(),
            ];

            if ($this->supportsRejectionReason($approvable)) {
                $updates['rejection_reason'] = null;
            }

            $approvable->update($updates);
            $this->recordLog($approvable, $approver, ApprovalStatus::Approved->value, $comments);

            return $this->freshWithRelations($approvable);
        });
    }

    public function reject(Model $approvable, User $approver, string $reason): Model
    {
        $reason = trim($reason);

        if ($reason === '') {
            throw ValidationException::withMessages([
                'comments' => ['A rejection reason is required.'],
            ]);
        }

        return DB::transaction(function () use ($approvable, $approver, $reason) {
            $approvable = $this->lockFresh($approvable);
            $this->ensureCanApprove($approver, $approvable);

            $updates = [
                'status' => ApprovalStatus::Rejected,
                'approved_by' => $approver->id,
                'responded_at' => now(),
            ];

            if ($this->supportsRejectionReason($approvable)) {
                $updates['rejection_reason'] = $reason;
            }

            $approvable->update($updates);
            $this->recordLog($approvable, $approver, ApprovalStatus::Rejected->value, $reason);

            return $this->freshWithRelations($approvable);
        });
    }

    /**
     * @return Collection<int, LeaveRequest|Expense>
     */
    public function getPendingForApprover(User $user): Collection
    {
        $leaveRequests = LeaveRequest::query()
            ->with(['employee.department', 'leaveType'])
            ->pending()
            ->forApprover($user)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $expenses = Expense::query()
            ->with(['employee.department'])
            ->pending()
            ->forApprover($user)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return $leaveRequests
            ->concat($expenses)
            ->sortByDesc(fn (Model $item) => $item->created_at?->getTimestamp() ?? 0)
            ->values();
    }

    private function ensureCanApprove(User $user, Model $approvable): void
    {
        if (! $this->isSupported($approvable)) {
            throw new AuthorizationException('This approval item type is not supported.');
        }

        if (! $this->isPending($approvable)) {
            throw new ConflictHttpException('This approval item has already been processed.');
        }

        if ($this->isSelfApproval($user, $approvable)) {
            throw new AuthorizationException('You cannot approve your own request.');
        }

        if (! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            throw new AuthorizationException('You are not allowed to approve this item.');
        }

        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return;
        }

        if (! $this->isInManagedDepartment($user, $approvable)) {
            throw new AuthorizationException('You are not allowed to approve items outside your department chain.');
        }
    }

    private function isSupported(Model $approvable): bool
    {
        return $approvable instanceof LeaveRequest || $approvable instanceof Expense;
    }

    private function isPending(Model $approvable): bool
    {
        $status = $approvable->getAttribute('status');

        if ($status instanceof ApprovalStatus) {
            return $status === ApprovalStatus::Pending;
        }

        return $status === ApprovalStatus::Pending->value;
    }

    private function isSelfApproval(User $user, Model $approvable): bool
    {
        return $this->employeeFor($approvable)?->user_id === $user->id;
    }

    private function isInManagedDepartment(User $user, Model $approvable): bool
    {
        $departmentId = $this->employeeFor($approvable)?->department_id;

        if (! $departmentId) {
            return false;
        }

        $managedDepartmentIds = $user->employee?->managedDepartmentIds() ?? [];

        return in_array($departmentId, $managedDepartmentIds, true);
    }

    private function employeeFor(Model $approvable): ?Employee
    {
        if (! method_exists($approvable, 'employee')) {
            return null;
        }

        $approvable->loadMissing('employee');

        return $approvable->getRelationValue('employee');
    }

    private function lockFresh(Model $approvable): Model
    {
        return $approvable->newQuery()
            ->whereKey($approvable->getKey())
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function supportsRejectionReason(Model $approvable): bool
    {
        return in_array('rejection_reason', $approvable->getFillable(), true);
    }

    /**
     * @return array<int, string>
     */
    private function relationsFor(Model $approvable): array
    {
        return match (true) {
            $approvable instanceof LeaveRequest => ['employee.department', 'leaveType', 'approver'],
            $approvable instanceof Expense => ['employee.department', 'approver'],
            default => [],
        };
    }

    private function freshWithRelations(Model $approvable): Model
    {
        return $approvable->fresh($this->relationsFor($approvable))
            ?? $approvable->load($this->relationsFor($approvable));
    }

    private function recordLog(Model $approvable, User $approver, string $action, ?string $comments): void
    {
        ApprovalLog::create([
            'approvable_type' => $approvable->getMorphClass(),
            'approvable_id' => $approvable->getKey(),
            'user_id' => $approver->id,
            'action' => $action,
            'comments' => $comments,
        ]);
    }
}
