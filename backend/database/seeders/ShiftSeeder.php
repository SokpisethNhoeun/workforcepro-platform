<?php

namespace Database\Seeders;

use App\Models\Shift;
use Illuminate\Database\Seeder;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        $shifts = [
            ['name' => 'Morning Shift', 'start_time' => '06:00', 'end_time' => '14:00', 'break_minutes' => 30, 'days_of_week' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'is_active' => true],
            ['name' => 'Day Shift', 'start_time' => '08:00', 'end_time' => '17:00', 'break_minutes' => 60, 'days_of_week' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'is_active' => true],
            ['name' => 'Evening Shift', 'start_time' => '14:00', 'end_time' => '22:00', 'break_minutes' => 30, 'days_of_week' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'is_active' => true],
            ['name' => 'Night Shift', 'start_time' => '22:00', 'end_time' => '06:00', 'break_minutes' => 30, 'days_of_week' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 'is_active' => true],
            ['name' => 'Flexible Hours', 'start_time' => '09:00', 'end_time' => '18:00', 'break_minutes' => 60, 'days_of_week' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'is_active' => true],
        ];

        foreach ($shifts as $shift) {
            Shift::firstOrCreate(['name' => $shift['name']], $shift);
        }
    }
}
