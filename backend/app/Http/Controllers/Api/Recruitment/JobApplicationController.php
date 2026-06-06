<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruitment\StoreJobApplicationRequest;
use App\Http\Requests\Recruitment\UpdateJobApplicationRequest;
use App\Http\Resources\JobApplicationResource;
use App\Models\JobApplication;
use App\Services\RecruitmentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobApplicationController extends Controller
{
    public function __construct(private readonly RecruitmentService $recruitment) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->recruitment->paginateApplications($request->only(['search', 'status', 'job_posting_id', 'per_page']));

        return ApiResponse::success(
            JobApplicationResource::collection($paginated)->response()->getData(true)['data'],
            'Applications retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(JobApplication $jobApplication): JsonResponse
    {
        return ApiResponse::success(new JobApplicationResource($this->recruitment->findApplication($jobApplication->id)));
    }

    public function store(StoreJobApplicationRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new JobApplicationResource($this->recruitment->createApplication($request->validated())),
            'Application submitted.',
            201
        );
    }

    public function update(UpdateJobApplicationRequest $request, JobApplication $jobApplication): JsonResponse
    {
        return ApiResponse::success(
            new JobApplicationResource($this->recruitment->updateApplication($jobApplication, $request->validated())),
            'Application updated.'
        );
    }

    public function destroy(JobApplication $jobApplication): JsonResponse
    {
        $this->recruitment->deleteApplication($jobApplication);

        return ApiResponse::success(null, 'Application deleted.');
    }
}
