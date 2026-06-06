<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'company_name', 'value' => 'WorkforcePro Inc.', 'group' => 'general', 'type' => 'string'],
            ['key' => 'company_email', 'value' => 'hr@workforcepro.com', 'group' => 'general', 'type' => 'string'],
            ['key' => 'timezone', 'value' => 'Asia/Phnom_Penh', 'group' => 'general', 'type' => 'string'],
            ['key' => 'currency', 'value' => 'USD', 'group' => 'general', 'type' => 'string'],
            ['key' => 'work_start_time', 'value' => '08:00', 'group' => 'attendance', 'type' => 'string'],
            ['key' => 'work_end_time', 'value' => '17:00', 'group' => 'attendance', 'type' => 'string'],
            ['key' => 'late_threshold_minutes', 'value' => '15', 'group' => 'attendance', 'type' => 'integer'],
            ['key' => 'max_annual_leave_days', 'value' => '20', 'group' => 'leave', 'type' => 'integer'],
            ['key' => 'probation_period_months', 'value' => '3', 'group' => 'employees', 'type' => 'integer'],
            ['key' => 'payroll_day', 'value' => '25', 'group' => 'payroll', 'type' => 'integer'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
