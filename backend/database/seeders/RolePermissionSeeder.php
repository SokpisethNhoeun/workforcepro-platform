<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'dashboard.view',
            'employees.view',
            'employees.create',
            'employees.update',
            'employees.delete',
            'employees.import',
            'employees.export',
            'departments.view',
            'departments.manage',
            'attendance.view',
            'attendance.manage',
            'shifts.view',
            'shifts.manage',
            'tasks.view',
            'tasks.manage',
            'leave.view',
            'leave.manage',
            'payroll.view',
            'payroll.manage',
            'recruitment.view',
            'recruitment.manage',
            'onboarding.view',
            'onboarding.manage',
            'performance.view',
            'performance.manage',
            'calendar.view',
            'calendar.manage',
            'announcements.view',
            'announcements.manage',
            'tickets.view',
            'tickets.manage',
            'documents.view',
            'documents.manage',
            'assets.view',
            'assets.manage',
            'expenses.view',
            'expenses.manage',
            'approvals.view',
            'approvals.manage',
            'reports.view',
            'reports.export',
            'notifications.view',
            'notifications.manage',
            'audit.view',
            'roles.view',
            'roles.manage',
            'roles.assign',
            'settings.manage',
            'system.health',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $hr = Role::firstOrCreate(['name' => 'HR', 'guard_name' => 'web']);
        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $employee = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);

        $admin->syncPermissions($permissions);
        $hr->syncPermissions(array_filter(
            $permissions,
            fn ($permission) => ! str_starts_with($permission, 'settings.')
                && ! str_starts_with($permission, 'roles.')
                && $permission !== 'system.health'
        ));
        $manager->syncPermissions([
            'dashboard.view',
            'employees.view',
            'attendance.view',
            'tasks.view',
            'tasks.manage',
            'leave.view',
            'leave.manage',
            'performance.view',
            'performance.manage',
            'calendar.view',
            'reports.view',
            'approvals.view',
            'approvals.manage',
            'notifications.view',
        ]);
        $employee->syncPermissions([
            'dashboard.view',
            'attendance.view',
            'tasks.view',
            'leave.view',
            'calendar.view',
            'documents.view',
            'notifications.view',
        ]);
    }
}
