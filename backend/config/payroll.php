<?php

return [
    'country' => 'Cambodia',
    'currency' => env('PAYROLL_CURRENCY', 'USD'),
    'work_days_per_month' => 26,
    'regular_hours_per_day' => 8,
    'overtime' => [
        'regular_day_multiplier' => 1.5,
        'weekly_rest_day_multiplier' => 2.0,
        'public_holiday_multiplier' => 2.0,
        'night_work_multiplier' => 1.3,
    ],
    'withholding_tax_brackets_khr' => [
        ['from' => 0, 'to' => 1500000, 'rate' => 0, 'deduction' => 0],
        ['from' => 1500001, 'to' => 2000000, 'rate' => 0.05, 'deduction' => 75000],
        ['from' => 2000001, 'to' => 8500000, 'rate' => 0.10, 'deduction' => 175000],
        ['from' => 8500001, 'to' => 12500000, 'rate' => 0.15, 'deduction' => 600000],
        ['from' => 12500001, 'to' => null, 'rate' => 0.20, 'deduction' => 1225000],
    ],
];
