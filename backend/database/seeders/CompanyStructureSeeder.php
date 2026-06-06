<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\EmploymentStatus;
use App\Models\Position;
use Illuminate\Database\Seeder;

class CompanyStructureSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Human Resources', 'code' => 'HR'],
            ['name' => 'Finance', 'code' => 'FIN'],
            ['name' => 'Operations', 'code' => 'OPS'],
            ['name' => 'Engineering', 'code' => 'ENG'],
        ] as $department) {
            Department::firstOrCreate(['code' => $department['code']], $department);
        }

        foreach ([
            ['name' => 'Active', 'code' => 'active'],
            ['name' => 'Probation', 'code' => 'probation'],
            ['name' => 'Suspended', 'code' => 'suspended'],
            ['name' => 'Terminated', 'code' => 'terminated'],
        ] as $status) {
            EmploymentStatus::firstOrCreate(['code' => $status['code']], $status);
        }

        $positions = [
            ['department' => 'HR', 'title' => 'HR Director', 'code' => 'HR-DIR', 'min_salary' => 2200, 'max_salary' => 4200],
            ['department' => 'HR', 'title' => 'HR Specialist', 'code' => 'HR-SPEC', 'min_salary' => 900, 'max_salary' => 1800],
            ['department' => 'FIN', 'title' => 'Payroll Manager', 'code' => 'FIN-PAY', 'min_salary' => 1200, 'max_salary' => 2600],
            ['department' => 'OPS', 'title' => 'Operations Manager', 'code' => 'OPS-MGR', 'min_salary' => 1400, 'max_salary' => 3000],
            ['department' => 'ENG', 'title' => 'Software Engineer', 'code' => 'ENG-SE', 'min_salary' => 1300, 'max_salary' => 3500],
        ];

        foreach ($positions as $position) {
            $department = Department::where('code', $position['department'])->first();
            Position::firstOrCreate(
                ['code' => $position['code']],
                [
                    'department_id' => $department?->id,
                    'title' => $position['title'],
                    'min_salary' => $position['min_salary'],
                    'max_salary' => $position['max_salary'],
                ],
            );
        }
    }
}
