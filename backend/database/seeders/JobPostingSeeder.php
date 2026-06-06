<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\JobPosting;
use Illuminate\Database\Seeder;

class JobPostingSeeder extends Seeder
{
    public function run(): void
    {
        $dept = Department::first();

        $postings = [
            ['title' => 'Senior Software Engineer', 'department_id' => $dept?->id, 'description' => 'We are looking for an experienced software engineer to join our team.', 'requirements' => '5+ years experience, Laravel, React', 'employment_type' => 'full_time', 'salary_min' => 80000, 'salary_max' => 120000, 'status' => 'open'],
            ['title' => 'HR Coordinator', 'department_id' => $dept?->id, 'description' => 'Looking for an HR coordinator to manage day-to-day operations.', 'requirements' => '2+ years HR experience', 'employment_type' => 'full_time', 'salary_min' => 45000, 'salary_max' => 65000, 'status' => 'open'],
            ['title' => 'Marketing Intern', 'department_id' => $dept?->id, 'description' => 'Summer internship opportunity for marketing students.', 'requirements' => 'Currently enrolled in marketing or communications program', 'employment_type' => 'internship', 'salary_min' => 15000, 'salary_max' => 20000, 'status' => 'draft'],
        ];

        foreach ($postings as $posting) {
            JobPosting::firstOrCreate(['title' => $posting['title']], $posting);
        }
    }
}
