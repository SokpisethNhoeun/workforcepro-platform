<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Annual Leave', 'code' => 'annual', 'days_per_year' => 18, 'is_paid' => true, 'description' => 'Cambodian labor law mandates 18 days per year'],
            ['name' => 'Sick Leave', 'code' => 'sick', 'days_per_year' => 30, 'is_paid' => true, 'description' => 'Up to 30 days with medical certificate'],
            ['name' => 'Maternity Leave', 'code' => 'maternity', 'days_per_year' => 90, 'is_paid' => true, 'description' => '90 days maternity leave per Cambodian law'],
            ['name' => 'Personal Leave', 'code' => 'personal', 'days_per_year' => 7, 'is_paid' => false, 'description' => 'Unpaid personal leave'],
            ['name' => 'Public Holiday', 'code' => 'holiday', 'days_per_year' => 0, 'is_paid' => true, 'requires_approval' => false, 'description' => 'Cambodian public holidays'],
        ];

        foreach ($types as $type) {
            LeaveType::firstOrCreate(['code' => $type['code']], $type);
        }
    }
}
