<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $password = config('auth.seed_user_password');

        if (! is_string($password) || $password === '') {
            throw new RuntimeException('SEED_USER_PASSWORD must be configured before running EmployeeSeeder.');
        }

        $users = [
            ['role' => 'Admin', 'name' => 'Workforce Admin', 'email' => 'ahboy5518@gmail.com', 'code' => 'WFP-0001', 'department' => 'HR', 'position' => 'HR-DIR'],
            ['role' => 'HR', 'name' => 'Sokha HR', 'email' => 'ahboy5519@gmail.com', 'code' => 'WFP-0002', 'department' => 'HR', 'position' => 'HR-SPEC'],
            ['role' => 'Manager', 'name' => 'Dara Manager', 'email' => 'ahboy1819@gmail.com', 'code' => 'WFP-0003', 'department' => 'OPS', 'position' => 'OPS-MGR'],
            ['role' => 'Admin', 'name' => 'Sokpiseth Admin', 'email' => 'sokpisethnhom09631@gmail.com', 'code' => 'WFP-0004', 'department' => 'ENG', 'position' => 'ENG-SE'],
        ];

        $active = EmploymentStatus::where('code', 'active')->first();
        $managerEmployee = null;

        foreach ($users as $index => $seed) {
            $user = User::updateOrCreate(
                ['email' => $seed['email']],
                [
                    'name' => $seed['name'],
                    'phone' => '+855 12 000 00'.$index,
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ],
            );
            $user->syncRoles([$seed['role']]);

            $department = Department::where('code', $seed['department'])->first();
            $position = Position::where('code', $seed['position'])->first();
            $name = explode(' ', $seed['name'], 2);

            $employee = Employee::updateOrCreate(
                ['employee_code' => $seed['code']],
                [
                    'user_id' => $user->id,
                    'department_id' => $department?->id,
                    'position_id' => $position?->id,
                    'employment_status_id' => $active?->id,
                    'manager_id' => $seed['role'] === 'Employee' ? $managerEmployee?->id : null,
                    'first_name' => $name[0],
                    'last_name' => $name[1] ?? $seed['role'],
                    'work_email' => $seed['email'],
                    'phone' => $user->phone,
                    'hired_at' => now()->subMonths(12 - $index)->toDateString(),
                    'base_salary' => [3200, 1450, 2100, 1600][$index],
                    'salary_currency' => 'USD',
                    'status' => 'active',
                ],
            );

            $employee->emergencyContacts()->updateOrCreate(
                ['name' => 'Primary Contact'],
                ['relationship' => 'Family', 'phone' => '+855 99 000 00'.$index, 'is_primary' => true],
            );

            $employee->contracts()->updateOrCreate(
                ['contract_number' => 'CNT-'.$seed['code']],
                [
                    'type' => 'full_time',
                    'start_date' => $employee->hired_at,
                    'salary' => $employee->base_salary,
                    'salary_currency' => 'USD',
                    'status' => 'active',
                ],
            );

            if ($seed['role'] === 'Manager') {
                $managerEmployee = $employee;
            }
        }
    }
}
