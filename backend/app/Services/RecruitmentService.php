<?php

namespace App\Services;

use App\Models\JobApplication;
use App\Models\JobPosting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RecruitmentService
{
    public function paginatePostings(array $filters): LengthAwarePaginator
    {
        return JobPosting::query()
            ->with('department')
            ->withCount('applications')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['department_id'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function findPosting(int $id): JobPosting
    {
        return JobPosting::with(['department', 'applications'])->findOrFail($id);
    }

    public function createPosting(array $data): JobPosting
    {
        return JobPosting::create($data)->load('department');
    }

    public function updatePosting(JobPosting $posting, array $data): JobPosting
    {
        $posting->update($data);

        return $posting->fresh()->load('department');
    }

    public function deletePosting(JobPosting $posting): void
    {
        $posting->delete();
    }

    public function paginateApplications(array $filters): LengthAwarePaginator
    {
        return JobApplication::query()
            ->with('jobPosting')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('applicant_name', 'like', "%{$s}%"))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['job_posting_id'] ?? null, fn ($q, $v) => $q->where('job_posting_id', $v))
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function findApplication(int $id): JobApplication
    {
        return JobApplication::with('jobPosting')->findOrFail($id);
    }

    public function createApplication(array $data): JobApplication
    {
        return JobApplication::create($data)->load('jobPosting');
    }

    public function updateApplication(JobApplication $application, array $data): JobApplication
    {
        $application->update($data);

        return $application->fresh()->load('jobPosting');
    }

    public function deleteApplication(JobApplication $application): void
    {
        $application->delete();
    }
}
