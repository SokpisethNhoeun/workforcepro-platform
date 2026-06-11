<?php

namespace Tests\Feature;

use App\Enums\ApprovalStatus;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Services\ApprovalService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Tests\TestCase;

class ApprovalServiceTest extends TestCase
{
    use RefreshDatabase;

    private int $employeeSequence = 1;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_manager_only_sees_pending_items_in_managed_departments(): void
    {
        $manager = $this->userWithRole('Manager');
        $managedDepartment = $this->createDepartment('ENG', $manager);
        $outsideDepartment = $this->createDepartment('FIN');
        $managerEmployee = $this->createEmployee($manager, $managedDepartment);

        $managedLeave = $this->createLeaveRequest($this->createEmployee(null, $managedDepartment));
        $outsideLeave = $this->createLeaveRequest($this->createEmployee(null, $outsideDepartment));
        $ownLeave = $this->createLeaveRequest($managerEmployee);

        $pending = app(ApprovalService::class)->getPendingForApprover($manager);

        $this->assertTrue($pending->contains(fn ($item) => $item instanceof LeaveRequest && $item->id === $managedLeave->id));
        $this->assertFalse($pending->contains(fn ($item) => $item instanceof LeaveRequest && $item->id === $outsideLeave->id));
        $this->assertFalse($pending->contains(fn ($item) => $item instanceof LeaveRequest && $item->id === $ownLeave->id));
    }

    public function test_approve_updates_status_and_writes_audit_log(): void
    {
        $manager = $this->userWithRole('Manager');
        $department = $this->createDepartment('OPS', $manager);
        $this->createEmployee($manager, $department);
        $leaveRequest = $this->createLeaveRequest($this->createEmployee(null, $department));

        $approved = app(ApprovalService::class)->approve($leaveRequest, $manager, 'Looks good.');

        $this->assertSame(ApprovalStatus::Approved, $approved->status);
        $this->assertSame($manager->id, $approved->approved_by);
        $this->assertNotNull($approved->responded_at);
        $this->assertDatabaseHas('approval_logs', [
            'approvable_type' => LeaveRequest::class,
            'approvable_id' => $leaveRequest->id,
            'user_id' => $manager->id,
            'action' => 'approved',
            'comments' => 'Looks good.',
        ]);
    }

    public function test_reject_updates_status_and_writes_audit_log(): void
    {
        $manager = $this->userWithRole('Manager');
        $department = $this->createDepartment('MKT', $manager);
        $this->createEmployee($manager, $department);
        $expense = $this->createExpense($this->createEmployee(null, $department));

        $rejected = app(ApprovalService::class)->reject($expense, $manager, 'Missing receipt.');

        $this->assertSame(ApprovalStatus::Rejected, $rejected->status);
        $this->assertSame($manager->id, $rejected->approved_by);
        $this->assertNotNull($rejected->responded_at);
        $this->assertDatabaseHas('approval_logs', [
            'approvable_type' => Expense::class,
            'approvable_id' => $expense->id,
            'user_id' => $manager->id,
            'action' => 'rejected',
            'comments' => 'Missing receipt.',
        ]);
    }

    public function test_processed_item_cannot_be_approved_again(): void
    {
        $manager = $this->userWithRole('Manager');
        $department = $this->createDepartment('QA', $manager);
        $this->createEmployee($manager, $department);
        $leaveRequest = $this->createLeaveRequest($this->createEmployee(null, $department));
        $service = app(ApprovalService::class);

        $service->approve($leaveRequest, $manager);

        $this->expectException(ConflictHttpException::class);

        $service->approve($leaveRequest, $manager);
    }

    public function test_user_cannot_self_approve_even_as_admin(): void
    {
        $admin = $this->userWithRole('Admin');
        $department = $this->createDepartment('HRD');
        $employee = $this->createEmployee($admin, $department);
        $leaveRequest = $this->createLeaveRequest($employee);

        $this->expectException(AuthorizationException::class);

        app(ApprovalService::class)->approve($leaveRequest, $admin);
    }

    private function userWithRole(string $roleName): User
    {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

        $user = User::factory()->create();
        $user->assignRole($roleName);

        return $user;
    }

    private function createDepartment(string $code, ?User $manager = null): Department
    {
        return Department::create([
            'name' => "{$code} Department",
            'code' => $code,
            'manager_user_id' => $manager?->id,
        ]);
    }

    private function createEmployee(?User $user, Department $department): Employee
    {
        $sequence = $this->employeeSequence++;

        return Employee::create([
            'user_id' => $user?->id,
            'department_id' => $department->id,
            'employee_code' => sprintf('EMP%03d', $sequence),
            'first_name' => 'Employee',
            'last_name' => (string) $sequence,
        ]);
    }

    private function createLeaveRequest(Employee $employee): LeaveRequest
    {
        $leaveType = LeaveType::firstOrCreate(
            ['code' => 'ANNUAL'],
            ['name' => 'Annual Leave', 'days_per_year' => 18]
        );

        return LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'total_days' => 2,
            'status' => ApprovalStatus::Pending,
            'reason' => 'Family trip',
        ]);
    }

    private function createExpense(Employee $employee): Expense
    {
        return Expense::create([
            'employee_id' => $employee->id,
            'category' => 'travel',
            'description' => 'Taxi',
            'amount' => 25,
            'currency' => 'USD',
            'status' => ApprovalStatus::Pending,
            'expense_date' => now()->toDateString(),
        ]);
    }
}
